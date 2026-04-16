'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Laptop,
  Wrench,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Calendar,
  Info,
  Camera,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { ToolWrapper } from '@/components/tools/tool-wrapper'
import type { Dictionary } from '@/lib/get-dictionary'

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'form' | 'loading' | 'result'

interface LaptopInfo {
  found: boolean
  name: string
  processor?: string
  ram?: string
  storage?: string
  display?: string
  year?: string
}

interface ServiceItem {
  service: string
  note: string
  min: number
  max: number
  discounted?: boolean
  originalMin?: number
  originalMax?: number
}

interface EstimateResult {
  laptop: LaptopInfo
  items: ServiceItem[]
  total_min: number
  total_max: number
  notes: string
  bundleDiscount?: boolean
}

// ─── Form Schema ─────────────────────────────────────────────────────────────
interface EstimatorFormData {
  brand: string
  model: string
  complaint: string
  history: string
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

// ─── Props ────────────────────────────────────────────────────────────────────
interface EstimatorClientProps {
  dictionary: Dictionary
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EstimatorClient({ dictionary }: EstimatorClientProps) {
  // Print-only CSS: hide header, form, etc. only show resultContent
  const d = dictionary?.laptopServiceEstimator

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    reset: resetForm,
    formState: { errors: fieldErrors },
  } = useForm<EstimatorFormData>({
    defaultValues: { brand: '', model: '', complaint: '', history: '' },
    validate: ({ formValues }) => {
      const { brand, model, complaint } = formValues
      if (
        brand.trim().length >= 2 &&
        model.trim().length >= 2 &&
        complaint.trim().length >= 1 &&
        complaint.trim().length < 10
      ) {
        return {
          complaint: {
            message: 'Jelaskan lebih detail agar estimasi AI lebih akurat (min. 10 karakter).',
            type: 'formValidate',
          },
        }
      }
      return true
    },
  })

  const brand = watch('brand')
  const model = watch('model')
  const complaint = watch('complaint')
  const history = watch('history')

