/**
 * Derives `berlin-7d-all.json` from the real capture so aggregate tests can run
 * against all 11 models. Three models (AIFS, GraphCast, BOM) were genuinely
 * offline when the live fixture was captured; here their series are copied from
 * GFS with a deterministic offset. The file is test data only — never shipped.
 *
 * Run: node tests/fixtures/derive-all.mjs
 */
import fs from 'node:fs'

const source = JSON.parse(fs.readFileSync(new URL('./berlin-7d.json', import.meta.url), 'utf8'))
const offline = { ecmwf_aifs025: -1.2, gfs_graphcast025: 1.8, bom_access_global: -0.6 }
const dailyVars = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'wind_speed_10m_max', 'sunrise', 'sunset']
const hourlyVars = ['temperature_2m', 'apparent_temperature', 'precipitation', 'precipitation_probability', 'weather_code', 'cloud_cover', 'wind_speed_10m', 'relative_humidity_2m']

for (const [model, offset] of Object.entries(offline)) {
  for (const variable of hourlyVars) {
    const target = `${variable}_${model}`
    const donor = source.hourly[`${variable}_gfs_global`]
    if (!donor) continue
    source.hourly[target] = donor.map((value) =>
      value === null ? null : variable.includes('temperature') ? Math.round((value + offset) * 10) / 10 : value,
    )
  }
  for (const variable of dailyVars) {
    const target = `${variable}_${model}`
    const donor = source.daily[`${variable}_gfs_global`]
    if (!donor) continue
    source.daily[target] = donor.map((value) =>
      value === null ? null : variable.includes('temperature') ? Math.round((value + offset) * 10) / 10 : value,
    )
  }
  // One model reports rain where GFS reports overcast, so consensus logic has a
  // genuine disagreement to resolve.
  if (model === 'bom_access_global') {
    source.daily[`weather_code_${model}`] = source.daily[`weather_code_${model}`].map(() => 61)
  }
}

source._derived = `derived from berlin-7d.json by tests/fixtures/derive-all.mjs — test data only`
fs.writeFileSync(new URL('./berlin-7d-all.json', import.meta.url), JSON.stringify(source))
console.log('wrote berlin-7d-all.json', fs.statSync(new URL('./berlin-7d-all.json', import.meta.url)).size, 'bytes')
