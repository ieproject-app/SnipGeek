
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { useToolNumbers } from './use-tool-numbers';

type NumbersHook = ReturnType<typeof useToolNumbers>;

interface NumberHistoryTabProps {
    hook: NumbersHook;
}

export function NumberHistoryTab({ hook }: NumberHistoryTabProps) {
    const {
        myHistory, isHistoryLoading, isLoggedIn, copiedIndex,
        fetchMyHistory, copyItem,
    } = hook;

    return (
        <Card className="border-primary/10 bg-card/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-display text-xl uppercase tracking-tight">Riwayat Pribadi Hari Ini</CardTitle>
                        <CardDescription>
                            {isLoggedIn
                                ? 'Daftar nomor yang sudah Anda ambil hari ini agar mudah dicek ulang atau disalin kembali.'
                                : 'Riwayat pribadi tersedia setelah login. Anda tetap bisa membuat nomor tanpa login seperti biasa.'}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={fetchMyHistory} disabled={isHistoryLoading || !isLoggedIn} className="rounded-full gap-2">
                        <RotateCcw className={cn("h-3.5 w-3.5", isHistoryLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {!isLoggedIn ? (
                    <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-muted/5 space-y-4">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/20" />
                        <div className="space-y-1.5">
                            <p className="text-sm font-black uppercase tracking-widest text-primary">Login opsional untuk riwayat</p>
                            <p className="text-sm text-muted-foreground max-w-xl mx-auto">Generator tetap dapat dipakai bebas oleh siapa pun yang memiliki link. Jika Anda login, riwayat pribadi akan tersimpan dan admin juga bisa membuka injector.</p>
                        </div>
                    </div>
                ) : isHistoryLoading ? (
                    <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" /></div>
                ) : myHistory.length > 0 ? (
                    <div className="space-y-3">
                        {myHistory.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-primary/5 group hover:border-accent/30 transition-all">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-primary/10">{item.docType}</Badge>
                                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{format(item.date, 'HH:mm', { locale: id })} WIB</span>
                                    </div>
                                    <span className="font-mono text-base font-black tracking-tight text-primary">{item.text}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-all" onClick={() => copyItem(item.text, index + 100)}>
                                    {copiedIndex === index + 100 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Belum ada aktivitas hari ini</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
