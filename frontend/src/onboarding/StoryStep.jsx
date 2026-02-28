import { useEffect, useState } from 'react'

export default function StoryStep({ icon, title, text, btn, isNameStep, name, onNameChange, onNext, step, total }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      width: 'min(520px, 92vw)',
      background: 'linear-gradient(135deg, rgba(20,12,50,0.95) 0%, rgba(10,8,30,0.98) 100%)',
      border: '1px solid rgba(212,175,55,0.25)',
      borderRadius: 16,
      padding: '36px 40px',
      boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.04)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        fontSize: 54, marginBottom: 18,
        filter: 'drop-shadow(0 0 18px rgba(212,175,55,0.5))',
        animation: 'pulse 2.8s ease-in-out infinite',
      }}>
        {icon}
      </div>

      {/* Title */}
      <div style={{
        fontSize: 20, fontWeight: 'bold', color: '#d4af37',
        letterSpacing: 2, marginBottom: 18,
        textShadow: '0 0 30px rgba(212,175,55,0.4)',
      }}>
        {title}
      </div>

      {/* Text */}
      <div style={{
        fontSize: 13, color: 'rgba(200,210,230,0.82)', lineHeight: 1.75,
        marginBottom: 28, padding: '0 6px',
      }}>
        {text}
      </div>

      {/* Name input */}
      {isNameStep && (
        <div style={{ marginBottom: 22 }}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value.slice(0, 24))}
            onKeyDown={e => e.key === 'Enter' && onNext()}
            placeholder="Your warrior name…"
            maxLength={24}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderRadius: 8, padding: '12px 14px',
              fontSize: 14, fontFamily: 'monospace',
              color: '#e8e8f8', letterSpacing: 1,
              outline: 'none', textAlign: 'center',
              boxShadow: '0 0 20px rgba(212,175,55,0.1) inset',
            }}
          />
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
            {name.length}/24 · letters, numbers, spaces ok
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={onNext}
        disabled={isNameStep && !name.trim()}
        style={{
          width: '100%', padding: '13px 0',
          background: isNameStep && !name.trim()
            ? 'rgba(100,80,30,0.3)'
            : 'linear-gradient(135deg, #8b5e00, #d4af37, #8b5e00)',
          border: '1px solid rgba(212,175,55,0.5)',
          borderRadius: 9, color: isNameStep && !name.trim() ? 'rgba(255,255,255,0.2)' : '#0a0814',
          fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 2,
          cursor: isNameStep && !name.trim() ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: isNameStep && !name.trim() ? 'none' : '0 4px 24px rgba(212,175,55,0.35)',
        }}
        onMouseOver={e => { if (!(isNameStep && !name.trim())) e.currentTarget.style.background = 'linear-gradient(135deg, #b08000, #f0c830, #b08000)' }}
        onMouseOut={e => { if (!(isNameStep && !name.trim())) e.currentTarget.style.background = 'linear-gradient(135deg, #8b5e00, #d4af37, #8b5e00)' }}
      >
        {btn} {!isNameStep ? '→' : '⚔'}
      </button>

      {/* Step counter */}
      <div style={{ marginTop: 18, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
        {step + 1} / {total}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
