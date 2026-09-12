import type { ScoreboardHeroModel } from "../lib/scoreboard-hero";

/**
 * Black Clover scoreboard first viewport:
 * formula · decision banner · 3 tinted hero cards · till-read · insight tiles.
 */
export function ScoreboardHero({ model }: { model: ScoreboardHeroModel }) {
  return (
    <section className="mcfly-scoreboard" aria-label="Operator scoreboard">
      <p className="mcfly-scoreboard__formula">{model.formula}</p>

      <div
        className={`mcfly-scoreboard__banner mcfly-scoreboard__banner--${model.bannerTone}`}
      >
        <p className="mcfly-scoreboard__banner-kicker">{model.bannerKicker}</p>
        <p className="mcfly-scoreboard__banner-takeaway">
          {model.bannerTakeaway}
        </p>
        <p className="mcfly-scoreboard__banner-detail">{model.bannerDetail}</p>
        <div className="mcfly-scoreboard__banner-actions">
          <s-button href={model.primaryHref} variant="primary">
            {model.primaryLabel}
          </s-button>
          <s-button href={model.secondaryHref} variant="tertiary">
            {model.secondaryLabel}
          </s-button>
        </div>
      </div>

      <div className="mcfly-scoreboard__cards" role="list">
        {model.cards.map((card) => (
          <article
            key={card.id}
            className={`mcfly-scoreboard__card mcfly-scoreboard__card--${card.tone}`}
            role="listitem"
          >
            <p className="mcfly-scoreboard__card-kicker">{card.kicker}</p>
            <p className="mcfly-scoreboard__card-value">{card.value}</p>
            {card.delta ? (
              <p className="mcfly-scoreboard__card-delta">{card.delta}</p>
            ) : null}
            <p className="mcfly-scoreboard__card-body">{card.body}</p>
            {card.footLeft || card.footRight ? (
              <div className="mcfly-scoreboard__card-foot">
                <span>{card.footLeft}</span>
                <span>{card.footRight}</span>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mcfly-scoreboard__till">
        <div>
          <p className="mcfly-scoreboard__till-kicker">Till read</p>
          <p className="mcfly-scoreboard__till-read">{model.tillRead}</p>
        </div>
        <p className="mcfly-scoreboard__till-meta">{model.tillMeta}</p>
      </div>

      {model.insights.length > 0 ? (
        <div className="mcfly-scoreboard__insights" role="list">
          {model.insights.map((tile) => (
            <article
              key={tile.id}
              className={`mcfly-scoreboard__insight mcfly-scoreboard__insight--${tile.tint}`}
              role="listitem"
            >
              <p className="mcfly-scoreboard__insight-k">{tile.kicker}</p>
              <p className="mcfly-scoreboard__insight-v">{tile.value}</p>
              <p className="mcfly-scoreboard__insight-h">{tile.hint}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
