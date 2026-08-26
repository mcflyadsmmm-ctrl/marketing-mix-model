import { flatRoutes } from "@react-router/fs-routes";

/*
 * Anything in `app/routes/` becomes a route module and ships in the production
 * bundle. A `*.test.tsx` left there once imported Vitest into the server build,
 * `npm run start` exited 1, and Fly crash-looped to its restart cap.
 *
 * Tests belong beside the code they cover in `app/lib/` and `app/components/`,
 * neither of which the route glob scans. This ignore list is the second lock,
 * not the first — `no-test-files-in-routes.test.ts` is the first.
 */
export default flatRoutes({
  ignoredRouteFiles: ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
});
