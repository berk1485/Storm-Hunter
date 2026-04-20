import { useState, useRef } from 'react'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an expert roofing inspector and estimator with 20+ years of experience in NJ and PA.
Analyze roof photos and provide detailed assessments for restoration contractors.
Be specific, practical, and focused on what matters for an insurance claim.`

const ANALYZE_PROMPT = `Analyze this roof photo and provide a detailed assessment. Return your response as JSON with exactly these fields:
{
  "age_estimate": "e.g. 15-20 years",
  "condition": "Poor / Fair / Good / Excellent",
  "damage_score": 0,
  "storm_damage_likely": true,
  "damage_types": [],
  "claim_viability": "High / Medium / Low",
  "key_observations": [],
  "recommended_action": "",
  "supplement_items": []
}

Rules:
- damage_score: 0-10 (0=none, 10=total loss)
- damage_types: array of observed damage types (e.g. ["hail impact", "granule loss", "cracked shingles"])
- key_observations: 3-5 bullet points about condition
- supplement_items: list of likely supplement line items to document
- recommended_action: one sentence on next steps for the contractor`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getMediaType(file) {
  const type = file.type || 'image/jpeg'
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return allowed.includes(type) ? type : 'image/jpeg'
}

function DamageBar({ score }) {
  const pct = Math.min(100, (score / 10) * 100)
  const color = score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : '#22c55e'
  return (
    <div className="damage-bar-wrap">
      <div className="damage-bar-track">
        <div className="damage-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="damage-score-label">{score}/10</span>
    </div>
  )
}

export default function AiRoof() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const apiKey = localStorage.getItem('claude_api_key')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!apiKey) {
      setError('Claude API key not set — tap ⚙ API to add it.')
      return
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setStatus('loading')
    setError('')
    setResult(null)

    try {
      const base64 = await fileToBase64(file)
      const mediaType = getMediaType(file)

      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      })

      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              { type: 'text', text: ANALYZE_PROMPT },
            ],
          },
        ],
      })

      const text = response.content.find(b => b.type === 'text')?.text || ''
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text.trim()
      const data = JSON.parse(jsonStr)

      setResult(data)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to analyze image')
      setStatus('error')
    }

    e.target.value = ''
  }

  function reset() {
    setStatus('idle')
    setResult(null)
    setError('')
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  const claimColor = {
    High: '#22c55e', Medium: '#f59e0b', Low: '#ef4444',
  }

  return (
    <div className="tab-content">
      {!apiKey && (
        <div className="warning-banner">
          ⚠️ Set your Claude API key in <strong>⚙ API</strong> settings.
        </div>
      )}

      <div className="section-card">
        <h3>Roof Analysis</h3>
        <p className="subtitle">Take a photo or upload — AI estimates age &amp; damage</p>

        <div className="photo-actions">
          <button
            className="btn-photo"
            onClick={() => cameraRef.current?.click()}
            disabled={status === 'loading'}
          >
            📷 Take Photo
          </button>
          <button
            className="btn-photo secondary"
            onClick={() => fileRef.current?.click()}
            disabled={status === 'loading'}
          >
            📁 Upload
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
        <input ref={fileRef}   type="file" accept="image/*"                        onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {preview && (
        <div className="section-card">
          <img src={preview} alt="Roof" className="roof-preview" />
        </div>
      )}

      {status === 'loading' && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Analyzing roof with Claude AI…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="error-card">
          <strong>Error:</strong> {error}
          <button className="btn-secondary small" onClick={reset}>Try again</button>
        </div>
      )}

      {status === 'done' && result && (
        <>
          <div className="section-card">
            <h3>Assessment Summary</h3>

            <div className="roof-summary-grid">
              <div className="summary-cell">
                <div className="summary-label">Age Estimate</div>
                <div className="summary-value">{result.age_estimate}</div>
              </div>
              <div className="summary-cell">
                <div className="summary-label">Condition</div>
                <div className="summary-value">{result.condition}</div>
              </div>
              <div className="summary-cell wide">
                <div className="summary-label">Damage Score</div>
                <DamageBar score={result.damage_score || 0} />
              </div>
              <div className="summary-cell">
                <div className="summary-label">Claim Viability</div>
                <div className="summary-value" style={{ color: claimColor[result.claim_viability] || '#94a3b8' }}>
                  {result.claim_viability}
                </div>
              </div>
              <div className="summary-cell">
                <div className="summary-label">Storm Damage?</div>
                <div className="summary-value">
                  {result.storm_damage_likely ? '✅ Likely' : '❌ Unlikely'}
                </div>
              </div>
            </div>
          </div>

          {result.damage_types?.length > 0 && (
            <div className="section-card">
              <h3>Damage Types Observed</h3>
              <div className="tag-list">
                {result.damage_types.map((d, i) => (
                  <span key={i} className="damage-tag">{d}</span>
                ))}
              </div>
            </div>
          )}

          {result.key_observations?.length > 0 && (
            <div className="section-card">
              <h3>Key Observations</h3>
              <ul className="obs-list">
                {result.key_observations.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}

          {result.supplement_items?.length > 0 && (
            <div className="section-card">
              <h3>Potential Supplement Items</h3>
              <ul className="obs-list">
                {result.supplement_items.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.recommended_action && (
            <div className="section-card action-card">
              <h3>Recommended Action</h3>
              <p>{result.recommended_action}</p>
            </div>
          )}

          <button className="btn-secondary full-width" onClick={reset}>
            Analyze another roof
          </button>
        </>
      )}
    </div>
  )
}
