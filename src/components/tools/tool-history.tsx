
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useState, useEffect } from 'react'
import { type Dictionary } from '@/lib/get-dictionary'
import { cn } from '@/lib/utils'
import { Search, FileText, UserCheck, Plus, Trash2, Loader2, Copy, CheckCircle2, Database, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolWrapper } from '@/components/tools/tool-wrapper'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { docRules, formatDate } from './employee-history/types'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useEmployeeHistory } from './employee-history/use-employee-history'

export function ToolHistory({
  dictionary,
  employeeData,
  locale
}: {
  dictionary: Dictionary,
  employeeData: string,
  locale: string
}) {
  const { employeeHistory: t } = dictionary;
  const toolMeta = dictionary.tools.tool_list.employee_history;

  const hook = useEmployeeHistory(employeeData, locale);
  const {
    isDatasetLoading, isAdminUser, isAdminLoading,
    injectText, setInjectText, isInjecting,
    searchText, setSearchText, searchGrup, setSearchGrup,
    filteredPejabat, isSearching, copiedState,
    uniqueGrupJabatans,
    docQueries, generatedResults,
    handleQueryChange, addQueryRow, removeQueryRow,
    handleGenerateSigners, handleCopy, handleCopyAllGenerated,
    handleInjectEmployeeHistory,
  } = hook;

  const [openDatePickerId, setOpenDatePickerId] = useState<number | null>(null);
  const docTypeKeys = Object.keys(docRules);
  const singleDocType = docTypeKeys.length === 1 ? docTypeKeys[0] : null;

  useEffect(() => {
    if (singleDocType && docQueries.length === 1 && !docQueries[0].docType) {
      handleQueryChange(docQueries[0].id, 'docType', singleDocType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleDocType, handleQueryChange]);

  return (
    <TooltipProvider delayDuration={300}>
      <ToolWrapper
        title={toolMeta.title}
        description={toolMeta.description}
        dictionary={dictionary}
        isPublic={true}
        requiresCloud={false}
      >
        <div className="space-y-12">
          {(isAdminLoading || isAdminUser) && (
            <ScrollReveal direction="up" delay={0.05}>
              <Card className="border bg-card/50 rounded-lg overflow-hidden shadow-sm border-primary/10 transition-all duration-300 hover:border-primary/20">
                <CardHeader className="border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl">Admin Data Injection</CardTitle>
                      <CardDescription>Paste data tab-separated: Grup, Tgl Mulai, Tgl Selesai, Nama, Jabatan, NIK</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {isAdminLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memeriksa hak akses admin...
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Data Karyawan (TSV)
                        </Label>
                        <Textarea
                          value={injectText}
                          onChange={(e) => setInjectText(e.target.value)}
                          placeholder={'Mgr Finance\t01/02/2026\t31/12/9999\tAZHARY AGUNG KURNIA\tMgr Business Support Area Sumatera\t925598'}
                          className="min-h-40 font-mono text-xs"
                        />
                      </div>
                      <Button
                        onClick={handleInjectEmployeeHistory}
                        disabled={isInjecting || !injectText.trim()}
                        className="rounded-lg"
                      >
                        {isInjecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Injecting...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Inject ke Firestore
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

          {/* Search Section */}
          <ScrollReveal direction="up" delay={0.1}>
            <Card className="border bg-card/50 rounded-lg overflow-hidden shadow-sm border-primary/10 transition-all duration-300 hover:border-primary/20">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">{t.searchTitle}</CardTitle>
                    <CardDescription>{t.searchDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t.searchPlaceholder}
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      className="pl-10 h-11 rounded-lg bg-background/50 border-muted focus-visible:ring-primary/20"
                    />
                    {(isSearching || isDatasetLoading) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <Select value={searchGrup} onValueChange={setSearchGrup}>
                    <SelectTrigger className="w-full md:w-60 h-11 rounded-lg bg-background/50 border-muted">
                      <SelectValue placeholder={t.groupPlaceholder} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {uniqueGrupJabatans.map(grup => (
                        <SelectItem key={grup} value={grup}>{grup === 'all' ? t.allGroups : grup}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative rounded-lg border bg-background/50 overflow-hidden min-h-100 flex flex-col">
                  <div className="overflow-x-auto flex-1">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="sticky left-0 z-20 bg-card font-bold py-4 pl-6 min-w-50 border-r">
                            {t.nameHeader}
                          </TableHead>
                          <TableHead className="font-bold px-4">{t.positionHeader}</TableHead>
                          <TableHead className="font-bold px-4">{t.groupHeader}</TableHead>
                          <TableHead className="font-bold px-4">{t.nikHeader}</TableHead>
                          <TableHead className="font-bold px-4">{t.startDateHeader}</TableHead>
                          <TableHead className="font-bold px-4 whitespace-nowrap">{t.endDateHeader}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPejabat.map((p, i) => {
                          const isActive = p.tglSelesai.getFullYear() === 9999;
                          return (
                            <tr
                              key={`${p.nik}-${i}`}
                              className={cn(
                                "border-b transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300",
                                isActive ? 'bg-primary/[0.04] hover:bg-primary/[0.10]' : 'hover:bg-accent/10 border-transparent hover:border-primary/15'
                              )}
                            >
                              <TableCell className="sticky left-0 z-10 bg-card py-4 pl-6 font-semibold border-r min-w-50">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopy(p.nama, p.nik, 'nama', 'Nama')}
                                      className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                    >
                                      <span className="truncate">{p.nama}</span>
                                      {copiedState?.id === p.nik && copiedState?.type === 'nama' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200">Klik untuk menyalin</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="text-muted-foreground px-4 text-xs md:text-sm">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopy(p.jabatan, p.nik, 'jabatan', 'Jabatan')}
                                      className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                    >
                                      <span className="line-clamp-2 leading-relaxed">{p.jabatan}</span>
                                      {copiedState?.id === p.nik && copiedState?.type === 'jabatan' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200 shadow-sm border-primary/10">Klik untuk menyalin</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="px-4">
                                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold tracking-wider uppercase text-muted-foreground border">
                                  {p.grupJabatan}
                                </span>
                              </TableCell>
                              <TableCell className="font-code text-xs tracking-wider px-4 opacity-70">{p.nik}</TableCell>
                              <TableCell className="px-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopy(formatDate(p.tglMulai, locale), `${p.nik}-mulai`, 'tglMulai', 'Tanggal mulai')}
                                      className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none font-code text-xs whitespace-nowrap opacity-70"
                                    >
                                      <span>{formatDate(p.tglMulai, locale)}</span>
                                      {copiedState?.id === `${p.nik}-mulai` && copiedState?.type === 'tglMulai' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200">Klik untuk menyalin</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="px-4">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleCopy(isActive ? t.present : formatDate(p.tglSelesai, locale), `${p.nik}-selesai`, 'tglSelesai', 'Tanggal selesai')}
                                      className={cn("text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none font-code text-xs whitespace-nowrap", isActive ? "text-primary font-bold" : "opacity-70")}
                                    >
                                      <span>{isActive ? t.present : formatDate(p.tglSelesai, locale)}</span>
                                      {copiedState?.id === `${p.nik}-selesai` && copiedState?.type === 'tglSelesai' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200">Klik untuk menyalin</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {(isSearching || isDatasetLoading) && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] gap-3 animate-in fade-in duration-200">
                      <div className="p-4 bg-background rounded-full shadow-xl border border-primary/10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-primary animate-pulse bg-background/80 px-3 py-1 rounded-full shadow-sm border">
                        Searching...
                      </span>
                    </div>
                  )}

                  {!isSearching && filteredPejabat.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center text-muted-foreground bg-muted/5 gap-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="p-4 bg-muted/20 rounded-full">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <p className="italic text-sm">No matching records found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Generator Section */}
          <ScrollReveal direction="up" delay={0.2}>
            <Card className="border bg-card/50 rounded-lg overflow-hidden shadow-sm border-primary/10 transition-all duration-300 hover:border-primary/20">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">{t.generatorTitle}</CardTitle>
                    <CardDescription>{t.generatorDescription}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {docQueries.map((query) => (
                    <div key={query.id} className="flex flex-col md:flex-row items-end gap-4 p-5 border rounded-lg bg-background/30 relative group transition-all hover:border-primary/30 hover:bg-accent/5">
                      <div className="w-full md:flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.docTypePlaceholder}</label>
                        {singleDocType ? (
                          <div className="h-11 px-4 rounded-lg bg-muted/30 border flex items-center text-sm font-medium">
                            {singleDocType}
                          </div>
                        ) : (
                          <Select value={query.docType} onValueChange={value => handleQueryChange(query.id, 'docType', value)}>
                            <SelectTrigger className="h-11 rounded-lg bg-background/50 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-lg">
                              {Object.keys(docRules).map(doc => <SelectItem key={doc} value={doc}>{doc}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="w-full md:flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.startDateHeader}</label>
                        <Popover open={openDatePickerId === query.id} onOpenChange={(isOpen) => setOpenDatePickerId(isOpen ? query.id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant={'outline'} className={cn('w-full h-11 justify-start text-left font-normal rounded-lg border-primary/10 hover:border-primary/30 focus-visible:ring-accent', !query.docDate && 'text-muted-foreground')}>
                              <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                              {query.docDate ? format(new Date(query.docDate), 'd MMM yyyy', { locale: id }) : <span>Pilih tanggal dokumen</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-1.5 border-primary/15 shadow-2xl rounded-xl overflow-hidden backdrop-blur-sm">
                            <Calendar
                              mode="single"
                              selected={query.docDate ? new Date(query.docDate) : undefined}
                              onSelect={(d) => {
                                if (!d) return;
                                // Use local date parts to avoid UTC timezone shift
                                // e.g. toISOString() on +07:00 timezone would shift date back by 1 day
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                handleQueryChange(query.id, 'docDate', `${yyyy}-${mm}-${dd}`);
                                setOpenDatePickerId(null);
                              }}
                              className="p-1"
                              classNames={{
                                month_caption: 'flex justify-center pt-1 pb-1 relative items-center',
                                caption_label: 'text-xs font-semibold',
                                weekday: 'text-muted-foreground rounded-md w-8 font-medium text-[11px] text-center',
                                day: 'h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                                day_button: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100',
                              }}
                              initialFocus
                              fixedWeeks={false}
                            />
                            <div className="border-t border-primary/5 px-2 pt-2 pb-1 flex gap-1.5">
                              <button
                                onClick={() => {
                                  const d = new Date();
                                  const yyyy = d.getFullYear();
                                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                                  const dd = String(d.getDate()).padStart(2, '0');
                                  handleQueryChange(query.id, 'docDate', `${yyyy}-${mm}-${dd}`);
                                  setOpenDatePickerId(null);
                                }}
                                className="flex-1 text-xs font-medium py-1.5 rounded-md bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                              >
                                Hari Ini
                              </button>
                              <button
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 7);
                                  const yyyy = d.getFullYear();
                                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                                  const dd = String(d.getDate()).padStart(2, '0');
                                  handleQueryChange(query.id, 'docDate', `${yyyy}-${mm}-${dd}`);
                                  setOpenDatePickerId(null);
                                }}
                                className="flex-1 text-xs font-medium py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                              >
                                +7 Hari
                              </button>
                              <button
                                onClick={() => {
                                  const d = new Date();
                                  d.setMonth(d.getMonth() + 1);
                                  const yyyy = d.getFullYear();
                                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                                  const dd = String(d.getDate()).padStart(2, '0');
                                  handleQueryChange(query.id, 'docDate', `${yyyy}-${mm}-${dd}`);
                                  setOpenDatePickerId(null);
                                }}
                                className="flex-1 text-xs font-medium py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                              >
                                +30 Hari
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {(query.docType === 'AMD PENUTUP' || query.docType === 'BAST') && (
                        <div className="w-full md:flex-1 space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.projectValuePlaceholder}</label>
                          <Input type="number" value={query.projectValue} onChange={e => handleQueryChange(query.id, 'projectValue', parseInt(e.target.value))} className="h-11 rounded-lg bg-background/50 focus-visible:ring-primary/20" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQueryRow(query.id)}
                        disabled={docQueries.length <= 1}
                        className="rounded-full hover:bg-destructive/12 hover:text-destructive transition-colors shrink-0 mb-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button onClick={addQueryRow} variant="outline" className="flex-1 rounded-lg h-12 border-dashed border-primary/30 hover:border-primary/40 hover:bg-accent/10 transition-colors">
                    <Plus className="mr-2 h-4 w-4" /> Add Another Document
                  </Button>
                  <Button onClick={handleGenerateSigners} className="flex-1 rounded-lg h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <UserCheck className="mr-2 h-4 w-4" /> Generate Signers
                  </Button>
                </div>

                {Object.keys(generatedResults).length > 0 && (
                  <div className="mt-16 space-y-8">
                    <ScrollReveal direction="up">
                      <div className="flex items-center gap-3 border-b border-primary/20 pb-4">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-display text-2xl font-bold tracking-tight">Generated Results</h3>
                      </div>
                    </ScrollReveal>
                    <div className="grid grid-cols-1 gap-8">
                      {Object.entries(generatedResults).map(([key, signers], index) => (
                        <ScrollReveal key={key} delay={index * 0.1} direction="up">
                          <div className="space-y-4 relative group/result">
                            <div className="flex items-center justify-between gap-4">
                              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold tracking-tight shadow-md">
                                {key}
                              </div>
                              {signers.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyAllGenerated(key, signers)}
                                  className={cn(
                                    "h-8 text-xs font-semibold gap-2 opacity-0 group-hover/result:opacity-100 transition-all border-primary/20 hover:border-primary/35 hover:bg-accent/10",
                                    copiedState?.id === key && copiedState?.type === 'all' && "opacity-100 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                                  )}
                                >
                                  {copiedState?.id === key && copiedState?.type === 'all' ? (
                                    <><CheckCircle2 className="h-3.5 w-3.5" /> Tersalin</>
                                  ) : (
                                    <><Copy className="h-3.5 w-3.5" /> Copy All</>
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="overflow-hidden border border-primary/10 rounded-lg bg-background/40 backdrop-blur-sm shadow-sm transition-all hover:border-primary/30 hover:bg-accent/[0.03]">
                              <Table>
                                <TableHeader className="bg-muted/30">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold py-4 pl-6 w-30">{t.groupHeader}</TableHead>
                                    <TableHead className="font-bold">{t.nameHeader}</TableHead>
                                    <TableHead className="font-bold">{t.positionHeader}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {signers.length > 0 ? signers.map((p, i) => (
                                    <TableRow key={`${p.nik}-${i}`} className="hover:bg-accent/10 transition-colors">
                                      <TableCell className="pl-6">
                                        <Badge variant="outline" className="rounded-md uppercase text-[10px] tracking-wider font-bold bg-background/50">{p.grupJabatan}</Badge>
                                      </TableCell>
                                      <TableCell className="font-semibold text-primary">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => handleCopy(p.nama, `${key}-${i}`, 'gen-nama', 'Nama')}
                                              className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                            >
                                              <span className="truncate">{p.nama}</span>
                                              {copiedState?.id === `${key}-${i}` && copiedState?.type === 'gen-nama' ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                              ) : (
                                                <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                              )}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200 shadow-sm border-primary/10">Klik untuk menyalin</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-sm">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => handleCopy(p.jabatan, `${key}-${i}`, 'gen-jabatan', 'Jabatan')}
                                              className="text-left w-full hover:text-foreground transition-colors flex items-center gap-2 group/copy focus:outline-none"
                                            >
                                              <span className="line-clamp-2 leading-relaxed">{p.jabatan}</span>
                                              {copiedState?.id === `${key}-${i}` && copiedState?.type === 'gen-jabatan' ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                              ) : (
                                                <Copy className="h-3.5 w-3.5 opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0" />
                                              )}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" sideOffset={8} className="text-xs animate-in fade-in duration-200 shadow-sm border-primary/10">Klik untuk menyalin</TooltipContent>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  )) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic bg-muted/5">No signers found for this date.</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </ToolWrapper>
    </TooltipProvider>
  )
}
