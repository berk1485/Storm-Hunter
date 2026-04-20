import { useState } from 'react'

const AGE_OPTIONS = [
  { label: 'Any Age', value: '' },
  { label: '10+ years',  min: 10,  max: null },
  { label: '15+ years',  min: 15,  max: null },
  { label: '20+ years',  min: 20,  max: null },
  { label: '10–20 years', min: 10, max: 20 },
  { label: '20–30 years', min: 20, max: 30 },
]

const PRICE_OPTIONS = [
  { label: 'Any Price', min: null, max: null },
  { label: 'Under $300k',  min: null, max: 300000 },
  { label: '$200k–$500k',  min: 200000, max: 500000 },
  { label: '$300k–$600k',  min: 300000, max: 600000 },
  { label: '$500k+',       min: 500000, max: null },
]

export default function Search() {
  const [city, setCity] = useState('')
  const [state, setState] = useState('NJ')
  const [ageIdx, setAgeIdx] = useState(0)
  const [priceIdx, setPriceIdx] = useState(0)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiKey = localStorage.getItem('rapid_api_key')

  async function search() {
    if (!city.trim()) return
    if (!apiKey) {
      setError('RapidAPI key not set — tap ⚙ API to add it.')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    const age = AGE_OPTIONS[ageIdx]
    const price = PRICE_OPTIONS[priceIdx]

    const body = {
      limit: 20,
      offset: 0,
      city: city.trim(),
      state_code: state,
      status: ['for_sale'],
      sort: {
        direction: 'desc',
        field: 'list_date',
      },
    }

    if (price.min) body.list_price = { ...body.list_price, min: price.min }
    if (price.max) body.list_price = { ...body.list_price, max: price.max }
    if (age.min)   body.year_built = { ...body.year_built, max: new Date().getFullYear() - age.min }
    if (age.max)   body.year_built = { ...body.year_built, min: new Date().getFullYear() - age.max }

    try {
      const res = await fetch('https://realty-in-us.p.rapidapi.com/properties/v3/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'realty-in-us.p.rapidapi.com',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`API error ${res.status}: ${txt.slice(0, 100)}`)
      }

      const json = await res.json()
      const homes = json?.data?.home_search?.results || []
      setResults(homes)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(p) {
    if (!p) return 'N/A'
    return '$' + Number(p).toLocaleString()
  }

  function homeAge(yearBuilt) {
    if (!yearBuilt) return '?'
    return new Date().getFullYear() - yearBuilt
  }

  return (
    <div className="tab-content">
      <div className="section-card">
        <h3>Property Search</h3>

        <div className="input-row">
          <div className="input-group flex-2">
            <label>City</label>
            <input
              type="text"
              placeholder="e.g. Cherry Hill"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
          </div>
          <div className="input-group">
            <label>State</label>
            <select value={state} onChange={e => setState(e.target.value)}>
              <option value="NJ">NJ</option>
              <option value="PA">PA</option>
            </select>
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Roof Age</label>
            <select value={ageIdx} onChange={e => setAgeIdx(Number(e.target.value))}>
              {AGE_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Price Range</label>
            <select value={priceIdx} onChange={e => setPriceIdx(Number(e.target.value))}>
              {PRICE_OPTIONS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {!apiKey && (
          <div className="warning-inline">⚠️ RapidAPI key required</div>
        )}

        <button
          className="btn-primary full-width"
          onClick={search}
          disabled={loading || !city.trim()}
        >
          {loading ? 'Searching…' : '🔍 Search Properties'}
        </button>
      </div>

      {error && <div className="error-card">{error}</div>}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Fetching listings…</span>
        </div>
      )}

      {results !== null && !loading && (
        <div className="results-count">
          {results.length} result{results.length !== 1 ? 's' : ''} for {city}, {state}
        </div>
      )}

      {results?.map((home, i) => {
        const loc = home.location?.address
        const desc = home.description
        const price = home.list_price
        const yr = desc?.year_built
        const beds = desc?.beds
        const baths = desc?.baths
        const sqft = desc?.sqft
        const photo = home.primary_photo?.href

        return (
          <div key={i} className="property-card">
            {photo && (
              <img
                className="property-photo"
                src={photo}
                alt="Property"
                loading="lazy"
              />
            )}
            <div className="property-body">
              <div className="property-price">{formatPrice(price)}</div>
              <div className="property-address">
                {loc?.line}, {loc?.city}, {loc?.state_code} {loc?.postal_code}
              </div>
              <div className="property-meta">
                {beds && <span>🛏 {beds}bd</span>}
                {baths && <span>🚿 {baths}ba</span>}
                {sqft && <span>📐 {Number(sqft).toLocaleString()} sqft</span>}
                {yr && <span>🏠 Built {yr} ({homeAge(yr)}yr)</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
