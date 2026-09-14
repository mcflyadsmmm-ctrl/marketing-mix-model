import { DeskDepthSubnav } from "./DeskDepthSubnav";
import { CUSTOMERS_DEPTH_LINKS } from "../lib/desk-nav";

/** Customers wing: Customers · Cohorts — BC-tight top bar. */
export function CustomersDepthNav() {
  return (
    <DeskDepthSubnav label="Customers sections" links={CUSTOMERS_DEPTH_LINKS} />
  );
}
