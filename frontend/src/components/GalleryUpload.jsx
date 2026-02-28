/**
 * GalleryUpload.jsx
 * Upload an image (or the game canvas snapshot) to Pinata IPFS via the backend.
 */
import React, { useState, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const S   = { color: '#c8d0f0', fontFamily: 'inherit' }

export default function GalleryUpload({ wallet }) {
  const [status, setStatus]   = useState('idle')   // idle | uploading | done | error
  const [result, setResult]   = useState(null)
  const [preview, setPreview] = useState(null)
  const [b64, setB64]         = useState(null)
  const fileRef               = useRef()

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
      setB64(ev.target.result)
      setStatus('idle')
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  /** Grab a snapshot from the Phaser canvas */
  function snapCanvas() {
    const canvas = document.querySelector('canvas')
    if (!canvas) return alert('Game canvas not found')
    const data = canvas.toDataURL('image/png')
    setPreview(data)
    setB64(data)
    setStatus('idle')
    setResult(null)
  }

  async function upload() {
    if (!b64) return alert('Pick or snap an image first')
    setStatus('uploading')
    setResult(null)
    try {
      const res  = await fetch(`${API}/api/gallery/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, painter: wallet || 'anon' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || res.statusText)
      setResult({ ok: true, url: data.url, hash: data.ipfsHash })
      setStatus('done')
    } catch (err) {
      setResult({ ok: false, error: err.message })
      setStatus('error')
    }
  }

  return (
    <div style={{ padding: 12, ...S }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a5180', marginBottom: 8 }}>
        PINATA / IPFS UPLOAD
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button onClick={() => fileRef.current?.click()}
          style={btnStyle('#1a2040', '#6366f1')}>
          📂 File
        </button>
        <button onClick={snapCanvas}
          style={btnStyle('#1a2040', '#22c55e')}>
          📸 Canvas
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={onFileChange} />

      {/* Preview */}
      {preview && (
        <img src={preview} alt="preview"
          style={{ width: '100%', borderRadius: 4, marginBottom: 8, border: '1px solid #2a2f52' }} />
      )}

      {/* Upload button */}
      {b64 && (
        <button onClick={upload} disabled={status === 'uploading'}
          style={{ ...btnStyle('#6366f1', '#818cf8'), width: '100%', marginBottom: 8 }}>
          {status === 'uploading' ? '⏳ Uploading…' : '⬆ Upload to IPFS'}
        </button>
      )}

      {/* Result */}
      {status === 'done' && result?.ok && (
        <div style={{ fontSize: 9, background: '#0a1020', borderRadius: 4, padding: 8 }}>
          <div style={{ color: '#22c55e', marginBottom: 4 }}>✅ Uploaded!</div>
          <a href={result.url} target="_blank" rel="noreferrer"
            style={{ color: '#6366f1', wordBreak: 'break-all', fontSize: 8 }}>
            {result.url}
          </a>
          <div style={{ color: '#4a5180', fontSize: 8, marginTop: 4 }}>
            IPFS: {result.hash}
          </div>
        </div>
      )}
      {status === 'error' && (
        <div style={{ fontSize: 9, color: '#ef4444', background: '#1a0a0a', borderRadius: 4, padding: 8 }}>
          ❌ {result?.error}
        </div>
      )}
    </div>
  )
}

const btnStyle = (bg, border) => ({
  background: bg,
  border: `1px solid ${border}`,
  color: '#c8d0f0',
  borderRadius: 4,
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: 10,
  fontFamily: 'inherit',
})
