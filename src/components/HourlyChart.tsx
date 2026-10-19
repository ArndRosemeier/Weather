import { useCallback, useEffect, useRef, useState } from 'react'
import type { AggregatePoint, UnitSystem } from '../lib/types'
import { dayLabel, hourLabel } from '../lib/format'
import { convertPrecip, convertTemp, convertWind, precipUnit, tempUnit, windUnit } from '../lib/units'

export type ChartMetric = 'temperature' | 'precipitation' | 'wind'

export interface ChartModelSeries {
  id: string
  name: string
  color: string
  values: (number | null)[]
}

interface Props {
  points: AggregatePoint[]
  models: ChartModelSeries[]
  metric: ChartMetric
  system: UnitSystem
  focusModelId: string | null
  onFocusModel: (id: string | null) => void
}

type Scale = (value: number) => number

function buildLinePath(values: (number | null)[], x: Scale, y: Scale): string {
  let path = ''
  let pen = false
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      pen = false
      return
    }
    path += `${pen ? 'L' : 'M'}${x(index).toFixed(1)},${y(value).toFixed(1)}`
    pen = true
  })
  return path
}

function buildBandPath(minValues: (number | null)[], maxValues: (number | null)[], x: Scale, y: Scale): string {
  let path = ''
  let run: number[] = []
  const flush = () => {
    if (run.length >= 2) {
      const top = run.map((index) => `${x(index).toFixed(1)},${y(maxValues[index] as number).toFixed(1)}`).join('L')
      const bottom = [...run].reverse().map((index) => `${x(index).toFixed(1)},${y(minValues[index] as number).toFixed(1)}`).join('L')
      path += `M${top}L${bottom}Z`
    }
    run = []
  }
  for (let index = 0; index < minValues.length; index += 1) {
    const low = minValues[index]
    const high = maxValues[index]
    if (low === null || high === null) flush()
    else run.push(index)
  }
  flush()
  return path
}

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1
  return Array.from({ length: count + 1 }, (_, index) => min + (span * index) / count)
}

