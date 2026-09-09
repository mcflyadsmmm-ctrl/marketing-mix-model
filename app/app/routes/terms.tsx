import { flyOriginSiteRedirect } from "../lib/fly-origin-redirects";

export const loader = () => {
  throw flyOriginSiteRedirect("terms");
};
