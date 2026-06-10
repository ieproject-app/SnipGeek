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
          {/* Logo mark - new compass/star design matching logo.svg */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width="80"
            height="80"
            style={{
              filter: "drop-shadow(0 8px 40px rgba(14, 165, 233, 0.5))",
            }}
          >
            <defs>
              <linearGradient id="sg-grad-og" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <path
              d="M 60.87 9.43 A 42 42 0 0 1 90.57 60.87 L 53.46 52 L 79.7 79.7 A 42 42 0 0 1 20.3 79.7 L 46.54 52 L 9.43 60.87 A 42 42 0 0 1 39.13 9.43 L 50 46 Z"
              fill="none"
              stroke="url(#sg-grad-og)"
              strokeWidth="6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
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
