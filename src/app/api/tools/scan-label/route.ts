import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Persistent rate limit replaced in-memory store


export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam 10 menit.' },
      { status: 429 }
    )
  }

  try {
    const { image } = await req.json()
    if (!image) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key tidak terkonfigurasi.' }, { status: 500 })
    }

    // Extract base64 and mime type
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ error: 'Format gambar tidak valid.' }, { status: 400 })
    }
    const mimeType = match[1]
    const base64Data = match[2]

    const prompt = `This is a photo of a laptop label or the area around the keyboard/bottom. 
    Please identify the BRAND and MODEL/SERIES of the laptop. 
    Return ONLY a JSON object: { "brand": "...", "model": "..." }. 
    If you cannot find the info, return empty strings.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      let errorInfo = 'Gagal memproses gambar.'
      try {
        const errJson = JSON.parse(errText)
        errorInfo = `Gemini Error: ${errJson.error?.message || errText}`
      } catch {
        errorInfo = `Gemini Error: ${res.statusText}`
      }
      console.error('[scan-label] Gemini Error:', res.status, errText)
      return NextResponse.json({ error: errorInfo }, { status: res.status })
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleanJson = rawText.replace(/```json|```/g, '').trim()
    
    try {
      const parsed = JSON.parse(cleanJson)
      return NextResponse.json(parsed)
    } catch {
      console.error('[scan-label] Failed to parse JSON:', cleanJson)
      return NextResponse.json({ error: 'Gagal mengekstrak data dari gambar.' }, { status: 500 })
    }
  } catch (error) {
    console.error('[scan-label] Unexpected error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 })
  }
}
