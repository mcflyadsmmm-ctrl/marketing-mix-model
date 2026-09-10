import type { ReactNode } from "react";
import { PeriodControl } from "./PeriodControl";
import type { PeriodPreset } from "../lib/periods";

export function DeskBookPage({
  heading,
  tillLabel,
  preset,
  shotMode,
  useSampleDesk,
  isLoading,
  children,
}: {
  heading: string;
  tillLabel: string;
  preset: PeriodPreset;
  shotMode: boolean;
  useSampleDesk: boolean;
  isLoading: boolean;
  children: ReactNode;
}) {
  return (
    <s-page heading={shotMode ? undefined : heading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isLoading && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--loading"
            aria-live="polite"
          >
            <p className="mcfly-state__copy">Refreshing this period…</p>
          </section>
        ) : null}

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__asof">{tillLabel}</span>
            <PeriodControl preset={preset} shotMode={shotMode} />
          </div>
        </div>

        {children}
      </div>
    </s-page>
  );
}
