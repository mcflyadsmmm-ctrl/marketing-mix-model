import { DeskDepthSubnav } from "./DeskDepthSubnav";
import { SALES_DEPTH_LINKS } from "../lib/desk-nav";

/** Sales wing: Sales · Days · Orders — BC keeps these off the top bar. */
export function SalesDepthNav() {
  return <DeskDepthSubnav label="Sales sections" links={SALES_DEPTH_LINKS} />;
}
