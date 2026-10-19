import type { ModelInfo, SupersededModel } from './types'

/**
 * The selectable catalogue. ONE model per base model — this is the owner's hard
 * rule: a different provider does not mean a different base model.
 *
 * `baseModel` is the dedupe key. If two entries ever share it, `assertNoDuplicateBaseModels`
 * (and its unit test) fails the build. Every excluded variant is listed in
 * `SUPERSEDED` with the concrete reason, and the UI shows that list.
 */
export const MODELS: readonly ModelInfo[] = [
  {
    id: 'ecmwf_ifs',
    name: 'ECMWF IFS',
    shortName: 'IFS',
    provider: 'ECMWF',
    baseModel: 'ECMWF IFS',
    kind: 'physics',
    color: '#6ea8fe',
    attribution: 'European Centre for Medium-Range Weather Forecasts',
    docsUrl: 'https://www.ecmwf.int/en/forecasts/datasets/open-data',
  },
  {
    id: 'gfs_global',
    name: 'NOAA GFS',
    shortName: 'GFS',
    provider: 'NOAA NCEP',
    baseModel: 'NCEP GFS',
    kind: 'physics',
    color: '#7ee0a1',
    attribution: 'NOAA National Centers for Environmental Prediction',
    docsUrl: 'https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast',
  },
  {
    id: 'icon_global',
    name: 'DWD ICON',
    shortName: 'ICON',
    provider: 'DWD',
    baseModel: 'DWD ICON',
    kind: 'physics',
    color: '#ffd166',
    attribution: 'Deutscher Wetterdienst',
    docsUrl: 'https://www.dwd.de/EN/ourservices/nwp_forecast_data/nwp_forecast_data.html',
  },
  {
    id: 'gem_global',
    name: 'ECCC GEM',
    shortName: 'GEM',
    provider: 'ECCC',
    baseModel: 'ECCC GEM',
    kind: 'physics',
    color: '#c39bff',
    attribution: 'Environment and Climate Change Canada',
    docsUrl: 'https://eccc-msc.github.io/open-data/msc-data/nwp_gdps/readme_gdps_en/',
  },
  {
    id: 'jma_gsm',
    name: 'JMA GSM',
    shortName: 'GSM',
    provider: 'JMA',
    baseModel: 'JMA GSM',
    kind: 'physics',
    color: '#ff9f7a',
    attribution: 'Japan Meteorological Agency',
    docsUrl: 'https://www.jma.go.jp/bosai/en/',
  },
  {
    id: 'ukmo_global_deterministic_10km',
    name: 'UKMO Global',
    shortName: 'UKMO',
    provider: 'UK Met Office',
    baseModel: 'UKMO UM',
    kind: 'physics',
    color: '#8fd3d0',
    attribution: 'UK Met Office',
    docsUrl: 'https://www.metoffice.gov.uk/research/approach/modelling-systems/unified-model',
  },
  {
    id: 'meteofrance_arpege_world',
    name: 'Météo-France ARPEGE',
    shortName: 'ARPEGE',
    provider: 'Météo-France',
    baseModel: 'Météo-France ARPEGE',
    kind: 'physics',
    color: '#f78fb3',
    attribution: 'Météo-France',
    docsUrl: 'https://meteofrance.com/',
  },
  {
    id: 'cma_grapes_global',
    name: 'CMA GRAPES',
    shortName: 'GRAPES',
    provider: 'CMA',
    baseModel: 'CMA GRAPES',
    kind: 'physics',
    color: '#b8d96b',
    attribution: 'China Meteorological Administration',
    docsUrl: 'https://www.cma.gov.cn/en/',
  },
  {
    id: 'bom_access_global',
    name: 'BOM ACCESS-G',
    shortName: 'ACCESS',
    provider: 'BOM',
    baseModel: 'BOM ACCESS-G',
    kind: 'physics',
    color: '#f3b96b',
    attribution: 'Australian Bureau of Meteorology',
    docsUrl: 'https://www.bom.gov.au/nwp/doc/access/NWPData.shtml',
  },
  {
    id: 'ecmwf_aifs025',
    name: 'ECMWF AIFS',
    shortName: 'AIFS',
    provider: 'ECMWF',
    baseModel: 'ECMWF AIFS',
    kind: 'ai',
    color: '#9db4ff',
    attribution: 'ECMWF — AI Integrated Forecasting System',
    docsUrl: 'https://www.ecmwf.int/en/about/media-centre/aifs-blog',
  },
  {
    id: 'gfs_graphcast025',
    name: 'GraphCast',
    shortName: 'GraphCast',
    provider: 'Google DeepMind / NCEP',
    baseModel: 'GraphCast',
    kind: 'ai',
    color: '#f2a7d8',
    attribution: 'Google DeepMind GraphCast, initialised with NCEP data',
    docsUrl: 'https://deepmind.google/technologies/graphcast/',
  },
] as const

