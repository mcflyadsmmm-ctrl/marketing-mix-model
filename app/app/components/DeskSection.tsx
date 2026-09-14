import type { ReactNode } from "react";

/**
 * Named desk section — Black Clover composition unit.
 * One job · one headline · short support · optional hero slot.
 */
export function DeskSection({
  id,
  title,
  blurb,
  hero = false,
  actions,
  children,
}: {
  id: string;
  title: string;
  blurb?: string;
  /** Full-bleed hero (ledger / primary chart) — not a card grid. */
  hero?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={`desk-section-${id}`}
      className={
        hero
          ? "mcfly-desk-section mcfly-desk-section--hero"
          : "mcfly-desk-section"
      }
      aria-labelledby={`desk-section-${id}-title`}
    >
      <header className="mcfly-desk-section__head">
        <div className="mcfly-desk-section__titles">
          <h2
            id={`desk-section-${id}-title`}
            className="mcfly-desk-section__title"
          >
            {title}
          </h2>
          {blurb ? (
            <p className="mcfly-desk-section__blurb">{blurb}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="mcfly-desk-section__actions">{actions}</div>
        ) : null}
      </header>
      <div className="mcfly-desk-section__body">{children}</div>
    </section>
  );
}
