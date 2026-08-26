/**
 * @vitest-environment jsdom
 *
 * A loader that throws must land on the desk's own error panel, not React
 * Router's "Unexpected Application Error" white screen.
 *
 * Scope worth stating: this covers errors the server actually serialized. It
 * cannot cover a proxy timeout — when Fly answers a `.data` request with an
 * HTML 502 the single-fetch client fails to decode it before any boundary
 * runs. Keeping loaders fast is the fix for that, not this.
 */
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { StrictMode, act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createRoutesStub } from "react-router";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * `app.tsx` builds the Shopify client at module load, so the route is imported
 * dynamically once the config it validates is present. Nothing here connects.
 */
let ErrorBoundary: ComponentType;

beforeAll(async () => {
  process.env.SHOPIFY_API_KEY ??= "test-key";
  process.env.SHOPIFY_API_SECRET ??= "test-secret";
  process.env.SHOPIFY_APP_URL ??= "https://example.test";
  process.env.SCOPES ??= "read_orders";
  process.env.DATABASE_URL ??= "postgresql://u:p@localhost:5432/test";
  ({ ErrorBoundary } = await import("./app"));
});

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function renderWithLoader(loader: () => unknown) {
  const Stub = createRoutesStub([
    {
      path: "/app",
      loader: loader as never,
      Component: () => createElement("p", null, "desk"),
      ErrorBoundary,
    },
  ]);
  host = document.createElement("div");
  document.body.appendChild(host);
  const created = createRoot(host);
  root = created;
  act(() => {
    created.render(
      createElement(
        StrictMode,
        null,
        createElement(Stub, { initialEntries: ["/app"] }),
      ),
    );
  });
  return created;
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("Admin ErrorBoundary", () => {
  it("renders the desk error panel when a loader throws", async () => {
    renderWithLoader(() => {
      throw new Error("prisma exploded");
    });
    // Let the stub router settle the rejected loader into the boundary.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const text = host!.textContent ?? "";
    expect(text).toContain("The desk did not finish loading");
    // Says the numbers are safe and offers the one thing that helps.
    expect(text).toMatch(/Shopify sales and the spend you added are safe/);
    expect(text).toContain("Reload the desk");
    // Never React Router's default.
    expect(text).not.toMatch(/Unexpected Application Error/i);
    expect(text).not.toMatch(/prisma exploded/);
  });

  it("does not swallow the happy path", async () => {
    renderWithLoader(() => ({ ok: true }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(host!.textContent).toContain("desk");
    expect(host!.textContent).not.toContain("The desk did not finish loading");
  });
});
