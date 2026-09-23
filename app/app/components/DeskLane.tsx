import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deskLaneFoldLabel,
  deskLaneHashId,
  deskLaneHint,
  deskLaneOpenAfterDefaultOpen,
  deskLaneTargetOpensFold,
  type DeskLaneRank,
} from "../lib/desk-lane";

const useDeskLaneLayoutEffect =
  typeof document !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Page-rank wrapper — eyebrow + label so peeks / YoY / mix / chart / depth
 * do not land as equal-weight stacks. Soft dense cards stay inside.
 * Fold uses a button, not a native disclosure, so LTV can rank without a FAQ.
 * Later `defaultOpen` (chip / `?panel=` / hash) opens; a later false does not
 * force-close a fold the merchant already opened.
 */
export function DeskLane({
  rank,
  label,
  hint,
  fold = false,
  defaultOpen = false,
  children,
}: {
  rank: DeskLaneRank;
  label: string;
  hint?: string;
  fold?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const panelId = useId();
  const foldRootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(fold ? defaultOpen : true);
  const resolvedHint = deskLaneHint(rank, hint);
  const className = [
    "mcfly-lane",
    `mcfly-lane--${rank}`,
    fold ? "mcfly-lane--fold" : null,
    fold && open ? "mcfly-lane--open" : null,
  ]
    .filter(Boolean)
    .join(" ");

  useDeskLaneLayoutEffect(() => {
    if (!fold) return;
    setOpen((currentlyOpen) =>
      deskLaneOpenAfterDefaultOpen(currentlyOpen, defaultOpen),
    );
  }, [fold, defaultOpen]);

  useEffect(() => {
    if (!fold) return;
    const openIfHash = () => {
      const id = deskLaneHashId(window.location.hash);
      if (!id) return;
      const target = document.getElementById(id);
      if (deskLaneTargetOpensFold(target, foldRootRef.current)) {
        setOpen(true);
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, [fold]);

  if (!fold) {
    return (
      <section className={className} aria-label={label}>
        <header className="mcfly-lane__head">
          {resolvedHint ? (
            <p className="mcfly-lane__hint">{resolvedHint}</p>
          ) : null}
          <p className="mcfly-lane__label">{label}</p>
        </header>
        <div className="mcfly-lane__body">{children}</div>
      </section>
    );
  }

  return (
    <section ref={foldRootRef} className={className} aria-label={label}>
      <button
        type="button"
        className="mcfly-lane__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {resolvedHint ? (
          <span className="mcfly-lane__hint">{resolvedHint}</span>
        ) : null}
        <span className="mcfly-lane__label">{label}</span>
        <span className="mcfly-lane__chev">{deskLaneFoldLabel(label, open)}</span>
      </button>
      <div className="mcfly-lane__body" id={panelId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
