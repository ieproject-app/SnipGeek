
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Database, PlusCircle, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ValueCategory } from './types';
import type { useToolNumbers } from './use-tool-numbers';

type NumbersHook = ReturnType<typeof useToolNumbers>;

interface NumberInjectorTabProps {
    hook: NumbersHook;
}

export function NumberInjectorTab({ hook }: NumberInjectorTabProps) {
    const {
        injectText, setInjectText, injectValueCategory, setInjectValueCategory,
        isInjecting, injectProgress,
        dynamicCategories, newCatCode, setNewCatCode, newCatName, setNewCatName,
        newCatTypes, setNewCatTypes, isSavingCat,
        fetchDynamicCategories, handleSaveDynamicCategory, handleDeleteDynamicCategory,
        handleBulkInject,
    } = hook;

    return (
        <Card className="border-destructive/20 bg-card/50 shadow-sm overflow-hidden ring-1 ring-destructive/10">
            <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-xl">
                        <Database className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-xl text-destructive uppercase tracking-tight">Admin Injector</CardTitle>
                        <CardDescription>Mode admin untuk menyuntikkan stok nomor secara massal langsung ke database.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kategori Nilai Proyek</Label>
                    <RadioGroup defaultValue="below_500m" value={injectValueCategory} className="flex flex-wrap items-center gap-6" onValueChange={(value) => setInjectValueCategory(value as ValueCategory)}>
                        <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-destructive/20 transition-all">
                            <RadioGroupItem value="below_500m" id="inj_below" className="focus-visible:ring-destructive" />
                            <Label htmlFor="inj_below" className="cursor-pointer font-bold text-sm">Di bawah 500 Juta</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border focus-within:ring-2 focus-within:ring-destructive/20 transition-all opacity-40">
                            <RadioGroupItem value="above_500m" id="inj_above" className="focus-visible:ring-destructive" disabled />
                            <Label htmlFor="inj_above" className="cursor-pointer font-bold text-sm">500 Juta atau lebih</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Format: 06153/UM.000/TA-851040/03-2025 (Setiap nomor di baris baru)</Label>
                    <textarea
                        className="flex min-h-75 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm font-mono shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="06153/UM.000/TA-851040/03-2025&#10;06154/UM.000/TA-851040/03-2025&#10;..."
                        value={injectText}
                        onChange={(e) => setInjectText(e.target.value)}
                        disabled={isInjecting}
                    />
                </div>

                <div className="flex items-center justify-between pt-4">
                    <span className="text-xs font-bold text-muted-foreground">
                        {isInjecting ? injectProgress : `${injectText.split('\n').filter(l => l.trim().length > 0).length} baris terdeteksi`}
                    </span>
                    <Button
                        onClick={handleBulkInject}
                        disabled={isInjecting || injectText.trim() === ''}
                        className={cn(
                            "h-11 px-8 rounded-full shadow-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black uppercase tracking-widest transition-all duration-200 active:scale-95",
                            isInjecting && "opacity-80 cursor-not-allowed"
                        )}
                    >
                        {isInjecting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Memproses</>
                        ) : (
                            <><Database className="mr-2 h-4 w-4" /> Mulai Injeksi</>
                        )}
                    </Button>
                </div>

                <div className="pt-6 border-t border-destructive/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manajemen Tipe Dokumen (Dinamis)</Label>
                        <Button variant="ghost" size="sm" onClick={fetchDynamicCategories} className="rounded-full text-[10px] h-7 gap-1.5 text-muted-foreground">
                            <RotateCcw className="h-3 w-3" /> Refresh
                        </Button>
                    </div>

                    {dynamicCategories.length > 0 && (
                        <div className="space-y-2">
                            {dynamicCategories.map(dc => (
                                <div key={dc.id} className="flex items-center justify-between px-4 py-2.5 bg-background/50 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-black text-primary">{dc.category}</span>
                                        <span className="text-[10px] text-muted-foreground">{dc.name}</span>
                                        <span className="text-[9px] text-muted-foreground/60 font-mono">[{dc.types.join(', ')}]</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDynamicCategory(dc.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive/40 hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end p-4 bg-background/30 rounded-xl border border-dashed border-primary/10">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Kode Kategori</Label>
                            <Input
                                placeholder="LG.999"
                                value={newCatCode}
                                onChange={e => setNewCatCode(e.target.value)}
                                className="h-9 rounded-lg border-primary/10 font-mono text-xs focus-visible:ring-destructive/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Nama Kategori</Label>
                            <Input
                                placeholder="Nama"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                className="h-9 rounded-lg border-primary/10 text-xs focus-visible:ring-destructive/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Tipe Dokumen (pisah koma)</Label>
                            <Input
                                placeholder="TIPE A, TIPE B"
                                value={newCatTypes}
                                onChange={e => setNewCatTypes(e.target.value)}
                                className="h-9 rounded-lg border-primary/10 text-xs focus-visible:ring-destructive/50"
                            />
                        </div>
                        <Button
                            onClick={handleSaveDynamicCategory}
                            disabled={isSavingCat}
                            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest"
                        >
                            {isSavingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest">Kategori baru akan tersedia di dropdown generator tanpa perlu deploy ulang.</p>
                </div>
            </CardContent>
        </Card>
    );
}
