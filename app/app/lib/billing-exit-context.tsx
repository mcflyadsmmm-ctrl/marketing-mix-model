import { createContext, useContext, type ReactNode } from "react";

type BillingExitValue = {
  /** Shopify Admin plan picker URL, or null when billing is off / URL cannot be built. */
  plansUrl: string | null;
};

const BillingExitContext = createContext<BillingExitValue>({ plansUrl: null });

export function BillingExitProvider({
  plansUrl,
  children,
}: {
  plansUrl: string | null;
  children: ReactNode;
}) {
  return (
    <BillingExitContext.Provider value={{ plansUrl }}>
      {children}
    </BillingExitContext.Provider>
  );
}

export function useBillingExit(): BillingExitValue {
  return useContext(BillingExitContext);
}