export function HourlyChart({ points, models, metric, system, focusModelId, onFocusModel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 900, height: 300 })
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: Math.max(280, Math.round(rect.width)), height: Math.max(200, Math.round(rect.height)) })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const convert = useCallback(
    (value: number | null): number | null => {
      if (value === null) return null
      if (metric === 'temperature') return convertTemp(value, system)
      if (metric === 'wind') return convertWind(value, system)
      return convertPrecip(value, system)
    },
    [metric, system],
  )

  const averageValues = points.map((point) =>
    convert(metric === 'temperature' ? point.temperature : metric === 'wind' ? point.windSpeed : point.precipitation),
  )
  const minValues = metric === 'temperature' ? points.map((point) => convert(point.min)) : []
  const maxValues = metric === 'temperature' ? points.map((point) => convert(point.max)) : []
  const convertedModels = models.map((model) => ({ ...model, values: model.values.map(convert) }))

  const all = [...averageValues, ...convertedModels.flatMap((model) => model.values), ...minValues, ...maxValues].filter(
    (value): value is number => value !== null && Number.isFinite(value),
  )
  const rawMin = all.length > 0 ? Math.min(...all) : 0
  const rawMax = all.length > 0 ? Math.max(...all) : 1
  const padded = Math.max((rawMax - rawMin) * 0.12, metric === 'precipitation' ? 0.2 : 1)
  const domainMin = metric === 'precipitation' ? 0 : rawMin - padded
  const domainMax = rawMax + (metric === 'precipitation' ? padded : padded * 0.6)

  const width = size.width
  const height = size.height
  const wide = width >= 560
  const pad = { left: wide ? 42 : 34, right: wide ? 16 : 10, top: 18, bottom: 26 }
  const plotWidth = Math.max(10, width - pad.left - pad.right)
  const plotHeight = Math.max(10, height - pad.top - pad.bottom)
  const x = (index: number) => pad.left + (points.length <= 1 ? 0 : (index * plotWidth) / (points.length - 1))
  const y = (value: number) => pad.top + ((domainMax - value) / (domainMax - domainMin || 1)) * plotHeight

  const labelStep = Math.max(1, Math.ceil(points.length / (wide ? 6 : 4)))
  const xLabels = points.map((point, index) => ({ point, index })).filter(({ index }) => index % labelStep === 0 || index === points.length - 1)

  const unit = metric === 'temperature' ? tempUnit(system) : metric === 'wind' ? windUnit(system) : precipUnit(system)
  const tickDigits = metric === 'precipitation' ? 1 : 0

  const onPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const relative = event.clientX - rect.left
    const ratio = (relative - pad.left) / plotWidth
    const index = Math.round(ratio * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, index)))
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const current = hover ?? 0
    setHover(Math.max(0, Math.min(points.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1))))
  }

  const hoverPoint = hover !== null ? points[hover] : undefined
  const hoverModels = hover !== null
    ? convertedModels
        .map((model) => ({ ...model, value: model.values[hover] ?? null }))
        .filter((model) => model.value !== null)
        .sort((a, b) => (b.value as number) - (a.value as number))
    : []
  const hoverLeft = hover !== null ? Math.min(Math.max(x(hover) + 14, 8), Math.max(8, width - 216)) : 0

  const describedBy = points.length > 0 && all.length > 0
    ? `${metric} chart, ${points.length} hours, from ${Math.round(Math.min(...all))} to ${Math.round(Math.max(...all))} ${unit}`
    : 'Chart with no data for this range'

  return (
    <div className="chart">
      <div
        className="chart__plot"
        data-testid="chart-plot"
        ref={wrapRef}
        tabIndex={0}
        role="img"
        aria-label={`${describedBy}. Use the left and right arrow keys to inspect individual hours.`}
        onKeyDown={onKeyDown}
        onFocus={() => setHover((current) => current ?? 0)}
        onBlur={() => setHover(null)}
      >
        {all.length === 0 ? (
          <p className="chart__empty">No {unit} data for this range yet.</p>
        ) : (
          <svg width={width} height={height} role="presentation" onPointerMove={onPointer} onPointerLeave={() => setHover(null)}>
            <defs>
              <linearGradient id="band-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {niceTicks(domainMin, domainMax).map((tick) => (
              <g key={`tick-${tick}`}>
                <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="chart__grid" />
                <text x={pad.left - 8} y={y(tick) + 4} textAnchor="end" className="chart__axis">
                  {tick.toFixed(tickDigits)}
                </text>
              </g>
            ))}

            {metric === 'temperature' && minValues.length > 0 && (
              <path d={buildBandPath(minValues, maxValues, x, y)} fill="url(#band-fill)" />
            )}

            {convertedModels.map((model) => {
              const focused = focusModelId === model.id
              const dimmed = focusModelId !== null && !focused
              return (
                <path
                  key={model.id}
                  d={buildLinePath(model.values, x, y)}
                  fill="none"
                  stroke={model.color}
                  strokeWidth={focused ? 2.2 : 1.2}
                  strokeOpacity={dimmed ? 0.18 : focused ? 1 : 0.5}
                  strokeLinecap="round"
                />
              )
            })}

            <path d={buildLinePath(averageValues, x, y)} fill="none" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" />

            {xLabels.map(({ point, index }) => (
              <text key={`x-${index}`} x={x(index)} y={height - 6} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} className="chart__axis">
                {index === 0 || hourLabel(point.time) === '00:00' ? `${dayLabel(point.time)} ${hourLabel(point.time)}` : hourLabel(point.time)}
              </text>
            ))}

            {hover !== null && hoverPoint && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={height - pad.bottom} className="chart__cursor" />
                {hoverModels.map((model) => (
                  <circle key={model.id} cx={x(hover)} cy={y(model.value as number)} r={2.6} fill={model.color} />
                ))}
                {averageValues[hover] !== null && (
                  <circle cx={x(hover)} cy={y(averageValues[hover] as number)} r={3.4} fill="#ffffff" />
                )}
              </>
            )}
            <text x={width - pad.right} y={12} textAnchor="end" className="chart__unit">{unit}</text>
          </svg>
        )}

        {hover !== null && hoverPoint && hoverModels.length > 0 && (
          <div className="chart__tooltip" style={{ left: hoverLeft }}>
            <div className="chart__tooltip-time">
              {dayLabel(hoverPoint.time)} {hourLabel(hoverPoint.time)}
            </div>
            <div className="chart__tooltip-row chart__tooltip-row--avg">
              <span>Average</span>
              <strong>{averageValues[hover] === null ? '—' : `${averageValues[hover]?.toFixed(tickDigits)} ${unit}`}</strong>
            </div>
            <ul className="chart__tooltip-list">
              {hoverModels.map((model) => (
                <li key={model.id} className={focusModelId === model.id ? 'is-focused' : undefined}>
                  <span className="chart__swatch" style={{ background: model.color }} />
                  <span>{model.name}</span>
                  <span className="chart__tooltip-value">{(model.value as number).toFixed(tickDigits)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ul className="chart__legend" aria-label="Models shown in the chart">
        <li>
          <button type="button" className={`chart__legend-button ${focusModelId === null ? 'is-active' : ''}`} onClick={() => onFocusModel(null)}>
            <span className="chart__swatch chart__swatch--avg" />
            Average
          </button>
        </li>
        {models.map((model) => (
          <li key={model.id}>
            <button
              type="button"
              className={`chart__legend-button ${focusModelId === model.id ? 'is-active' : ''}`}
              data-testid="legend-model"
              data-model-id={model.id}
              onClick={() => onFocusModel(focusModelId === model.id ? null : model.id)}
              aria-pressed={focusModelId === model.id}
            >
              <span className="chart__swatch" style={{ background: model.color }} />
              {model.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