  const [step, setStep] = useState<Step>('form')
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSpecs, setShowSpecs] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedImage, setScannedImage] = useState<string | null>(null)
  const [showPriceDetails, setShowPriceDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [, setTick] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step === 'result') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step])

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const interval = setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        clearInterval(interval)
      }
      setTick(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownUntil])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
       setError('Silahkan unggah file gambar.')
       return
    }

    // Convert to base64 for preview and API
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setScannedImage(base64)
      await performScan(base64)
    }
    reader.readAsDataURL(file)
  }

  const applyScanResult = (scanBrand: string, scanModel?: string) => {
    setValue('brand', scanBrand, { shouldValidate: true })
    if (scanModel) setValue('model', scanModel, { shouldValidate: true })
  }

  const performScan = async (base64: string) => {
    setIsScanning(true)
    setError(null)
    try {
      const res = await fetch('/api/tools/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
      const data = await res.json()
      if (res.ok && data.brand) {
        applyScanResult(data.brand, data.model)
      } else {
        setError(data.error || 'Gagal membaca label. Coba foto lebih jelas.')
      }
    } catch {
      setError('Gagal menghubungkan ke layanan scan.')
    } finally {
      setIsScanning(false)
    }
  }

  const clearScan = () => {
    setScannedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Fallback while dictionary reloads (to prevent HMR crash)
  if (!d) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Memuat form...</div>

  const isFormValid = brand.trim() !== '' && model.trim() !== '' && complaint.trim() !== ''

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
  const isOnCooldown = cooldownRemaining > 0

  const onFormSubmit = async (data: EstimatorFormData) => {
    if (isOnCooldown) return

    setStep('loading')
    setError(null)

    try {
      const res = await fetch('/api/tools/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: data.brand.trim(),
          model: data.model.trim(),
          complaint: data.complaint.trim(),
          history: data.history.trim(),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Error')
        setStep('form')
        return
      }

      setResult(json)
      setStep('result')
      // 30 detik cooldown setelah berhasil generate
      setCooldownUntil(Date.now() + 30_000)
    } catch {
      setError('Koneksi bermasalah.')
      setStep('form')
    }
  }

  const handleReset = () => {
    resetForm()
    setResult(null)
    setError(null)
    setShowSpecs(true)
    setStep('form')
  }

  const handleCopy = async () => {
    if (!result) return

    const divider = '─'.repeat(30)
    const laptopLabel = result.laptop.found ? d.result.verified : d.result.unverified

    const specBlock = result.laptop.found
      ? [
          result.laptop.processor ? `  Processor : ${result.laptop.processor}` : '',
          result.laptop.ram ? `  RAM       : ${result.laptop.ram}` : '',
          result.laptop.storage ? `  Storage   : ${result.laptop.storage}` : '',
          result.laptop.display ? `  Layar     : ${result.laptop.display}` : '',
          result.laptop.year ? `  Tahun     : ${result.laptop.year}` : '',
        ].filter(Boolean).join('\n')
      : ''

    const serviceLines = result.items
      .map((i) => {
        if (i.service.toLowerCase().includes('diagnosa') && i.min === 0 && i.max === 0) {
          return `  \u2022 ${i.service}: GRATIS`
        } else if (i.discounted) {
          return `  \u2022 ${i.service}: ${fmt(i.min)} \u2013 ${fmt(i.max)} (diskon bundel)`
        } else {
          return `  \u2022 ${i.service}: ${fmt(i.min)} \u2013 ${fmt(i.max)}`
        }
      })
      .join('\n')

    const totalOriginalMin = result.items.reduce((sum, i) => sum + (i.originalMin || i.min), 0)
    const totalOriginalMax = result.items.reduce((sum, i) => sum + (i.originalMax || i.max), 0)
    const totalDiscountMin = totalOriginalMin - result.total_min
    const totalDiscountMax = totalOriginalMax - result.total_max
    const hasDiscount = totalDiscountMin > 0 || totalDiscountMax > 0

    const lines = [
      `ESTIMASI SERVIS LAPTOP`,
      `Powered by SnipGeek AI`,
      divider,
      ``,
      `${laptopLabel.toUpperCase()}: ${result.laptop.name}`,
      specBlock ? `${specBlock}` : '',
      ``,
      complaint.trim() ? `Keluhan: ${complaint.trim()}` : '',
      history.trim() ? `Riwayat: ${history.trim()}` : '',
      ``,
      divider,
      `RINCIAN SERVIS`,
      divider,
      serviceLines,
      ``,
      hasDiscount ? `Hemat: ${fmt(totalDiscountMin)} \u2013 ${fmt(totalDiscountMax)} (diskon bundel bongkaran)` : '',
      ``,
      `TOTAL ESTIMASI: ${fmt(result.total_min)} \u2013 ${fmt(result.total_max)}`,
      `(Biaya jasa saja, belum termasuk part)`,
      ``,
      result.notes ? `Catatan AI: ${result.notes}` : '',
      ``,
      divider,
      `* Harga final dikonfirmasi setelah pemeriksaan langsung.`,
      `* Konsultasi via WhatsApp gratis.`,
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(lines)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = lines
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleWhatsApp = () => {
    if (!result) return
    const waNumber = '6283896392608'

    const serviceLines = result.items
      .map((i) => {
        if (i.service.toLowerCase().includes('diagnosa') && i.min === 0 && i.max === 0) {
          return `\u2022 ${i.service}: FREE`
        } else if (i.discounted) {
          const originalPrice = `${fmt(i.originalMin || i.min)} \u2013 ${fmt(i.originalMax || i.max)}`
          const discountedPrice = `${fmt(i.min)} \u2013 ${fmt(i.max)}`
          return `\u2022 ${i.service}: ~~${originalPrice}~~ → ${discountedPrice} (Diskon ${Math.round((1 - i.min / (i.originalMin || i.min)) * 100)}%)`
        } else {
          return `\u2022 ${i.service}: ${fmt(i.min)} \u2013 ${fmt(i.max)}`
        }
      })
      .join('\n')

    const laptopLabel = result.laptop.found ? d.result.waVerifiedLabel : d.result.unverified
    const laptopLine = `${laptopLabel}: ${result.laptop.name}`

    const specLines = result.laptop.found
      ? [
        result.laptop.processor ? `  - Processor: ${result.laptop.processor}` : '',
        result.laptop.ram ? `  - RAM: ${result.laptop.ram}` : '',
        result.laptop.storage ? `  - Storage: ${result.laptop.storage}` : '',
        result.laptop.display ? `  - Screen: ${result.laptop.display}` : '',
        result.laptop.year ? `  - Year: ${result.laptop.year}` : '',
      ].filter(Boolean).join('\n')
      : ''

    // Calculate total original price and discount amount
    const totalOriginalMin = result.items.reduce((sum, i) => sum + (i.originalMin || i.min), 0)
    const totalOriginalMax = result.items.reduce((sum, i) => sum + (i.originalMax || i.max), 0)
    const totalDiscountMin = totalOriginalMin - result.total_min
    const totalDiscountMax = totalOriginalMax - result.total_max
    const hasDiscount = totalDiscountMin > 0 || totalDiscountMax > 0

    const message =
      `${d.result.waGreeting}\n\n` +
      `${laptopLine}\n` +
      (specLines ? `${specLines}\n` : '') +
      (complaint.trim() ? `${d.result.waProblem} ${complaint.trim()}\n` : '') +
      (history.trim() ? `${d.result.waHistoryLabel} ${history.trim()}\n` : '') +
      `\n${d.result.waRequired}\n${serviceLines}\n\n` +
      `${d.result.totalEstimate}: ${fmt(result.total_min)} \u2013 ${fmt(result.total_max)}\n` +
      (hasDiscount ? `*Hemat: ${fmt(totalDiscountMin)} \u2013 ${fmt(totalDiscountMax)} dari diskon bundel bongkaran!*\n\n` : '') +
      (result.notes ? `Catatan AI: ${result.notes}\n\n` : '') +
      `Bisa bantu cek lebih lanjut?`

    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  // ── FORM ────────────────────────────────────────────────────────────────────────
  const formContent = (
    <form onSubmit={rhfHandleSubmit(onFormSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step A */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
        <div className="px-6 py-5 flex items-center gap-4 border-b border-border/60 bg-muted/5">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 rotate-3">
            <span className="text-xl font-display font-black text-accent -rotate-3">A</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-0.5">{d.steps.a.badge}</p>
            <h2 className="text-h4 font-display font-black text-primary tracking-tight">{d.steps.a.title}</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="brand" className="block text-sm font-semibold text-foreground">
              {d.steps.a.brandLabel} <span className="text-destructive">*</span>
            </label>
            <input
              id="brand"
              type="text"
              {...register('brand', { required: 'Merek laptop wajib diisi.', minLength: { value: 2, message: 'Minimal 2 karakter.' } })}
              placeholder={d.steps.a.brandPlaceholder}
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${fieldErrors.brand ? 'border-destructive' : 'border-border'}`}
            />
            {fieldErrors.brand && <p className="text-xs text-destructive mt-1">{fieldErrors.brand.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="model" className="block text-sm font-semibold text-foreground">
              {d.steps.a.modelLabel} <span className="text-destructive">*</span>
            </label>
            <input
              id="model"
              type="text"
              {...register('model', { required: 'Seri/model wajib diisi.', minLength: { value: 2, message: 'Minimal 2 karakter.' } })}
              placeholder={d.steps.a.modelPlaceholder}
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${fieldErrors.model ? 'border-destructive' : 'border-border'}`}
            />
            {fieldErrors.model && <p className="text-xs text-destructive mt-1">{fieldErrors.model.message}</p>}
            <p className="text-xs text-muted-foreground">{d.steps.a.modelHint}</p>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{d.steps.a.scanOr}</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              {!scannedImage ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 py-4 px-4 hover:bg-accent/10 transition-all text-xs font-bold text-accent group"
                >
                  {isScanning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  )}
                  {isScanning ? 'Menganalisis...' : d.steps.a.scanLabelBtn}
                </button>
              ) : (
                 <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden p-2 flex items-center gap-3">
                   <div className="w-12 h-12 rounded-lg overflow-hidden bg-background shrink-0 border border-border">
                     <img src={scannedImage} alt="Label scan" className="w-full h-full object-cover" />
                   </div>
                   <div className="min-w-0 flex-1">
                     <p className="text-[11px] font-bold text-foreground truncate">Foto label terunggah</p>
                     <p className="text-[10px] text-muted-foreground leading-tight">{isScanning ? 'Mengekstrak data...' : 'Berhasil dianalisis'}</p>
                   </div>
                   {!isScanning && (
                     <button
                        type="button"
                        onClick={clearScan}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   )}
                   {isScanning && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
                 </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="mt-2 text-[10px] text-muted-foreground italic text-center px-4">
                {d.steps.a.scanHint}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step B */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
        <div className="px-6 py-5 flex items-center gap-4 border-b border-border/60 bg-muted/5">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 -rotate-2">
            <span className="text-xl font-display font-black text-accent rotate-2">B</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-0.5">{d.steps.b.badge}</p>
            <h2 className="text-h4 font-display font-black text-primary tracking-tight">{d.steps.b.title}</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{d.steps.b.labelProblem}</label>
            <textarea
              id="complaint"
              {...register('complaint', { required: 'Keluhan wajib diisi.' })}
              placeholder={d.steps.b.placeholder}
              rows={2}
              className={`w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none ${fieldErrors.complaint ? 'border-destructive' : 'border-border'}`}
            />
            {fieldErrors.complaint && <p className="text-xs text-destructive mt-1">{fieldErrors.complaint.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{d.steps.b.labelHistory}</label>
            <textarea
              id="history"
              {...register('history')}
              placeholder={d.steps.b.placeholderHistory}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <button
          type="submit"
          disabled={!isFormValid || isOnCooldown}
          className={[
            'w-full flex items-center justify-center gap-2.5 rounded-xl py-4 px-6',
            'text-base font-bold transition-all duration-150',
            isFormValid && !isOnCooldown
              ? 'bg-accent text-accent-foreground hover:opacity-90 active:scale-[0.99] shadow-md shadow-accent/20'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          ].join(' ')}>
          <Wrench className="w-5 h-5" />
          {isOnCooldown ? `Tunggu ${cooldownRemaining}s...` : d.form.submit}
        </button>
        {!isFormValid && !isOnCooldown && (
          <p className="text-center text-xs text-muted-foreground">{d.form.submitHint}</p>
        )}
        {isOnCooldown && (
          <p className="text-center text-xs text-muted-foreground">Mohon tunggu sebelum generate ulang.</p>
        )}
      </div>
    </form>
  )

  // ── LOADING ─────────────────────────────────────────────────────────────────
  const loadingContent = (
    <div className="flex flex-col items-center justify-center min-h-[52vh] gap-6 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-18 h-18 rounded-2xl bg-accent/10 flex items-center justify-center p-5">
          <Loader2 className="w-9 h-9 text-accent animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-ping" />
      </div>
      <div className="space-y-2">
        <p className="font-bold text-foreground text-lg tracking-tight">{d.form.loadingTitle}</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{d.form.loadingDesc}</p>
      </div>
    </div>
  )

  // ── RESULT ──────────────────────────────────────────────────────────────────
  const resultContent = result ? (
     <div ref={resultRef} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
          <CheckCircle2 className="w-4 h-4" />
          {d.result.status}
        </div>
      </div>

      {result.bundleDiscount && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 dark:border-green-800 dark:bg-green-950/20">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-[10px] font-bold">%</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">Diskon Bundel Bongkaran Berlaku!</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 leading-relaxed">
              Beberapa servis dikerjakan sekalian, jadi Anda hemat biaya jasa bongkar-pasang.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-accent/30 via-accent to-accent/30" />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {result.laptop.found ? d.result.verified : d.result.unverified}
            </p>
            <p className="text-sm font-bold text-foreground truncate mt-0.5">{result.laptop.name}</p>
            {!result.laptop.found && <p className="text-xs text-muted-foreground mt-0.5">{d.result.unverifiedDesc}</p>}
            {!result.laptop.found && (
              <p className="text-xs text-destructive mt-0.5 font-semibold">Model tidak terdeteksi, coba isi ulang dengan model lebih spesifik untuk estimasi lebih akurat.</p>
            )}
          </div>
        </div>

        {result.laptop.found && (
          <>
            <button
              onClick={() => setShowSpecs((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
            >
              <span>{d.result.specsTitle}</span>
              {showSpecs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showSpecs && (
              <div className="border-t border-border/60 divide-y divide-border/40">
                {[
                  { icon: Cpu, label: 'Processor', val: result.laptop.processor },
                  { icon: MemoryStick, label: 'RAM', val: result.laptop.ram },
                  { icon: HardDrive, label: 'Storage', val: result.laptop.storage },
                  { icon: Monitor, label: 'Screen', val: result.laptop.display },
                  { icon: Calendar, label: 'Year', val: result.laptop.year },
                ].filter(s => s.val).map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <spec.icon className="w-3 h-3 shrink-0" />
                      {spec.label}
                    </span>
                    {spec.label === 'Screen' && spec.val && spec.val.includes('/') ? (
                      <span className="text-xs font-semibold text-foreground">{spec.val.split('/').map(v => v.trim()).join(' / ')}</span>
                    ) : (
                      <span className="text-xs font-semibold text-foreground">{spec.val}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-accent/30 via-accent to-accent/30" />
        <div className="px-5 py-3.5 border-b border-border/60">
          <h2 className="text-h5 font-bold text-foreground">{d.result.priceDetails}</h2>
        </div>
        <div className="divide-y divide-border/40">
          {result.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{item.service}</p>
                {item.note && <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>}
              </div>
              <div className="text-right shrink-0">
                {item.service.toLowerCase().includes('diagnosa') && item.min === 0 && item.max === 0 ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-bold">FREE</span>
                ) : item.discounted ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-xs text-muted-foreground line-through">{fmt(item.originalMin || item.min)}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{fmt(item.min)}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-xs text-muted-foreground line-through">{fmt(item.originalMax || item.max)}</span>
                      <span className="text-xs text-muted-foreground">s/d {fmt(item.max)}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground">{fmt(item.min)}</p>
                    <p className="text-xs text-muted-foreground">s/d {fmt(item.max)}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Expandable Price Details Section */}
        {result.bundleDiscount && (
          <div className="border-t border-border/60">
            <button
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors bg-muted/20"
            >
              <span className="flex items-center gap-2">
                <span>Lihat Detail Diskon</span>
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-normal">
                  Hemat {fmt(result.items.reduce((sum, i) => sum + ((i.originalMin || i.min) - i.min), 0))}
                </span>
              </span>
              {showPriceDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            
            {showPriceDetails && (
              <div className="px-5 py-4 space-y-4 bg-accent/5 border-t border-border/40">
                {/* Explanation */}
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground mb-1">Mekanisme Diskon Bundel Bongkaran</p>
                    <p>Beberapa servis berikut memerlukan pembongkaran casing laptop. Karena dikerjakan bersamaan, Anda hemat biaya jasa bongkar-pasang:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• Servis pertama: Harga normal</li>
                      <li>• Servis kedua: Diskon 25%</li>
                      <li>• Servis ketiga dan seterusnya: Diskon 50%</li>
                    </ul>
                  </div>
                </div>
                
                {/* Detailed Breakdown */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">Rincian Harga per Layanan</p>
                  <div className="space-y-1.5">
                    {result.items
                      .filter(item => item.originalMin !== undefined && item.originalMin > item.min)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            <span className="font-medium">{item.service}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-muted-foreground line-through">{fmt(item.originalMin || item.min)}</span>
                              <span className="mx-1">→</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">{fmt(item.min)}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">
                              -{Math.round((1 - item.min / (item.originalMin || item.min)) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Summary */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <span className="text-xs font-bold text-foreground">Total Penghematan Anda</span>
                  <span className="text-sm font-black text-green-600 dark:text-green-400">
                    {fmt(result.items.reduce((sum, i) => sum + ((i.originalMin || i.min) - i.min), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-accent/8 border-t border-accent/20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{d.result.totalEstimate}</p>
            <p className="text-[10px] text-muted-foreground">{d.result.totalNote}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{fmt(result.total_min)}</p>
            <p className="text-base font-black text-accent">s/d {fmt(result.total_max)}</p>
          </div>
        </div>
      </div>

      {result.notes && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3.5">
          <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{result.notes}</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">{d.result.disclaimer}</p>
      <p className="text-xs text-accent text-center leading-relaxed px-2 font-semibold mt-2">Konsultasi via WhatsApp gratis, biaya hanya berlaku jika servis dilakukan.</p>
      {/* Print button removed */}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-sm font-bold text-white transition-all shadow-lg shadow-green-500/20 bg-[#25D366] hover:opacity-90 active:scale-[0.99]"
        >
          <MessageCircle className="w-4.5 h-4.5" />
          {d.result.whatsappButton}
        </button>

        <button
          onClick={handleCopy}
          className={[
            'flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-4 text-sm font-bold transition-all active:scale-[0.99]',
            copied
              ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
              : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
          ].join(' ')}
        >
          {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
          {copied ? d.result.copied : d.result.copyButton}
        </button>
      </div>

      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-transparent py-3 px-6 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        {d.result.recalculate}
      </button>
    </div>
  ) : null

  return (
    <ToolWrapper title={d.title} description={d.description} dictionary={dictionary} isPublic={true} requiresCloud={false}>
      {step === 'form' && formContent}
      {step === 'loading' && loadingContent}
      {step === 'result' && resultContent}
    </ToolWrapper>
  )
}
