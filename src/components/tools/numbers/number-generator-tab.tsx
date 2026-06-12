
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarIcon, Loader2, Database, CheckCircle, PlusCircle, Trash2, Copy, Check,
    RotateCcw, AlertTriangle, Plus, Minus, Zap, Hash, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { format, addMonths, addWeeks, addYears } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { DAILY_LIMIT, getMonthStart, type ValueCategory, type StockMatrix, type StockCategoryDetail } from './types';
import type { useToolNumbers } from './use-tool-numbers';

type NumbersHook = ReturnType<typeof useToolNumbers>;

interface NumberGeneratorTabProps {
    hook: NumbersHook;
}

function StockTable({
    periods,
    stockMatrix,
    stockRawMatrix,
    stockCategories,
    stockCategoryDetailMap,
}: {
    periods: string[];
    stockMatrix: StockMatrix;
    stockRawMatrix: StockMatrix;
    stockCategories: string[];
    stockCategoryDetailMap: Record<string, StockCategoryDetail>;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b-2 border-primary/10">
                        <th className="sticky left-0 bg-background px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-primary border-r border-primary/5 w-44">
                            Kategori
                        </th>
                        {periods.map(p => (
                            <th key={p} className="px-2 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap min-w-16">
                                {p}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {stockCategories.map((category) => {
                        const detail = stockCategoryDetailMap[category];
                        const hasFallback = (detail?.sourceCategories.length ?? 1) > 1;

                        return (
                            <tr key={category} className="group hover:bg-primary/3 transition-colors">
                                <th className="sticky left-0 bg-background group-hover:bg-primary/3 px-3 py-2 text-left border-r border-primary/5 transition-colors w-44">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-black tracking-tight text-primary leading-none">{detail?.name ?? category}</span>
                                            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-black uppercase tracking-widest border-primary/15 bg-background/80 text-primary/60 leading-4">
                                                {category}
                                            </Badge>
                                            {hasFallback && (
                                                <Badge className="rounded-full px-1.5 py-0 text-[9px] font-black uppercase tracking-widest bg-accent/10 text-accent border-0 leading-4">
                                                    Fallback
                                                </Badge>
                                            )}
                                        </div>
                                        {hasFallback && (
                                            <p className="text-[9px] text-muted-foreground/60 font-medium leading-tight">
                                                {detail?.sourceCategories.join(' + ')}
                                            </p>
                                        )}
                                    </div>
                                </th>
                                {periods.map(period => {
                                    const effectiveStock = stockMatrix[category]?.[period] ?? 0;
                                    const rawStock = stockRawMatrix[category]?.[period] ?? 0;
                                    const compatibleStock = Math.max(0, effectiveStock - rawStock);

                                    return (
                                        <td key={`${category}-${period}`} className={cn(
                                            "px-2 py-2 text-center font-mono transition-colors",
                                            effectiveStock === 0
                                                ? "text-muted-foreground/25"
                                                : effectiveStock <= 5
                                                    ? "text-destructive font-black bg-destructive/5"
                                                    : "text-accent font-bold"
                                        )}>
                                            {effectiveStock === 0 ? (
                                                <span className="text-muted-foreground/20 text-xs">—</span>
                                            ) : (
                                                <div className="leading-none">
                                                    <div className="text-sm font-black">{effectiveStock}</div>
                                                    {hasFallback && compatibleStock > 0 && (
                                                        <div className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">
                                                            {rawStock}+{compatibleStock}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function NumberGeneratorTab({ hook }: NumberGeneratorTabProps) {
    const {
        requests, valueCategory, setValueCategory, isGenerating, generatedNumbers,
        isCopied, copiedIndex, isStockDialogOpen, setIsStockDialogOpen,
        stockMatrix, stockRawMatrix, stockPeriodsByYear, stockYears,
        stockCategories, isStockLoading, stockErrorMessage, openDatePickerId, setOpenDatePickerId,
        calendarViewMonths,
        userLimit, isLimitLoading, isAdminUser,
        remainingLimit, hasResults, successCount, failedCount, totalQuantity,
        mergedCategories, categoryOptions, stockCategoryDetailMap,
        fetchStockSummary,
        handleCategoryChange, handleDocTypeChange, handleRequestChange, handleRequestDateChange,
        handleCalendarMonthChange,
        addRequest, removeRequest,
        handleGenerate, handleReset,
        copyFullResults, copyNumbersOnly, copyItem,
    } = hook;

    const isStockLoaded = stockYears.length > 0;
    const clampQuantity = (value: number) => Math.min(20, Math.max(1, Math.trunc(value)));
    const getRequestStock = (category: string, docDate: Date | undefined) => {
        if (!category || !docDate || !isStockLoaded) return null;
        const period = format(docDate, 'yyyy-MM');
        return stockMatrix[category]?.[period] ?? 0;
    };

    return (
        <div className="space-y-10">
            <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                    <div className="space-y-1">
                        <CardTitle className="font-display text-xl uppercase tracking-tight">Isi kebutuhan nomor</CardTitle>
                        <CardDescription>Pilih dokumen, tentukan tanggal, lalu buat nomor yang Anda perlukan. Semua orang yang memiliki link dapat langsung memakai tool ini.</CardDescription>
                    </div>

                    {!isAdminUser && (
                        <div className="shrink-0">
                            {isLimitLoading ? (
                                <Skeleton className="h-16 w-40 rounded-xl" />
                            ) : (
                                <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-primary/5 shadow-inner min-w-45">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                            <Database className="h-3" /> Kuota Publik Hari Ini
                                        </span>
                                        <span className="text-[10px] font-bold text-primary">
                                            {remainingLimit} / {DAILY_LIMIT} tersisa
                                        </span>
                                    </div>
                                    <Progress
                                        value={(remainingLimit / DAILY_LIMIT) * 100}
                                        className="h-1.5"
                                        indicatorClassName={cn(
                                            remainingLimit <= 3 ? "bg-destructive" : "bg-accent"
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-muted/15 px-4 py-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full bg-background/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">
                                Tanpa login
                            </Badge>
                            <span className="font-medium">Isi baris permintaan, cek stok bila perlu, lalu generate.</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-primary/70">
                            {totalQuantity} nomor diminta
                        </span>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kelompok Nilai Proyek</Label>
                        <RadioGroup defaultValue="below_500m" value={valueCategory} className="flex flex-wrap items-center gap-6" onValueChange={(value) => setValueCategory(value as ValueCategory)}>
                            <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                                <RadioGroupItem value="below_500m" id="below" className="focus-visible:ring-accent" />
                                <Label htmlFor="below" className="cursor-pointer font-bold text-sm">Di bawah 500 Juta</Label>
                            </div>
                            <div className="flex items-center space-x-2 opacity-40">
                                <RadioGroupItem value="above_500m" id="above" disabled />
                                <Label htmlFor="above" className="text-sm">500 Juta atau lebih</Label>
                            </div>
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground">Saat ini generator publik tersedia untuk dokumen proyek di bawah 500 juta.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Langkah 1</p>
                            <p className="text-sm text-muted-foreground">Pilih kategori terlebih dahulu agar daftar jenis dokumen lebih ringkas, lalu lengkapi tanggal dan jumlahnya.</p>
                        </div>
                        <AnimatePresence>
                            {requests.map((req, index) => {
                                const calendarMonth = calendarViewMonths[req.id] ?? getMonthStart(req.docDate ?? new Date());
                                const stockCount = getRequestStock(req.category, req.docDate);
                                const isDocTypeDisabled = !req.category;

                                return (
                                    <motion.div
                                        key={req.id}
                                        className="grid grid-cols-1 gap-3 rounded-xl border border-primary/10 bg-background/70 p-3 shadow-sm transition-colors hover:border-primary/25 md:grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1.25fr)_minmax(0,1.1fr)_10rem_2.5rem] md:items-start"
                                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.15 } }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    >
                                    <div className="hidden h-10 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-black text-primary md:mt-5 md:flex">
                                        {index + 1}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Kategori Dokumen</Label>
                                        <Select onValueChange={(value) => handleCategoryChange(req.id, value)} value={req.category}>
                                            <SelectTrigger className="h-10 rounded-lg border-primary/10 focus:ring-accent focus:ring-offset-0"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                                            <SelectContent className="border-primary/10">
                                                {categoryOptions.map(category => (
                                                    <SelectItem
                                                        key={category.value}
                                                        value={category.value}
                                                        className="cursor-pointer focus:bg-accent/10 focus:text-accent data-[state=checked]:text-accent data-[state=checked]:font-bold"
                                                    >
                                                        {category.label} · {category.totalTypes} jenis
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jenis Dokumen</Label>
                                        <Select onValueChange={(value) => handleDocTypeChange(req.id, value)} value={req.docType}>
                                            <SelectTrigger
                                                aria-disabled={isDocTypeDisabled}
                                                tabIndex={isDocTypeDisabled ? -1 : undefined}
                                                className={cn(
                                                    "h-10 rounded-lg border-primary/10 focus:ring-accent focus:ring-offset-0",
                                                    isDocTypeDisabled && "pointer-events-none opacity-50"
                                                )}
                                            >
                                                <SelectValue placeholder={req.category ? "Pilih jenis dokumen" : "Pilih kategori dulu"} />
                                            </SelectTrigger>
                                            <SelectContent className="border-primary/10">
                                                {(mergedCategories[req.category]?.types ?? []).map(type => (
                                                    <SelectItem
                                                        key={`${req.category}-${type}`}
                                                        value={type}
                                                        className="cursor-pointer focus:bg-accent/10 focus:text-accent data-[state=checked]:text-accent data-[state=checked]:font-bold"
                                                    >
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tanggal Dokumen</Label>
                                        <Popover
                                            open={openDatePickerId === req.id}
                                            onOpenChange={(isOpen) => {
                                                if (isOpen) {
                                                    handleCalendarMonthChange(req.id, calendarMonth);
                                                }
                                                setOpenDatePickerId(isOpen ? req.id : null);
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button variant={'outline'} className={cn('w-full h-10 justify-start text-left font-normal rounded-lg border-primary/10 hover:border-primary/30 focus-visible:ring-accent', !req.docDate && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                                                    {req.docDate ? format(req.docDate, 'd MMM yyyy', { locale: id }) : <span>Pilih tanggal dokumen</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-primary/15 shadow-2xl rounded-xl overflow-hidden backdrop-blur-sm">
                                                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-primary/5">
                                                    <button
                                                        onClick={() => handleCalendarMonthChange(req.id, addMonths(calendarMonth, -1))}
                                                        className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {format(calendarMonth, 'MMMM yyyy', { locale: id })}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCalendarMonthChange(req.id, addMonths(calendarMonth, 1))}
                                                        className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <Calendar
                                                    mode="single"
                                                    selected={req.docDate}
                                                    month={calendarMonth}
                                                    onMonthChange={(month) => handleCalendarMonthChange(req.id, month)}
                                                    onSelect={(d) => {
                                                        if (!d) return;
                                                        handleRequestDateChange(req.id, d);
                                                        setOpenDatePickerId(null);
                                                    }}
                                                    className="p-2"
                                                    classNames={{
                                                        month_caption: 'hidden',
                                                        weekday: 'text-muted-foreground rounded-md w-9 font-medium text-[11px] text-center',
                                                        day: 'h-9 w-9 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                                                        day_button: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                                                    }}
                                                    components={{
                                                        Nav: () => <></>,
                                                    }}
                                                    fixedWeeks
                                                />
                                                <div className="border-t border-primary/5 px-2 pt-2 pb-2 grid grid-cols-4 gap-1">
                                                    <button
                                                        onClick={() => {
                                                            handleRequestDateChange(req.id, new Date());
                                                            setOpenDatePickerId(null);
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-md py-1.5 transition-colors text-center"
                                                    >
                                                        Hari Ini
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleRequestDateChange(req.id, addWeeks(new Date(), 1));
                                                            setOpenDatePickerId(null);
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-md py-1.5 transition-colors text-center"
                                                    >
                                                        +1 Mgg
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleRequestDateChange(req.id, addMonths(new Date(), 1));
                                                            setOpenDatePickerId(null);
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-md py-1.5 transition-colors text-center"
                                                    >
                                                        +1 Bln
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleRequestDateChange(req.id, addYears(new Date(), 1));
                                                            setOpenDatePickerId(null);
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-md py-1.5 transition-colors text-center"
                                                    >
                                                        +1 Thn
                                                    </button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {stockCount !== null && (
                                            <p className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                stockCount === 0
                                                    ? "text-destructive/70"
                                                    : stockCount <= 5
                                                        ? "text-amber-600"
                                                        : "text-accent"
                                            )}>
                                                Stok periode ini: {stockCount}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah</Label>
                                        <div className="grid grid-cols-[2.5rem_minmax(3rem,1fr)_2.5rem] items-center gap-1">
                                            <Button
                                                variant="outline" size="icon" className="h-10 w-10 rounded-lg border-primary/10 focus-visible:ring-accent"
                                                onClick={() => handleRequestChange(req.id, 'quantity', clampQuantity(req.quantity - 1))}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Input
                                                type="number" min="1" max="20" value={req.quantity}
                                                onChange={(e) => handleRequestChange(req.id, 'quantity', clampQuantity(Number(e.target.value) || 1))}
                                                className="h-10 min-w-0 text-center rounded-lg border-primary/10 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-accent"
                                            />
                                            <Button
                                                variant="outline" size="icon" className="h-10 w-10 rounded-lg border-primary/10 focus-visible:ring-accent"
                                                onClick={() => handleRequestChange(req.id, 'quantity', clampQuantity(req.quantity + 1))}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex h-10 items-center md:mt-5">
                                        {requests.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => removeRequest(req.id)} className="h-9 w-9 rounded-lg text-destructive/40 transition-all hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-stretch gap-3 border-t border-dashed pt-6 md:flex-row md:items-center">
                        <Button
                            variant="ghost"
                            onClick={addRequest}
                            className="w-full md:w-auto h-11 px-6 rounded-full text-primary hover:bg-primary/5 transition-all duration-200 active:scale-95"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Permintaan
                        </Button>

                        <Dialog open={isStockDialogOpen} onOpenChange={(isOpen) => {
                            if (isOpen) { fetchStockSummary(); }
                            setIsStockDialogOpen(isOpen);
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full md:w-auto h-11 px-6 rounded-full transition-all duration-200 active:scale-95">
                                    <Database className="mr-2 h-4 w-4 text-accent" />
                                    Lihat Stok Tersedia
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl p-0 overflow-hidden border-primary/10 rounded-2xl shadow-2xl shadow-primary/10">
                                <DialogHeader className="p-6 bg-linear-to-br from-primary/5 to-accent/5 border-b border-primary/10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/10">
                                            <Database className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="font-display text-2xl font-black uppercase tracking-tighter">
                                                Matriks Stok Nomor
                                            </DialogTitle>
                                            <DialogDescription className="text-xs mt-0.5">
                                                Ringkasan stok efektif dan stok asli per kategori{stockYears.length > 0 ? ` · Periode ${stockYears[0]}–${stockYears[stockYears.length - 1]}` : ''}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                {isStockLoading ? (
                                    <div className="p-16 flex flex-col items-center gap-5 bg-background">
                                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                        <Skeleton className="h-52 w-full rounded-xl" />
                                    </div>
                                ) : stockErrorMessage ? (
                                    <div className="bg-background p-12 text-center">
                                        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive/70" />
                                        <p className="text-sm font-black uppercase tracking-widest text-destructive">Stok belum bisa dimuat</p>
                                        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                                            {stockErrorMessage}
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={fetchStockSummary}
                                            className="mt-5 h-10 rounded-full border-destructive/20 px-5 text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/5"
                                        >
                                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                            Coba Lagi
                                        </Button>
                                    </div>
                                ) : stockYears.length === 0 ? (
                                    <div className="bg-background p-12 text-center">
                                        <Database className="mx-auto mb-4 h-10 w-10 text-muted-foreground/25" />
                                        <p className="text-sm font-black uppercase tracking-widest text-primary">Stok belum tersedia</p>
                                        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                                            Belum ada nomor bebas untuk kelompok nilai proyek ini.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-background">
                                            <Tabs defaultValue={stockYears[0] ?? ''} className="w-full">
                                                <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-b">
                                                    <TabsList className="h-9 p-1 bg-background/80 rounded-xl border border-primary/10 gap-1">
                                                        {stockYears.map((year) => (
                                                            <TabsTrigger key={year} value={year} className="rounded-lg px-5 text-xs font-black uppercase tracking-widest">{year}</TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                    <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-accent/20 bg-background/80 text-accent">
                                                        {valueCategory === 'below_500m' ? 'Stok proyek di bawah 500 juta' : 'Stok proyek 500 juta atau lebih'}
                                                    </Badge>
                                                </div>
                                                {stockYears.map((year) => (
                                                    <TabsContent key={year} value={year} className="mt-0">
                                                        <StockTable
                                                            periods={stockPeriodsByYear[year] ?? []}
                                                            stockMatrix={stockMatrix}
                                                            stockRawMatrix={stockRawMatrix}
                                                            stockCategories={stockCategories}
                                                            stockCategoryDetailMap={stockCategoryDetailMap}
                                                        />
                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        </div>
                                        <div className="flex items-center justify-between px-6 py-3 bg-muted/10 border-t border-primary/5">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Data diambil langsung dari database · Realtime</p>
                                            <button onClick={fetchStockSummary} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"><RotateCcw className="h-3 w-3" /> Refresh</button>
                                        </div>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>

                        <div className="min-w-0 md:ml-auto md:flex-1">
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || userLimit.isLimited}
                                className={cn(
                                    "w-full h-12 rounded-full shadow-lg shadow-accent/20 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest transition-all duration-200 active:scale-95",
                                    isGenerating && "ring-2 ring-accent ring-offset-2 animate-pulse"
                                )}
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                {isGenerating ? 'Sedang Membuat...' : `Buat ${totalQuantity} Nomor`}
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Hasil akan muncul di bawah setelah proses selesai, lalu bisa langsung Anda salin.</p>

                    {!isAdminUser && userLimit.isLimited && (
                        <div className="mt-4 flex items-center gap-4 rounded-xl border border-destructive/20 bg-linear-to-r from-destructive/10 to-destructive/5 p-5 border-l-4 border-l-destructive animate-in slide-in-from-top-2">
                            <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-black text-destructive uppercase tracking-tight">Kuota Publik Hari Ini Sudah Habis</p>
                                <p className="text-xs text-destructive/70 font-medium">Silakan coba lagi besok. Kuota akan direset otomatis pukul 00.00.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AnimatePresence mode="wait">
                {hasResults && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    >
                        <Card className="border-accent/20 bg-accent/5 shadow-xl ring-1 ring-accent/5 overflow-hidden transition-shadow duration-300 hover:shadow-2xl">
                            <CardHeader className="bg-linear-to-r from-accent/15 to-accent/5 border-b border-accent/10 p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent rounded-xl shadow-lg shadow-accent/30"><CheckCircle className="h-5 w-5 text-white" /></div>
                                            <CardTitle className="font-display text-2xl font-black uppercase tracking-tighter">Hasil Generate</CardTitle>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent border-accent/20">
                                                {successCount} berhasil
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-primary/10">
                                                {failedCount} perlu perhatian
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="sm" onClick={copyFullResults} className="rounded-full bg-background/50 h-9 text-[10px] font-black border-accent/20 hover:border-accent transition-all active:scale-95">
                                            {isCopied === 'full' ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
                                            SALIN DENGAN DETAIL
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={copyNumbersOnly} className="rounded-full bg-background/50 h-9 text-[10px] font-black border-accent/20 hover:border-accent transition-all active:scale-95">
                                            {isCopied === 'numbers' ? <Check className="mr-2 h-3.5 w-3.5 text-emerald-500" /> : <Hash className="mr-2 h-3.5 w-3.5" />}
                                            SALIN NOMOR SAJA
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={handleReset} className="rounded-full h-9 text-[10px] font-black transition-all active:scale-95">
                                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                            BUAT LAGI
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-accent/10 bg-background/70 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent">Ringkasan</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Gunakan tombol salin untuk menyalin semua hasil sekaligus atau salin satu per satu jika diperlukan.</p>
                                    </div>
                                    <div className="rounded-2xl border border-primary/10 bg-background/70 px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Catatan</p>
                                        <p className="mt-1 text-sm text-muted-foreground">Baris yang bertanda gagal berarti nomor belum tersedia atau kuota publik sudah habis.</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <ol className="space-y-3">
                                        {generatedNumbers.map((result, index) => (
                                            <li key={index} className={cn(
                                                "flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-sm group border-l-4 transition-all",
                                                result.isError
                                                    ? "border-destructive/40 border-l-destructive bg-destructive/5"
                                                    : "border-accent/10 border-l-accent/40 hover:border-accent hover:bg-accent/5"
                                            )}>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-[0.15em]",
                                                            result.isError ? "text-destructive" : "text-accent"
                                                        )}>{result.docType}</span>
                                                        <Badge variant="outline" className={cn(
                                                            "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                                                            result.isError ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-accent/20 bg-accent/5 text-accent"
                                                        )}>{result.isError ? 'Perlu perhatian' : 'Siap disalin'}</Badge>
                                                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase flex items-center gap-1">
                                                            {format(result.date, 'd MMMM yyyy', { locale: id })}
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(format(result.date, 'd MMMM yyyy', { locale: id }));
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 hover:text-accent transition-all p-0.5"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "font-mono text-lg font-black tracking-tight",
                                                        result.isError ? "text-destructive/60 italic" : "text-primary"
                                                    )}>{result.isError ? result.text : result.rawNumber}</span>
                                                </div>
                                                {!result.isError && (
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/10 text-accent shrink-0 transition-all" onClick={() => copyItem(result.rawNumber, index)}>
                                                        {copiedIndex === index ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
