import { MODELS, SUPERSEDED } from '../lib/models'

export function Attribution() {
  return (
    <footer className="attribution">
      <div className="attribution__brand">
        <span className="attribution__name">Weather Compare</span>
        <span className="attribution__note">One forecast from many independent models.</span>
      </div>

      <p className="attribution__text">
        Forecast data by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer noopener">Open-Meteo</a>{' '}
        under CC BY 4.0, free for non-commercial use. Model data © their providers:{' '}
        {MODELS.map((model, index) => (
          <span key={model.id}>
            <a href={model.docsUrl} target="_blank" rel="noreferrer noopener">{model.provider}</a>
            {index < MODELS.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>

      <details className="attribution__details">
        <summary>Why only these {MODELS.length} models?</summary>
        <p>
          A weather model is one physical model of the atmosphere. Providers often redistribute, interpolate or blend
          the same base model under different names — that is not a second opinion. This app keeps exactly one entry per
          base model, and excludes regional and ensemble variants.
        </p>
        <ul className="attribution__list">
          {SUPERSEDED.map((entry) => (
            <li key={entry.id}>
              <code>{entry.id}</code> — {entry.reason}
            </li>
          ))}
        </ul>
        <p className="attribution__source">
          Base model and grid details: Open-Meteo's{' '}
          <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer noopener">model documentation</a>.
        </p>
      </details>
    </footer>
  )
}
