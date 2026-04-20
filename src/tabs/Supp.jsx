import { useState } from 'react'

const LINE_ITEMS = [
  { id: 'drip_edge',       label: 'Drip Edge',           price: 285,  desc: 'Aluminum drip edge, all edges' },
  { id: 'ice_water',       label: 'Ice & Water Shield',  price: 420,  desc: '6ft in valleys & penetrations' },
  { id: 'starter_strip',   label: 'Starter Strip',        price: 195,  desc: 'Factory-made starter shingles' },
  { id: 'synthetic_felt',  label: 'Synthetic Underlayment', price: 310, desc: 'Replace felt with synthetic' },
  { id: 'ridge_vent',      label: 'Ridge Vent',           price: 380,  desc: 'Continuous ridge ventilation' },
  { id: 'pipe_boots',      label: 'Pipe Boot Replacements', price: 145, desc: 'Per pipe (edit qty below)' },
  { id: 'step_flashing',   label: 'Step Flashing',        price: 260,  desc: 'Along walls & dormers' },
  { id: 'valley_metal',    label: 'Valley Metal',         price: 220,  desc: 'Closed metal valley system' },
  { id: 'deck_replace',    label: 'Roof Deck Replacement', price: 180,  desc: 'Per sheet (edit qty below)' },
  { id: 'dump_fee',        label: 'Dumpster / Haul-Off',  price: 450,  desc: 'Debris removal' },
  { id: 'permit',          label: 'Permit Fee',           price: 350,  desc: 'Building permit' },
  { id: 'tax',             label: 'Sales Tax on Materials', price: 0,   desc: 'Auto-calc at 6.625% NJ rate' },
  { id: 'op',              label: 'O&P (10% / 10%)',      price: 0,    desc: 'Overhead & Profit — auto-calc' },
]

export default function Supp() {
  const [checked, setChecked] = useState({})
  const [qty, setQty] = useState({ pipe_boots: 3, deck_replace: 4 })
  const [rcv, setRcv] = useState('')

  function toggle(id) {
    setChecked(p => ({ ...p, [id]: !p[id] }))
  }

  const rcvN = parseFloat(rcv) || 0

  function getPrice(item) {
    if (item.id === 'tax') {
      const base = LINE_ITEMS
        .filter(i => i.id !== 'tax' && i.id !== 'op' && checked[i.id])
        .reduce((s, i) => s + getItemPrice(i), 0)
      return base * 0.06625
    }
    if (item.id === 'op') {
      const base = LINE_ITEMS
        .filter(i => i.id !== 'op' && checked[i.id])
        .reduce((s, i) => s + getItemPrice(i), 0)
      const carrierBase = rcvN
      return Math.max(base * 0.2, carrierBase * 0.2)
    }
    return getItemPrice(item)
  }

  function getItemPrice(item) {
    const q = qty[item.id] || 1
    if (item.id === 'pipe_boots' || item.id === 'deck_replace') return item.price * q
    return item.price
  }

  const selectedItems = LINE_ITEMS.filter(i => checked[i.id])
  const total = selectedItems.reduce((s, i) => s + getPrice(i), 0)

  return (
    <div className="tab-content">
      <div className="section-card">
        <h3>Carrier Estimate RCV</h3>
        <div className="input-prefix">
          <span>$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Carrier's RCV for O&P calc"
            value={rcv}
            onChange={e => setRcv(e.target.value)}
          />
        </div>
      </div>

      <div className="section-card">
        <h3>Missing Line Items</h3>
        <p className="subtitle">Check items missing from carrier estimate</p>

        {LINE_ITEMS.map(item => (
          <div key={item.id} className={`supp-item ${checked[item.id] ? 'checked' : ''}`} onClick={() => toggle(item.id)}>
            <div className="supp-check">{checked[item.id] ? '✓' : ''}</div>
            <div className="supp-info">
              <div className="supp-label">{item.label}</div>
              <div className="supp-desc">{item.desc}</div>
            </div>
            <div className="supp-price">
              {item.price === 0 ? (
                <span className="auto-calc">auto</span>
              ) : (item.id === 'pipe_boots' || item.id === 'deck_replace') ? (
                <div className="qty-row" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setQty(q => ({ ...q, [item.id]: Math.max(1, (q[item.id] || 1) - 1) }))}>−</button>
                  <span>{qty[item.id] || 1}</span>
                  <button onClick={() => setQty(q => ({ ...q, [item.id]: (q[item.id] || 1) + 1 }))}>+</button>
                </div>
              ) : null}
              <span className="price-tag">${getItemPrice(item).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="section-card results-card">
          <h3>Supplement Summary</h3>
          {selectedItems.map(item => (
            <div key={item.id} className="result-row">
              <span>{item.label}</span>
              <span className="result-value">${getPrice(item).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div className="result-divider" />
          <div className="result-row highlight">
            <span>Total Supplement</span>
            <span className="result-value big">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  )
}
