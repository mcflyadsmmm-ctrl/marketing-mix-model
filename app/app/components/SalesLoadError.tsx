export function SalesLoadError({
  body,
  retryHref,
}: {
  body: string;
  retryHref: string;
}) {
  return (
    <section
      className="mcfly-state mcfly-state--critical"
      aria-label="Sales load error"
    >
      <p className="mcfly-state__copy">{body}</p>
      <div className="mcfly-state__cta">
        <s-button href={retryHref} variant="primary">
          Retry
        </s-button>
      </div>
    </section>
  );
}
