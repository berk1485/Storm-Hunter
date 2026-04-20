import { useState, useEffect } from 'react'

const VALID_PINS = ['1234', '5678']
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30 * 1000 // 30 seconds

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [shake, setShake] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(interval)
  }, [])

  const locked = lockedUntil && now < lockedUntil
  const lockSecondsLeft = locked ? Math.ceil((lockedUntil - now) / 1000) : 0

  function press(digit) {
    if (locked) return
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => checkPin(next), 100)
    }
  }

  function checkPin(entered) {
    if (VALID_PINS.includes(entered)) {
      localStorage.setItem('session_expiry', String(Date.now() + SESSION_DURATION_MS))
      onUnlock()
    } else {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        setAttempts(0)
      }
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setPin('')
    }
  }

  function del() {
    setPin(p => p.slice(0, -1))
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length)

  return (
    <div className="pin-lock">
      <div className="pin-logo">⛈</div>
      <div className="pin-title">UGR StormTarget Pro</div>

      {locked ? (
        <div className="pin-lockout">
          🔒 Too many attempts<br />
          Wait {lockSecondsLeft}s
        </div>
      ) : (
        <>
          <div className={`pin-dots ${shake ? 'shake' : ''}`}>
            {dots.map((filled, i) => (
              <div key={i} className={`pin-dot ${filled ? 'filled' : ''}`} />
            ))}
          </div>

          <div className="pin-grid">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
              <button
                key={i}
                className={`pin-key ${k === '' ? 'invisible' : ''}`}
                onClick={() => k === '⌫' ? del() : k !== '' && press(k)}
                disabled={locked}
              >
                {k}
              </button>
            ))}
          </div>

          {attempts > 0 && (
            <div className="pin-warning">
              {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
            </div>
          )}
        </>
      )}
    </div>
  )
}
