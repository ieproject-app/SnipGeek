'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import type { Dictionary } from '@/lib/get-dictionary';
import { cn } from '@/lib/utils';
import { Search, FileText, Database, Loader2, Copy, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { docRules, formatDate } from '@/components/tools/employee-history/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEmployeeHistory } from '@/components/tools/employee-history/use-employee-history';

interface EmployeeHistoryTabsProps {
  dictionary: Dictionary;
  locale: string;
}

export function EmployeeHistoryTabs({ dictionary, locale }: EmployeeHistoryTabsProps) {
  const { employeeHistory: t } = dictionary;
  const toolMeta = dictionary.tools.tool_list.employee_history;

  const hook = useEmployeeHistory('', locale);
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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-tighter">
              Employee History
            </h1>
            <p className="text-sm text-muted-foreground">
              Search employee · Document Signer Generator · Admin Data Injection
            </p>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="h-11 p-1 bg-muted/50 rounded-xl border border-primary/10 gap-1">
              <TabsTrigger
                value="search"
                className="rounded-lg px-5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Employee
              </TabsTrigger>
              <TabsTrigger
                value="generator"
                className="rounded-lg px-5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Signer Generator
              </TabsTrigger>
              <TabsTrigger
                value="injection"
                className="rounded-lg px-5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Admin Data Injection
              </TabsTrigger>
            </TabsList>
            {isAdminLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {toolMeta.checkingAccess}
              </div>
            ) : !isAdminUser ? (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-destructive/20 bg-destructive/5 text-destructive">
                View Only
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-accent/20 bg-accent/10 text-accent">
                Admin Access
              </Badge>
            )}
          </div>

          {/* Tab 1: Search Employee */}
          <TabsContent value="search" className="mt-6">
            <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b">
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
                      <p className="italic text-sm">{toolMeta.emptyResults}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Document Signer Generator */}
          <TabsContent value="generator" className="mt-6">
            <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b">
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
                              onSelect={(date) => {
                                if (!date) return;
                                const dateStr = format(date, 'yyyy-MM-dd');
                                handleQueryChange(query.id, 'docDate', dateStr);
                                setOpenDatePickerId(null);
                              }}
                              className="p-2"
                              classNames={{
                                month_caption: 'hidden',
                                weekday: 'text-muted-foreground rounded-md w-9 font-medium text-[11px] text-center',
                                day: 'h-9 w-9 text-center text-xs p-0 relative',
                                day_button: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                              }}
                              fixedWeeks={false}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="w-full md:w-32 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.projectValuePlaceholder}</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={query.projectValue || ''}
                          onChange={(e) => handleQueryChange(query.id, 'projectValue', Number(e.target.value))}
                          className="h-11 rounded-lg bg-background/50 focus:ring-primary/20 font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center h-11">
                        {docQueries.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeQueryRow(query.id)} className="rounded-full hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-all">
                            <span className="sr-only">Remove</span>
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button
                    variant="ghost"
                    onClick={addQueryRow}
                    className="h-11 px-6 rounded-full text-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    + Tambah Permintaan
                  </Button>
                  <Button
                    onClick={handleGenerateSigners}
                    disabled={docQueries.every(q => !q.docType || !q.docDate)}
                    className="h-11 px-6 rounded-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Signers
                  </Button>
                </div>

                {Object.keys(generatedResults).length > 0 && (
                  <div className="mt-8 space-y-6">
                    {Object.entries(generatedResults).map(([key, signers]) => (
                      <div key={key} className="rounded-xl border bg-background/50 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b">
                          <h3 className="font-bold text-sm">{key}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyAllGenerated(key, signers)}
                            className="h-8 text-xs"
                          >
                            {copiedState?.id === key && copiedState?.type === 'all' ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Copy All
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="p-5 space-y-3">
                          {signers.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No signers found for this criteria.</p>
                          ) : (
                            signers.map((signer, idx) => (
                              <div key={`${signer.nik}-${idx}`} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm truncate">{signer.nama}</p>
                                  <p className="text-xs text-muted-foreground truncate">{signer.jabatan}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(`${signer.nama}\n${signer.jabatan}`, `${signer.nik}-${idx}`, 'signer', 'Penandatangan')}
                                  className="shrink-0 h-8 w-8"
                                >
                                  {copiedState?.id === `${signer.nik}-${idx}` && copiedState?.type === 'signer' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Admin Data Injection */}
          <TabsContent value="injection" className="mt-6">
            {isAdminLoading ? (
              <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
                <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{toolMeta.checkingAccess}</p>
                </CardContent>
              </Card>
            ) : !isAdminUser ? (
              <Card className="border-destructive/10 bg-card/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-destructive/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <Database className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl text-destructive">Access Denied</CardTitle>
                      <CardDescription>Only admins can access the data injection feature.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Please contact your administrator if you need access to this feature.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl">{toolMeta.adminTitle}</CardTitle>
                      <CardDescription>{toolMeta.adminDesc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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
                        {toolMeta.injecting}
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        {toolMeta.injectToFirestore}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
