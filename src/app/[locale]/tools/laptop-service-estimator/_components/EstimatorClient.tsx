'use client'

import { useState, useRef, useEffect } from 'react'
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
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Calendar,
  Info,
  Thermometer,
  Settings,
  Keyboard as KeyboardIcon,
  Sparkles,
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
}

interface EstimateResult {
  laptop: LaptopInfo
  items: ServiceItem[]
  total_min: number
  total_max: number
  notes: string
}

type ServiceCardContent = {
  label: string
  desc: string
}

// ─── Data Servis Static ───────────────────────────────────────────────────────
const SERVICE_BASE = [
  { id: 'thermal', icon: Thermometer, min: 50000, max: 100000 },
  { id: 'cleaning', icon: Sparkles, min: 75000, max: 150000 },
  { id: 'ram', icon: MemoryStick, min: 50000, max: 75000 },
  { id: 'ssd', icon: HardDrive, min: 75000, max: 100000 },
  { id: 'os', icon: Settings, min: 50000, max: 150000 },
  { id: 'screen', icon: Monitor, min: 100000, max: 150000 },
  { id: 'keyboard', icon: KeyboardIcon, min: 35000, max: 75000 },
  { id: 'repair', icon: Wrench, min: 150000, max: 350000 },
]

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
  useEffect(() => {
    // Add print CSS only once
    if (typeof window !== 'undefined' && !document.getElementById('print-estimate-style')) {
      const style = document.createElement('style');
      style.id = 'print-estimate-style';
      style.innerHTML = `@media print { body * { visibility: hidden !important; } .print-estimate, .print-estimate * { visibility: visible !important; } .print-estimate { position: absolute !important; left: 0; top: 0; width: 100vw; background: white; z-index: 9999; } }`;
      document.head.appendChild(style);
    }
  }, []);
  const d = dictionary?.laptopServiceEstimator
  const servicesDictionary = d?.services as Record<string, ServiceCardContent> | undefined

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [complaint, setComplaint] = useState('')
  const [history, setHistory] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [step, setStep] = useState<Step>('form')
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSpecs, setShowSpecs] = useState(true)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step === 'result') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step])

  // Fallback while dictionary reloads (to prevent HMR crash)
  if (!d) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Memuat form...</div>

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const isFormValid = brand.trim() !== '' && complaint.trim() !== ''

  const handleSubmit = async () => {
    if (!isFormValid) return

    setStep('loading')
    setError(null)

    const serviceLabels = SERVICE_BASE.filter((s) =>
      selectedServices.includes(s.id)
    ).map((s) => servicesDictionary?.[s.id]?.label ?? s.id)

    try {
      const res = await fetch('/api/tools/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.trim(),
          model: model.trim(),
          complaint: complaint.trim(),
          history: history.trim(),
          services: serviceLabels,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error')
        setStep('form')
        return
      }

      setResult(data)
      setStep('result')
    } catch {
      setError('Koneksi bermasalah.')
      setStep('form')
    }
  }

  const handleReset = () => {
    setBrand('')
    setModel('')
    setComplaint('')
    setHistory('')
    setSelectedServices([])
    setResult(null)
    setError(null)
    setShowSpecs(true)
    setStep('form')
  }

  const handleWhatsApp = () => {
    if (!result) return
    const waNumber = '6283896392608'

    const serviceLines = result.items
      .map((i) => `\u2022 ${i.service}: ${fmt(i.min)} \u2013 ${fmt(i.max)}`)
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

    const message =
      `${d.result.waGreeting}\n\n` +
      `${laptopLine}\n` +
      (specLines ? `${specLines}\n` : '') +
      (complaint.trim() ? `${d.result.waProblem} ${complaint.trim()}\n` : '') +
      (history.trim() ? `${d.result.waHistoryLabel} ${history.trim()}\n` : '') +
      `\n${d.result.waRequired}\n${serviceLines}\n\n` +
      `${d.result.totalEstimate}: ${fmt(result.total_min)} \u2013 ${fmt(result.total_max)}\n\n` +
      (result.notes ? `Catatan AI: ${result.notes}\n\n` : '') +
      `Bisa bantu cek lebih lanjut?`

    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }

  // ── FORM ────────────────────────────────────────────────────────────────────
  const formContent = (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={d.steps.a.brandPlaceholder}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="model" className="block text-sm font-semibold text-foreground">
              {d.steps.a.modelLabel} <span className="text-muted-foreground font-normal text-xs">{d.steps.a.modelOptional}</span>
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={d.steps.a.modelPlaceholder}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
            <p className="text-xs text-muted-foreground">{d.steps.a.modelHint}</p>
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
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder={d.steps.b.placeholder}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{d.steps.b.labelHistory}</label>
            <textarea
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder={d.steps.b.placeholderHistory}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Step C */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
        <div className="px-6 py-5 border-b border-border/60 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20 rotate-1">
                <span className="text-xl font-display font-black text-accent -rotate-1">C</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-0.5">{d.steps.c.badge}</p>
                <h2 className="text-h4 font-display font-black text-primary tracking-tight">{d.steps.c.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{d.steps.c.optionalHint}</p>
              </div>
            </div>
            {selectedServices.length > 0 && (
              <span className="text-xs font-black text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                {d.steps.c.selectedCount.replace('{count}', String(selectedServices.length))}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_BASE.map((svc) => {
              const isSelected = selectedServices.includes(svc.id)
              const isDisabled = !isSelected && selectedServices.length >= 5
              const SvcIcon = svc.icon
              const svcData = servicesDictionary?.[svc.id]
              return (
                <button
                  key={svc.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleService(svc.id)}
                  className={[
                    'group relative flex flex-col items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300',
                    isSelected
                      ? 'border-accent bg-accent/10 ring-1 ring-accent/30 shadow-md'
                      : isDisabled
                        ? 'border-border bg-muted/20 opacity-40 cursor-not-allowed shadow-none'
                        : 'border-border bg-background hover:border-accent/40 hover:bg-accent/[0.03] hover:translate-y-[-2px] shadow-sm',
                  ].join(' ')}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className={[
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'bg-accent text-accent-foreground' : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground'
                    ].join(' ')}>
                      <SvcIcon className="w-4.5 h-4.5" />
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-accent animate-in zoom-in-50" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-accent/50" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[13px] font-bold leading-tight truncate w-full text-foreground">
                      {svcData?.label ?? svc.id}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-1">
                      {svcData?.desc ?? ''}
                    </p>
                  </div>
                  <div className="mt-1 w-full pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{d.steps.c.priceLabel}</span>
                    <span className="text-[11px] font-black text-primary">{fmt(svc.min).replace(',00', '')}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={[
            'w-full flex items-center justify-center gap-2.5 rounded-xl py-4 px-6',
            'text-base font-bold transition-all duration-150',
            isFormValid
              ? 'bg-accent text-accent-foreground hover:opacity-90 active:scale-[0.99] shadow-md shadow-accent/20'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          ].join(' ')}
        >
          <Wrench className="w-5 h-5" />
          {d.form.submit}
        </button>
        {!isFormValid && (
          <p className="text-center text-xs text-muted-foreground">{d.form.submitHint}</p>
        )}
      </div>
    </div>
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
     <div ref={resultRef} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 print-estimate">
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">
          <CheckCircle2 className="w-4 h-4" />
          {d.result.status}
        </div>
      </div>

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
      <button
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-accent bg-white py-3 px-6 text-sm font-semibold text-accent hover:bg-accent/10 transition-all print:hidden mt-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-6 0v4m0 0h4m-4 0H8" /></svg>
        Simpan/Print Estimasi
      </button>

      <button
        onClick={handleWhatsApp}
        className="w-full flex items-center justify-center gap-3 rounded-xl py-4 px-6 text-base font-bold text-white transition-all shadow-lg shadow-green-500/20 bg-[#25D366] hover:opacity-90 active:scale-[0.99]"
      >
        <MessageCircle className="w-5 h-5" />
        {d.result.whatsappButton}
      </button>

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
