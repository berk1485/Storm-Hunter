import { useState, useEffect } from 'react'

function currency(n) {
  return isNaN(n) ? '$0' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parse(v) {
  return parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0
}

export default function Calc({ prefill, onClearPrefill }) {
  const [rcv, setRcv] = useState('')
  const [depreciation, setDepreciation] = useState('')
  const [deductible, setDeductible] = useState('')
  const [overhead, setOverhead] = useState('10')
  const [profit, setProfit] = useState('10')

  useEffect(() => {
    if (prefill) {
      if (prefill.rcv)         setRcv(String(prefill.rcv))
      if (prefill.depreciation) setDepreciation(String(prefill.depreciation))
      if (prefill.deductible)  setDeductible(String(prefill.deductible))
      onClearPrefill?.()
    }
  }, [prefill])

  const rcvN   = parse(rcv)
  const depN   = parse(depreciation)
  const dedN   = parse(deductible)
  const opN    = parse(overhead)
  const profN  = parse(profit)

  const acv      = rcvN - depN
  const opAmount = rcvN * (opN / 100)
  const profitAmount = rcvN * (profN / 100)
  const grossRevenue = acv + opAmount + profitAmount
  const netRevenue   = grossRevenue - dedN

  function reset() {
    setRcv('')
    setDepreciation('')
    setDeductible('')
    setOverhead('10')
    setProfit('10')
  }

  return (
    <div className="tab-content">
      <div className="section-card">
        <h3>Job Financials</h3>

        <div className="input-group">
          <label>RCV (Replacement Cost Value)</label>
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={rcv}
              onChange={e => setRcv(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Depreciation</label>
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={depreciation}
              onChange={e => setDepreciation(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Deductible</label>
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={deductible}
              onChange={e => setDeductible(e.target.value)}
            />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>O&amp;P Overhead %</label>
            <div className="input-prefix">
              <input
                type="number"
                inputMode="decimal"
                placeholder="10"
                value={overhead}
                onChange={e => setOverhead(e.target.value)}
              />
              <span>%</span>
            </div>
          </div>
          <div className="input-group">
            <label>Profit %</label>
            <div className="input-prefix">
              <input
                type="number"
                inputMode="decimal"
                placeholder="10"
                value={profit}
                onChange={e => setProfit(e.target.value)}
              />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card results-card">
        <h3>Results</h3>
        <div className="result-row">
          <span>ACV (RCV − Depreciation)</span>
          <span className="result-value">{currency(acv)}</span>
        </div>
        <div className="result-row">
          <span>Overhead ({opN}%)</span>
          <span className="result-value">{currency(opAmount)}</span>
        </div>
        <div className="result-row">
          <span>Profit ({profN}%)</span>
          <span className="result-value">{currency(profitAmount)}</span>
        </div>
        <div className="result-row">
          <span>Deductible</span>
          <span className="result-value neg">− {currency(dedN)}</span>
        </div>
        <div className="result-divider" />
        <div className="result-row highlight">
          <span>Your Revenue</span>
          <span className="result-value big">{currency(netRevenue)}</span>
        </div>
      </div>

      <button className="btn-secondary" onClick={reset}>Reset</button>
    </div>
  )
}