/**
 * Every variant that Open-Meteo offers but this app deliberately does not, with
 * the reason. `baseModel` names what it duplicates (or the coverage gap).
 */
export const SUPERSEDED: readonly SupersededModel[] = [
  { id: 'ecmwf_ifs025', baseModel: 'ECMWF IFS', reason: 'Same IFS base model as `ecmwf_ifs`, coarser 0.25° grid.' },
  { id: 'ecmwf_ifs04', baseModel: 'ECMWF IFS', reason: 'Same IFS base model as `ecmwf_ifs`, much coarser 0.4° grid.' },
  { id: 'ecmwf_aifs025_single', baseModel: 'ECMWF AIFS', reason: 'Same AIFS base model — the single deterministic-run alias.' },
  { id: 'gfs_seamless', baseModel: 'NCEP GFS', reason: 'GFS base model; the seamless blend only adds the regional HRRR inside the USA.' },
  { id: 'icon_seamless', baseModel: 'DWD ICON', reason: 'ICON base model; the seamless blend only adds regional ICON-EU/ICON-D2.' },
  { id: 'icon_eu', baseModel: 'DWD ICON', reason: 'Regional ICON domain — Europe only, no global coverage.' },
  { id: 'icon_d2', baseModel: 'DWD ICON', reason: 'Regional ICON domain — Germany only, no global coverage.' },
  { id: 'gem_seamless', baseModel: 'ECCC GEM', reason: 'GEM base model; the seamless blend only adds the regional HRDPS.' },
  { id: 'gem_hrdps', baseModel: 'ECCC GEM', reason: 'Regional GEM domain — North America only, no global coverage.' },
  { id: 'jma_seamless', baseModel: 'JMA GSM', reason: 'GSM base model; the seamless blend only adds the regional MSM.' },
  { id: 'jma_msm', baseModel: 'JMA GSM', reason: 'Regional GSM domain — Japan only, no global coverage.' },
  { id: 'ukmo_seamless', baseModel: 'UKMO UM', reason: 'UM base model; the seamless blend only adds the 2 km UK domain.' },
  { id: 'meteofrance_seamless', baseModel: 'Météo-France ARPEGE', reason: 'ARPEGE base model; the seamless blend only adds regional AROME.' },
  { id: 'meteofrance_arome_france', baseModel: 'Météo-France ARPEGE', reason: 'Regional AROME domain — France only, no global coverage.' },
  { id: 'metno_seamless', baseModel: 'MET Norway HARMONIE', reason: 'Regional Nordic HARMONIE; global fallback is ECMWF, so it adds no independent global model.' },
  { id: 'knmi_seamless', baseModel: 'KNMI HARMONIE', reason: 'Regional HARMONIE — Europe only, no global coverage.' },
  { id: 'dmi_seamless', baseModel: 'DMI HARMONIE', reason: 'Regional HARMONIE — Europe only, no global coverage.' },
  { id: 'bom_access_global_ensemble', baseModel: 'BOM ACCESS-G', reason: 'Same ACCESS-G base model, returned as 18 perturbed members rather than a second model.' },
]

export function selectableModels(): readonly ModelInfo[] {
  return MODELS
}

export function defaultSelectedModelIds(): string[] {
  return MODELS.map((m) => m.id)
}

export function findModel(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id)
}

export function modelById(id: string): ModelInfo {
  const model = findModel(id)
  if (!model) throw new Error(`Unknown model id: ${id}`)
  return model
}

/** The hard rule, enforced by code and by a unit test. */
export function assertNoDuplicateBaseModels(): void {
  const seen = new Map<string, string>()
  for (const model of MODELS) {
    const clash = seen.get(model.baseModel)
    if (clash) {
      throw new Error(`Base model "${model.baseModel}" is reported twice: ${clash} and ${model.id}`)
    }
    seen.set(model.baseModel, model.id)
  }
  const ids = new Set<string>()
  for (const model of MODELS) {
    if (ids.has(model.id)) throw new Error(`Duplicate model id: ${model.id}`)
    ids.add(model.id)
  }
}
