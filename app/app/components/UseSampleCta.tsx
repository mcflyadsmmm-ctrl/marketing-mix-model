import { Form, useLocation } from "react-router";

type UseSampleCtaProps = {
  /** Defaults to the current embedded page (keeps shop/host query). */
  returnTo?: string;
  label?: string;
  variant?: "primary" | "secondary" | "tertiary";
};

/**
 * One-click Sample data preview — POSTs the same data-mode switch as the top toggle.
 * Never send merchants to /app/demo for this.
 */
export function UseSampleCta({
  returnTo,
  label = "See Sample data",
  variant = "secondary",
}: UseSampleCtaProps) {
  const location = useLocation();
  const dest = returnTo ?? `${location.pathname}${location.search}`;

  return (
    <Form method="post" action="/app/data-mode" className="mcfly-use-sample-cta">
      <input type="hidden" name="intent" value="use-sample" />
      <input type="hidden" name="returnTo" value={dest} />
      <s-button type="submit" variant={variant}>
        {label}
      </s-button>
    </Form>
  );
}
