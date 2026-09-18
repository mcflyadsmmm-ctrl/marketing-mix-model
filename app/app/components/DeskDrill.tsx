import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import { DESK_DRILL_MORE } from "../lib/desk-lane";

export type DeskDrillBlock = { k: string; v: string };

export type DeskDrillPayload = {
  title: string;
  value: string;
  kicker?: string;
  blocks?: DeskDrillBlock[];
  next: string;
  nextHref?: string;
  nextLabel?: string;
  foot?: string;
};

type DeskDrillContextValue = {
  openDrill: (payload: DeskDrillPayload) => void;
};

const DeskDrillContext = createContext<DeskDrillContextValue | null>(null);

export function useDeskDrill(): DeskDrillContextValue | null {
  return useContext(DeskDrillContext);
}

function DeskDrillBlocks({
  blocks,
  moreOpen,
  moreId,
  onToggleMore,
}: {
  blocks: DeskDrillBlock[];
  moreOpen: boolean;
  moreId: string;
  onToggleMore: () => void;
}) {
  const lead = blocks[0];
  const rest = blocks.slice(1);
  return (
    <>
      {lead ? (
        <div className="mcfly-drill__block">
          <dl>
            <dt>{lead.k}</dt>
            <dd>{lead.v}</dd>
          </dl>
        </div>
      ) : null}
      {rest.length > 0 ? (
        <div className="mcfly-drill__more">
          <button
            type="button"
            className="mcfly-drill__more-btn"
            aria-expanded={moreOpen}
            aria-controls={moreId}
            onClick={onToggleMore}
          >
            {DESK_DRILL_MORE}
          </button>
          <div id={moreId} hidden={!moreOpen}>
            {rest.map((block) => (
              <div className="mcfly-drill__block" key={block.k}>
                <dl>
                  <dt>{block.k}</dt>
                  <dd>{block.v}</dd>
                </dl>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function DeskDrillProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<DeskDrillPayload | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const titleId = useId();
  const moreId = useId();

  const close = useCallback(() => {
    setPayload(null);
    setMoreOpen(false);
  }, []);
  const openDrill = useCallback((next: DeskDrillPayload) => {
    setMoreOpen(false);
    setPayload(next);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payload, close]);

  return (
    <DeskDrillContext.Provider value={{ openDrill }}>
      {children}
      {payload ? (
        <div className="mcfly-drill">
          <button
            type="button"
            className="mcfly-drill__backdrop"
            aria-label="Close detail"
            onClick={close}
          />
          <aside
            className="mcfly-drill__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="mcfly-drill__head">
              <h2 className="mcfly-drill__title" id={titleId}>
                {payload.title}
              </h2>
              <button
                type="button"
                className="mcfly-drill__close"
                onClick={close}
              >
                Close
              </button>
            </header>
            <div className="mcfly-drill__body">
              {payload.kicker ? (
                <p className="mcfly-drill__kicker">{payload.kicker}</p>
              ) : null}
              <p className="mcfly-drill__value">{payload.value}</p>
              <DeskDrillBlocks
                blocks={payload.blocks ?? []}
                moreOpen={moreOpen}
                moreId={moreId}
                onToggleMore={() => setMoreOpen((value) => !value)}
              />
              <div className="mcfly-drill__next">
                <p className="mcfly-drill__next-kicker">What to do next</p>
                <p>{payload.next}</p>
                {payload.nextHref ? (
                  <p>
                    <Link
                      className="mcfly-drill__cta"
                      to={payload.nextHref}
                      onClick={close}
                    >
                      {payload.nextLabel ?? "Open tab"}
                    </Link>
                  </p>
                ) : null}
              </div>
              {payload.foot ? (
                <p className="mcfly-drill__foot">{payload.foot}</p>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </DeskDrillContext.Provider>
  );
}
