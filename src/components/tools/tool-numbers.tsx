
'use client';

import { Check, Zap, History, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolWrapper } from '@/components/tools/tool-wrapper';
import { Dictionary } from '@/lib/get-dictionary';
import { useToolNumbers } from './numbers/use-tool-numbers';
import { NumberGeneratorTab } from './numbers/number-generator-tab';
import { NumberHistoryTab } from './numbers/number-history-tab';
import { NumberInjectorTab } from './numbers/number-injector-tab';

export function ToolNumbers({ dictionary }: { dictionary: Dictionary }) {
    const hook = useToolNumbers();
    const { hasResults, isAdminUser } = hook;
    const toolMeta = dictionary.tools.tool_list.number_generator;

    return (
        <ToolWrapper
            title={toolMeta.title}
            description={toolMeta.description}
            dictionary={dictionary}
            isPublic={true}
        >
            <div className="space-y-10">
                {/* Stepper Visual */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative flex justify-between">
                        <div className="absolute top-4 left-0 right-0 h-0.5 border-t-2 border-dashed border-primary/20 -z-10" />
                        {[
                            { step: 1, label: "Pilih Dokumen", active: !hasResults, done: hasResults },
                            { step: 2, label: "Buat Nomor", active: !hasResults, done: hasResults },
                            { step: 3, label: "Salin Hasil", active: hasResults, done: false }
                        ].map((s) => (
                            <div key={s.step} className="flex flex-col items-center gap-3 bg-background px-4">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500",
                                    s.done ? "bg-accent text-white scale-105" : s.active ? "bg-primary text-primary-foreground shadow-lg scale-110" : "bg-muted text-muted-foreground"
                                )}>
                                    {s.done ? <Check className="h-3.5 w-3.5" /> : s.step}
                                </div>
                                <span className={cn(
                                    "text-[10px] uppercase tracking-widest font-black text-center max-w-20 transition-colors duration-300",
                                    s.done ? "text-accent" : s.active ? "text-primary" : "text-muted-foreground/40"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <Tabs defaultValue="generator" className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="bg-muted/40 p-1 h-12 rounded-full border border-primary/5">
                            <TabsTrigger value="generator" className="rounded-full px-8 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <Zap className="h-3.5 w-3.5" />
                                Generator
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-full px-8 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <History className="h-3.5 w-3.5" />
                                Riwayat Saya
                            </TabsTrigger>
                            {isAdminUser && (
                                <TabsTrigger value="injector" className="rounded-full px-8 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                                    <Database className="h-3.5 w-3.5" />
                                    Admin Injector
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="generator" className="space-y-10 mt-0">
                        <NumberGeneratorTab hook={hook} />
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <NumberHistoryTab hook={hook} />
                    </TabsContent>

                    {isAdminUser && (
                        <TabsContent value="injector" className="mt-0">
                            <NumberInjectorTab hook={hook} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </ToolWrapper>
    );
}
