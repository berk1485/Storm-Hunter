import { useState, useEffect } from 'react'

const STATES = [
  { code: 'NJ', name: 'New Jersey' },
  { code: 'PA', name: 'Pennsylvania' },
]

const ROOFING_EVENTS = new Set([
  'Hail', 'High Wind', 'Tornado', 'Thunderstorm Wind',
  'Strong Wind', 'Hurricane', 'Tropical Storm', 'Ice Storm',
  'Winter Storm', 'Blizzard', 'Heavy Snow',
])

function eventIcon(event) {
  const e = event.toLowerCase()
  if (e.includes('hail'))       return '🧊'
  if (e.includes('tornado'))    return '🌪️'
  if (e.includes('wind'))       return '💨'
  if (e.includes('thunder'))    return '⛈️'
  if (e.includes('hurricane') || e.includes('tropical')) return '🌀'
  if (e.includes('snow') || e.includes('blizzard') || e.includes('winter') || e.includes('ice')) return '❄️'
  return '⚠️'
}

function severityClass(severity) {
  const s = (severity || '').toLowerCase()
  if (s === 'extreme') return 'sev-extreme'
  if (s === 'severe')  return 'sev-severe'
  if (s === 'moderate') return 'sev-moderate'
  return 'sev-minor'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function Storms() {
  const [state, setState] = useState('NJ')
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastFetch, setLastFetch] = useState(null)

  useEffect(() => {
    fetchAlerts(state)
  }, [state])

  async function fetchAlerts(stateCode) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://api.weather.gov/alerts/active?area=${stateCode}&status=actual`, {
        headers: { 'User-Agent': 'UGR-StormTarget/1.0 (contractor-app)' },
      })
      if (!res.ok) throw new Error(`NWS API error ${res.status}`)
      const json = await res.json()

      const filtered = (json.features || [])
        .map(f => f.properties)
        .filter(p => {
          const event = p.event || ''
          return Array.from(ROOFING_EVENTS).some(e => event.toLowerCase().includes(e.toLowerCase()))
        })
        .sort((a, b) => new Date(b.sent) - new Date(a.sent))

      setAlerts(filtered)
      setLastFetch(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tab-content">
      <div className="segment-row">
        {STATES.map(s => (
          <button
            key={s.code}
            className={`segment-btn ${state === s.code ? 'active' : ''}`}
            onClick={() => setState(s.code)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="section-header">
        <span className="section-subtitle">
          {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : 'Fetching…'}
        </span>
        <button className="refresh-btn" onClick={() => fetchAlerts(state)} disabled={loading}>
          {loading ? '↻' : '↺'} Refresh
        </button>
      </div>

      {error && <div className="error-card">{error}</div>}

      {loading && !alerts.length && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading storm alerts…</span>
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div>No active roofing-relevant alerts for {STATES.find(s => s.code === state)?.name}</div>
        </div>
      )}

      {alerts.map((alert, i) => (
        <div key={i} className={`alert-card ${severityClass(alert.severity)}`}>
          <div className="alert-header">
            <span className="alert-icon">{eventIcon(alert.event)}</span>
            <div className="alert-title-group">
              <div className="alert-event">{alert.event}</div>
              <div className="alert-area">{alert.areaDesc}</div>
            </div>
            <div className={`alert-badge ${severityClass(alert.severity)}`}>
              {alert.severity || 'Alert'}
            </div>
          </div>
          <div className="alert-meta">
            <span>Issued: {formatDate(alert.sent)}</span>
            {alert.expires && <span>Expires: {formatDate(alert.expires)}</span>}
          </div>
          {alert.description && (
            <details className="alert-details">
              <summary>Details</summary>
              <p>{alert.description.slice(0, 400)}{alert.description.length > 400 ? '…' : ''}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}
