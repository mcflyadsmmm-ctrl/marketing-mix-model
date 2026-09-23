/**
 * Honest empty for a Live rung that `liveDeskTabAllowed` has not opened.
 * No sales, no buyers, no LTV figures.
 */

export function LiveDeskLockedNotice({
  surface,
  copy,
}: {
  surface: "customers" | "growth" | "ltv";
  copy: string;
}) {
  return (
    <div
      className="mcfly-state mcfly-state--soft"
      role="status"
      data-live-desk-lock={surface}
    >
      <p className="mcfly-state__copy">{copy}</p>
    </div>
  );
}

export function LiveDeskLockedPage({
  heading,
  surface,
  copy,
}: {
  heading: string;
  surface: "customers" | "growth" | "ltv";
  copy: string;
}) {
  return (
    <s-page heading={heading} inlineSize="large">
      <LiveDeskLockedNotice surface={surface} copy={copy} />
    </s-page>
  );
}
