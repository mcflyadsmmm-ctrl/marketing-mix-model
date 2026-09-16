import { createContext, useContext } from "react";
import { shopCurrencyCode } from "./spend-money";
import { createMoneyFormatter } from "./mer-format";

export const DeskCurrencyContext = createContext<string | null>(null);

export function useDeskCurrency(): string {
  const code = useContext(DeskCurrencyContext);
  if (!code) {
    throw new Error("DeskCurrencyProvider required — shop currency cannot default to USD");
  }
  return shopCurrencyCode(code);
}

export function useMoney(): (amount: number) => string {
  return createMoneyFormatter(useDeskCurrency());
}
