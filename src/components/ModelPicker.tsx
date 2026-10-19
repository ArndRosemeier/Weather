import { MODELS } from '../lib/models'
import type { ModelStatus } from '../lib/types'

interface Props {
  selectedIds: string[]
  windowHours: number
  onChange: (ids: string[]) => void
  availability: Record<string, ModelStatus>
  horizons: Record<string, number>
  focusModelId: string | null
  onFocusModel: (id: string | null) => void
}

export function ModelPicker({ selectedIds, windowHours, onChange, availability, horizons, focusModelId, onFocusModel }: Props) {
  const physics = MODELS.filter((model) => model.kind === 'physics')
  const ai = MODELS.filter((model) => model.kind === 'ai')

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return
      onChange(selectedIds.filter((entry) => entry !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const renderGroup = (title: string, ids: typeof MODELS, subtitle: string) => (
    <div className="picker__group">
      <div className="picker__group-head">
        <h3 className="picker__group-title">{title}</h3>
        <span className="picker__group-sub">{subtitle}</span>
      </div>
      <div className="picker__grid" role="group" aria-label={title}>
        {ids.map((model) => {
          const checked = selectedIds.includes(model.id)
          const unavailable = availability[model.id] === 'unavailable'
          const hours = horizons[model.id] ?? 0
          const onlyOne = checked && selectedIds.length === 1
          return (
            <button
              key={model.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              aria-disabled={onlyOne || undefined}
              className={`model-chip ${checked ? 'is-checked' : ''} ${unavailable ? 'is-offline' : ''}`}
              data-testid="model-chip"
              data-model-id={model.id}
              onClick={() => toggle(model.id)}
              title={onlyOne ? 'Keep at least one model selected' : `${model.baseModel} · ${model.provider}`}
            >
              <span className="model-chip__dot" style={{ background: model.color }} />
              <span className="model-chip__body">
                <span className="model-chip__name">{model.name}</span>
                <span className="model-chip__meta">
                  {unavailable ? 'No data right now' : hours >= windowHours ? 'full window' : hours > 0 ? `covers ${(hours / 24).toFixed(1)} d` : model.provider}
                </span>
              </span>
              <span className="model-chip__check" aria-hidden="true">
                {checked ? '✓' : ''}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="picker">
      <div className="picker__actions">
        <button type="button" className="button button--small" onClick={() => onChange(MODELS.map((model) => model.id))}>
          All {MODELS.length}
        </button>
        <button type="button" className="button button--ghost button--small" onClick={() => onChange(physics.map((model) => model.id))}>
          Physics only
        </button>
        <button type="button" className="button button--ghost button--small" onClick={() => onChange(ai.map((model) => model.id))}>
          AI only
        </button>
        {focusModelId && (
          <button type="button" className="button button--ghost button--small" onClick={() => onFocusModel(null)}>
            Clear focus
          </button>
        )}
        <span className="picker__count">{selectedIds.length} selected</span>
      </div>

      {renderGroup('Physics-based models', physics, 'Traditional numerical weather prediction')}
      {renderGroup('AI models', ai, 'Learned models, initialised from analyses — distinct from the physics models')}
    </div>
  )
}
