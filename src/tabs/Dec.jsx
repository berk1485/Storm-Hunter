import { useState, useRef } from 'react'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an insurance declaration page analyzer for roofing contractors in NJ and PA.
Extract key financial fields from insurance declaration pages and return them as JSON.
Be precise with dollar amounts. If a field is not found, use 0 for numbers or empty string for text.`

const EXTRACT_PROMPT = `Extract these fields from this insurance declaration page and return ONLY valid JSON with exactly these keys:
{
  "insured_name": "",
  "property_address": "",
  "policy_number": "",
  "claim_number": "",
  "rcv": 0,
  "depreciation": 0,
  "acv": 0,
  "deductible": 0,
  "coverage_type": "",
  "notes": ""
}
Rules:
- Dollar amounts must be numbers only (no $ signs, no commas)
- rcv = Replacement Cost Value
- depreciation = the withheld depreciation amount
- acv = Actual Cash Value (rcv minus depreciation)
- If acv is not shown but rcv and depreciation are, calculate acv = rcv - depreciation
- coverage_type = e.g. "HO-3", "DP-3", etc.
- notes = any important conditions, exclusions, or remarks`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function getMediaType(file) {
  if (isPdf(file)) return 'application/pdf'
  if (file.type.startsWith('image/')) return file.type
  return 'image/jpeg'
}

export default function Dec({ onFillCalc }) {
  const [status, setStatus] = useState('idle')
  const [extracted, setExtracted] = useState(null)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef(null)

  const apiKey = localStorage.getItem('claude_api_key')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!apiKey) {
      setError('Claude API key not set — tap ⚙ API to add it.')
      return
    }

    setFileName(file.name)
    setStatus('loading')
    setError('')
    setExtracted(null)

    try {
      const base64 = await fileToBase64(file)
      const mediaType = getMediaType(file)

      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      })

      // Build content: PDF uses document type, images use image type
      const docBlock = isPdf(file)
        ? {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          }
        : {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          }

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
            content: [docBlock, { type: 'text', text: EXTRACT_PROMPT }],
          },
        ],
      })

      const text = response.content.find(b => b.type === 'text')?.text || ''

      // Extract JSON from response (may be wrapped in markdown code fences)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text.trim()
      const data = JSON.parse(jsonStr)

      setExtracted(data)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to analyze document')
      setStatus('error')
    }

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function fillCalc() {
    if (extracted && onFillCalc) {
      onFillCalc({
        rcv: extracted.rcv || 0,
        depreciation: extracted.depreciation || 0,
        acv: extracted.acv || 0,
        deductible: extracted.deductible || 0,
      })
    }
  }

  function reset() {
    setStatus('idle')
    setExtracted(null)
    setError('')
    setFileName('')
  }

  return (
    <div className="tab-content">
      {!apiKey && (
        <div className="warning-banner">
          ⚠️ Set your Claude API key in <strong>⚙ API</strong> settings to use this feature.
        </div>
      )}

      <div className="section-card">
        <h3>Upload Declaration Page</h3>
        <p className="subtitle">PDF or photo — Claude AI reads and extracts the numbers</p>

        <div
          className={`upload-area ${status === 'loading' ? 'loading' : ''}`}
          onClick={() => status !== 'loading' && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/*"
            capture="environment"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          {status === 'loading' ? (
            <div className="upload-loading">
              <div className="spinner" />
              <span>Analyzing with Claude AI…</span>
            </div>
          ) : (
            <>
              <div className="upload-icon">📎</div>
              <div className="upload-text">
                {fileName ? `Re-scan: ${fileName}` : 'Tap to select PDF or take photo'}
              </div>
            </>
          )}
        </div>
      </div>

      {status === 'error' && (
        <div className="error-card">
          <strong>Error:</strong> {error}
          <button className="btn-secondary small" onClick={reset}>Try again</button>
        </div>
      )}

      {status === 'done' && extracted && (
        <div className="section-card">
          <h3>Extracted Data</h3>

          {(extracted.insured_name || extracted.property_address) && (
            <div className="extracted-info">
              {extracted.insured_name && (
                <div className="info-row"><span className="info-label">Insured</span><span>{extracted.insured_name}</span></div>
              )}
              {extracted.property_address && (
                <div className="info-row"><span className="info-label">Address</span><span>{extracted.property_address}</span></div>
              )}
              {extracted.policy_number && (
                <div className="info-row"><span className="info-label">Policy #</span><span>{extracted.policy_number}</span></div>
              )}
              {extracted.claim_number && (
                <div className="info-row"><span className="info-label">Claim #</span><span>{extracted.claim_number}</span></div>
              )}
              {extracted.coverage_type && (
                <div className="info-row"><span className="info-label">Coverage</span><span>{extracted.coverage_type}</span></div>
              )}
            </div>
          )}

          <div className="result-divider" />

          <div className="result-row">
            <span>RCV</span>
            <span className="result-value">${(extracted.rcv || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="result-row">
            <span>Depreciation</span>
            <span className="result-value neg">− ${(extracted.depreciation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="result-row highlight">
            <span>ACV</span>
            <span className="result-value big">${(extracted.acv || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="result-row">
            <span>Deductible</span>
            <span className="result-value">${(extracted.deductible || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          {extracted.notes && (
            <div className="notes-box">{extracted.notes}</div>
          )}

          <div className="action-row">
            <button className="btn-primary" onClick={fillCalc}>
              → Auto-fill Calculator
            </button>
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
              Scan another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
