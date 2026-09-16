import {
  merchantRouteErrorCopy,
  shopifyAdminHref,
} from "../lib/merchant-error-recovery";

function shopFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href).searchParams.get("shop");
  } catch {
    return null;
  }
}

const panelStyle = {
  fontFamily: "system-ui, sans-serif",
  maxWidth: "40rem",
  margin: "1.5rem auto",
  padding: "1rem 1.15rem",
  border: "1px solid #fecaca",
  background: "#fff7f7",
  borderRadius: 8,
  color: "#0f172a",
} as const;

const actionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.75rem",
} as const;

const primaryStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "2.5rem",
  padding: "0.35rem 0.85rem",
  borderRadius: 6,
  background: "#0f172a",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 650,
} as const;

const secondaryStyle = {
  ...primaryStyle,
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
} as const;

export function MerchantErrorRecovery({
  error,
  retryHref = ".",
  shop = null,
}: {
  error: unknown;
  retryHref?: string;
  shop?: string | null;
}) {
  const copy = merchantRouteErrorCopy(error);
  const adminHref = shopifyAdminHref(shop ?? shopFromWindow());
  return (
    <section
      className="mcfly-state mcfly-state--critical mcfly-error-recovery"
      aria-label={copy.title}
      style={panelStyle}
    >
      <div>
        <p className="mcfly-state__copy" style={{ margin: "0 0 0.35rem" }}>
          <strong>{copy.title}</strong>
        </p>
        <p className="mcfly-state__copy" style={{ margin: 0 }}>
          {copy.body}
        </p>
      </div>
      <div className="mcfly-state__cta" style={actionsStyle}>
        <a className="mcfly-btn mcfly-btn--primary" href={retryHref} style={primaryStyle}>
          {copy.retryLabel}
        </a>
        <a
          className="mcfly-btn mcfly-btn--secondary"
          href={adminHref}
          target="_top"
          rel="noopener noreferrer"
          style={secondaryStyle}
        >
          {copy.adminLabel}
        </a>
      </div>
    </section>
  );
}
