#!/usr/bin/env node
/**
 * Production server: marketing site (`site/`) on public paths + Remix app.
 *
 * App Store Website / Privacy / Support / Terms hit this origin. Serving the
 * polished `site/` HTML here means reviewers never see stale Cloudflare Pages
 * waitlist copy when Partner URLs point at Fly.
 *
 * Shopify app paths (`/app`, `/auth`, `/api`, `/v1`, `/webhooks`, `/health`)
 * always go to Remix. Missing `site/` files fall through to Remix
 * (OriginShell trust pages).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { createRequestHandler } from "@react-router/express";
import { createRequestListener } from "@mjackson/node-fetch-server";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";
import {
  embeddedAppRedirectLocation,
  isShopifyAppPath,
  shouldSkipMarketingSite,
} from "./shopify-app-path.mjs";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    if (!source.startsWith("file://")) return null;
    const filePath = url.fileURLToPath(source);
    const sourceMapPath = `${filePath}.map`;
    if (fs.existsSync(sourceMapPath)) {
      return {
        url: source,
        map: fs.readFileSync(sourceMapPath, "utf8"),
      };
    }
    return null;
  },
});

function isRSCServerBuild(build) {
  return Boolean(
    typeof build === "object" &&
      build &&
      "default" in build &&
      typeof build.default === "object" &&
      build.default &&
      "fetch" in build.default &&
      typeof build.default.fetch === "function",
  );
}

function parseNumber(raw) {
  if (raw === undefined) return undefined;
  const maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

function resolveSiteRoot() {
  if (process.env.MCFLY_SITE_ROOT?.trim()) {
    return path.resolve(process.env.MCFLY_SITE_ROOT.trim());
  }
  return path.resolve(process.cwd(), "../site");
}

async function run() {
  const port = parseNumber(process.env.PORT) ?? 3000;
  const buildPathArg = process.argv[2] || "./build/server/index.js";
  const buildPath = path.resolve(buildPathArg);
  const buildModule = await import(url.pathToFileURL(buildPath).href);
  let build;
  let isRSCBuild = false;
  if ((isRSCBuild = isRSCServerBuild(buildModule))) {
    const config = {
      publicPath: "/",
      assetsBuildDirectory: path.join("..", "client"),
      ...buildModule.unstable_reactRouterServeConfig || {},
    };
    build = {
      fetch: buildModule.default.fetch,
      publicPath: config.publicPath,
      assetsBuildDirectory: path.resolve(
        path.dirname(buildPath),
        config.assetsBuildDirectory,
      ),
    };
  } else {
    build = buildModule;
  }

  const siteRoot = resolveSiteRoot();
  const siteMounted = fs.existsSync(siteRoot);

  const onListen = () => {
    const address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes("4") && !ip?.internal)
        ?.address;
    const origin = address
      ? `http://localhost:${port} (http://${address}:${port})`
      : `http://localhost:${port}`;
    console.log(`[mcfly-serve] ${origin}`);
    if (siteMounted) {
      console.log(`[mcfly-serve] marketing site ${siteRoot}`);
    } else {
      console.warn(
        `[mcfly-serve] marketing site missing at ${siteRoot}; Remix OriginShell fallback`,
      );
    }
  };

  const app = express();
  app.disable("x-powered-by");
  if (!isRSCBuild) {
    app.use(compression());
  }

  if (siteMounted) {
    const siteStatic = express.static(siteRoot, {
      extensions: ["html"],
      index: "index.html",
      fallthrough: true,
      maxAge: "1h",
      dotfiles: "ignore",
    });
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (isShopifyAppPath(req.path)) return next();
      // Open app / install / billing return: App URL is `/` with shop+host.
      // Static index.html ignores the query and would iframe the marketing site.
      if (shouldSkipMarketingSite(req)) {
        res.setHeader("Cache-Control", "private, no-store");
        return res.redirect(302, embeddedAppRedirectLocation(req));
      }
      return siteStatic(req, res, next);
    });
  }

  app.use(
    path.posix.join(build.publicPath, "assets"),
    express.static(path.join(build.assetsBuildDirectory, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(build.publicPath, express.static(build.assetsBuildDirectory));
  app.use(express.static("public", { maxAge: "1h" }));
  app.use(morgan("tiny"));
  if (build.fetch) {
    app.all("*", createRequestListener(build.fetch));
  } else {
    app.all(
      "*",
      createRequestHandler({
        build: buildModule,
        mode: process.env.NODE_ENV,
      }),
    );
  }

  const server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);
  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}

await run();
