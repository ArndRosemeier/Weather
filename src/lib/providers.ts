import { MODELS } from './models'

/** The organisation behind a model, not the model itself. Kept separate from
 *  `models.ts` so one provider can be explained once and shared by its models. */
export interface ProviderInfo {
  id: string
  /** Short name, exactly as shown in the model table. */
  name: string
  fullName: string
  where: string
  description: string
  url: string
}

export const PROVIDERS: Record<string, ProviderInfo> = {
  ecmwf: {
    id: 'ecmwf',
    name: 'ECMWF',
    fullName: 'European Centre for Medium-Range Weather Forecasts',
    where: 'Reading, United Kingdom · intergovernmental',
    description:
      'An intergovernmental organisation of European member states. It produces the IFS physics model and the AIFS machine-learning model, and publishes its open data under CC BY 4.0.',
    url: 'https://www.ecmwf.int/',
  },
  noaa: {
    id: 'noaa',
    name: 'NOAA NCEP',
    fullName: 'NOAA National Centers for Environmental Prediction',
    where: 'College Park, Maryland, USA · national agency',
    description:
      'The forecasting arm of the US National Oceanic and Atmospheric Administration. It runs the Global Forecast System (GFS); US Government work is in the public domain.',
    url: 'https://www.ncep.noaa.gov/',
  },
  dwd: {
    id: 'dwd',
    name: 'DWD',
    fullName: 'Deutscher Wetterdienst',
    where: 'Offenbach, Germany · national agency',
    description:
      "Germany's national meteorological service. It runs the ICON model family and publishes its open data under CC BY 4.0.",
    url: 'https://www.dwd.de/EN/',
  },
  eccc: {
    id: 'eccc',
    name: 'ECCC',
    fullName: 'Environment and Climate Change Canada',
    where: 'Gatineau, Canada · national agency',
    description:
      "Canada's federal environment department. It runs the Global Deterministic Prediction System (GEM) and publishes the output as open data.",
    url: 'https://www.canada.ca/en/environment-climate-change.html',
  },
  jma: {
    id: 'jma',
    name: 'JMA',
    fullName: 'Japan Meteorological Agency',
    where: 'Tokyo, Japan · national agency',
    description:
      "Japan's national meteorological service. It runs the Global Spectral Model (GSM); the data is free to use with attribution.",
    url: 'https://www.jma.go.jp/jma/indexe.html',
  },
  ukmo: {
    id: 'ukmo',
    name: 'UK Met Office',
    fullName: 'Met Office',
    where: 'Exeter, United Kingdom · national agency',
    description:
      "The UK's national meteorological service. It runs the Unified Model (UM); the global deterministic product used here is 10 km.",
    url: 'https://www.metoffice.gov.uk/',
  },
  meteofrance: {
    id: 'meteofrance',
    name: 'Météo-France',
    fullName: 'Météo-France',
    where: 'Toulouse, France · national agency',
    description:
      "France's national meteorological service. It runs ARPEGE, a variable-resolution global model, and publishes open data.",
    url: 'https://meteofrance.com/',
  },
  cma: {
    id: 'cma',
    name: 'CMA',
    fullName: 'China Meteorological Administration',
    where: 'Beijing, China · national agency',
    description:
      "China's national meteorological authority. It runs the GRAPES global model.",
    url: 'https://www.cma.gov.cn/en/',
  },
  bom: {
    id: 'bom',
    name: 'BOM',
    fullName: 'Australian Bureau of Meteorology',
    where: 'Melbourne, Australia · national agency',
    description:
      "Australia's national weather service. It runs ACCESS-G, its global model.",
    url: 'http://www.bom.gov.au/',
  },
  deepmind: {
    id: 'deepmind',
    // Display string matches ModelInfo.provider, because GraphCast is initialised
    // from NCEP analyses even though the model is DeepMind's.
    name: 'Google DeepMind / NCEP',
    fullName: 'Google DeepMind',
    where: 'London, United Kingdom · research lab',
    description:
      'GraphCast is a machine-learning weather model from Google DeepMind, initialised from NCEP analyses. It is a research model, not a national forecasting service.',
    url: 'https://deepmind.google/technologies/graphcast/',
  },
}

export function providerFor(id: string): ProviderInfo {
  const provider = PROVIDERS[id]
  if (!provider) throw new Error(`Unknown provider id: ${id}`)
  return provider
}

export function modelsForProvider(id: string): { id: string; name: string }[] {
  return MODELS.filter((model) => model.providerId === id).map((model) => ({ id: model.id, name: model.name }))
}
