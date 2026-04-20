import { useState, useEffect } from 'react'
import PinLock from './PinLock.jsx'
import Calc from './tabs/Calc.jsx'
import Supp from './tabs/Supp.jsx'
import Dec from './tabs/Dec.jsx'
import Storms from './tabs/Storms.jsx'
import Search from './tabs/Search.jsx'
import AiRoof from './tabs/AiRoof.jsx'

const TABS = [
  { id: 'calc',   label: '🧮', title: 'Calc'   },
  { id: 'supp',   label: '📋', title: 'Supp'   },
  { id: 'dec',    label: '📄', title: 'Dec'    },
  { id: 'storms', label: '⛈️',  title: 'Storms' },
  { id: 'search', label: '🏘️',  title: 'Search' },
  { id: 'roof',   label: '📸', title: 'Roof'   },
]

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [activeTab, setActiveTab] = useState('calc')
  const [showSettings, setShowSettings] = useState(false)
  const [calcData, setCalcData] = useState(null)

  // Check existing session on load
  useEffect(() => {
    const expiry = localStorage.getItem('session_expiry')
    if (expiry && Date.now() < Number(expiry)) {
      setUnlocked(true)
    }
  }, [])

  function handleUnlock() {
    setUnlocked(true)
  }

  function handleFillCalc(data) {
    setCalcData(data)
    setActiveTab('calc')
  }

  if (!unlocked) {
    return <PinLock onUnlock={handleUnlock} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          {TABS.find(t => t.id === activeTab)?.label}{' '}
          {TABS.find(t => t.id === activeTab)?.title}
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          ⚙ API
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'calc'   && <Calc prefill={calcData} onClearPrefill={() => setCalcData(null)} />}
        {activeTab === 'supp'   && <Supp />}
        {activeTab === 'dec'    && <Dec onFillCalc={handleFillCalc} />}
        {activeTab === 'storms' && <Storms />}
        {activeTab === 'search' && <Search />}
        {activeTab === 'roof'   && <AiRoof />}
      </main>

      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.label}</span>
            <span className="tab-label">{tab.title}</span>
          </button>
        ))}
      </nav>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function SettingsModal({ onClose }) {
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('claude_api_key') || '')
  const [rapidKey, setRapidKey] = useState(localStorage.getItem('rapid_api_key') || '')

  function save() {
    localStorage.setItem('claude_api_key', claudeKey.trim())
    localStorage.setItem('rapid_api_key', rapidKey.trim())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙ API Keys</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label>
            <span>Claude API Key</span>
            <span className="label-hint">For Dec &amp; AI Roof tabs</span>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={claudeKey}
              onChange={e => setClaudeKey(e.target.value)}
            />
          </label>

          <label>
            <span>RapidAPI Key</span>
            <span className="label-hint">For Property Search tab</span>
            <input
              type="password"
              placeholder="Your RapidAPI key"
              value={rapidKey}
              onChange={e => setRapidKey(e.target.value)}
            />
          </label>

          <p className="modal-note">
            Keys are stored only on this device. Never sent to any server except the respective APIs.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
