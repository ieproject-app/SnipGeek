import { ImageResponse } from 'next/og'
import type { Locale } from '@/i18n-config'

export const alt = 'SnipGeek - Windows dan Ubuntu: Tutorial, Troubleshooting, dan Update Penting'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const isId = locale === 'id'

  const tagline = isId
    ? 'Tutorial Windows & Ubuntu, Troubleshooting, dan Update Penting'
    : 'Windows & Ubuntu Tutorials, Troubleshooting, and Important Updates'

  const accent = '#0488c7'
  const accentDark = '#036da0'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 60%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${accentDark}, ${accent}, ${accentDark})`,
            display: 'flex',
          }}
        />

        {/* Decorative circle top-right */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: `rgba(4, 136, 199, 0.07)`,
            display: 'flex',
          }}
        />

        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -160,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: `rgba(4, 136, 199, 0.04)`,
            display: 'flex',
          }}
        />

        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 28 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
              boxShadow: `0 8px 40px rgba(4, 136, 199, 0.5)`,
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 900, color: 'white' }}>S</span>
          </div>
          <span
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            SnipGeek
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 740,
            lineHeight: 1.5,
            marginBottom: 44,
          }}
        >
          {tagline}
        </div>

        {/* Topic chips */}
        <div style={{ display: 'flex', gap: 14 }}>
          {['Windows', 'Ubuntu', 'Tutorial', 'Tools'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '10px 24px',
                borderRadius: 100,
                background: 'rgba(4, 136, 199, 0.13)',
                border: '1px solid rgba(4, 136, 199, 0.35)',
                color: '#38bdf8',
                fontSize: 20,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* URL badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            right: 52,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: accent,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          snipgeek.com
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${accentDark}, ${accent}, ${accentDark})`,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
