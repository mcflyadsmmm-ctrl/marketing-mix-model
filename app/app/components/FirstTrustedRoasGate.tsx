import {
  resolveFirstTrustedRoasGate,
} from "../lib/cash-desk-copy";

export function FirstTrustedRoasGate(input: {
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
}) {
  const gate = resolveFirstTrustedRoasGate(input);
  if (!gate.show) return null;

  return (
    <s-banner tone="info" heading={gate.heading}>
      <s-paragraph>{gate.body}</s-paragraph>
      <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
        <s-button href={gate.primaryHref} variant="primary">
          {gate.primaryLabel}
        </s-button>
        <s-button href={gate.secondaryHref} variant="secondary">
          {gate.secondaryLabel}
        </s-button>
      </div>
    </s-banner>
  );
}
