
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Download, FileText, Loader2, Search, BrainCircuit, FastForward, ScanSearch, Lightbulb, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Tesseract from 'tesseract.js';
import { searchStrategies, type SearchMode, type SearchResult } from '@/lib/search-strategies';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type SearchResults = Record<string, SearchResult[]>;

const translations = {
  id: {
    cardTitle: 'Indeks Penanda Tangan',
    cardDescription: 'Pilih PDF, pilih mode pencarian, berikan daftar nama, dan mulai pencarian.',
    uploadLabel: '1. Unggah Dokumen',
    uploadClick: 'Klik untuk mengunggah',
    uploadDrag: 'atau seret dan lepas',
    uploadHint: 'Hanya PDF',
    uploadAria: 'Unggah file PDF',
    namesLabel: '4. Nama yang Dicari',
    namesPlaceholder: 'cth. John Doe; Jane Smith; Peter Jones',
    namesHint: 'Gunakan koma (,) atau titik koma (;) untuk memisahkan nama.',
    historyTitle: 'Riwayat Pencarian',
    optionsLabel: '2. Mode Pencarian',
    ocrLabel: '3. Opsi Tambahan',
    useOcr: 'Jalankan Pindai (OCR) jika perlu',
    ocrHint: 'Untuk dokumen hasil pindaian (scan). Proses akan jauh lebih lambat.',
    searchButton: 'Cari Nama',
    searchingButton: 'Mencari...',
    progressLabel: (i: number, numPages: number) => `Memindai halaman ${i} dari ${numPages}...`,
    progressOcrLabel: (i: number, numPages: number) => `Memindai halaman ${i} dari ${numPages} dengan OCR...`,
    scanComplete: 'Pemindaian selesai!',
    startingScan: 'Memulai...',
    resultsTitle: 'Hasil Pencarian',
    resultsDescription: (found: number, total: number) => `Menemukan ${found} dari ${total} nama.`,
    download: 'Unduh',
    notFound: 'Tidak Ditemukan',
    noResults: 'Tidak ada hasil untuk ditampilkan.',
    foundOnPages: 'Ditemukan di halaman',
    page: 'Halaman',
    searchModes: {
      fast: {
        label: "Cepat (Cakupan Luas)",
        description: "Menemukan semua kemunculan nama. Paling fleksibel, namun bisa menghasilkan positif palsu."
      },
      accurate: {
        label: "Akurat (Konteks Tanda Tangan)",
        description: "Mencari nama di dekat kata kunci seperti 'Hormat saya', 'Direktur', dll. Paling disarankan."
      },
      structural: {
        label: "Struktural (Pola NIK/NIP)",
        description: "Hanya mencari nama yang memiliki NIK atau NIP di bawahnya. Sangat akurat untuk dokumen resmi."
      }
    },
    toast: {
      invalidFileTitle: 'Jenis File Tidak Valid',
      invalidFileDesc: 'Silakan unggah file PDF.',
      noFileTitle: 'Tidak Ada File yang Dipilih',
      noFileDesc: 'Silakan pilih file PDF untuk dicari.',
      noNamesTitle: 'Tidak Ada Nama yang Disediakan',
      noNamesDesc: 'Silakan masukkan nama untuk dicari.',
      processFailedTitle: 'Pemrosesan Gagal',
      processFailedDesc: (error: string) => `Tidak dapat memproses PDF: ${error}`,
    },
    updateAlert: {
      title: "Mode Pencarian Baru yang Lebih Cerdas!",
      description: "Coba mode Struktural yang telah disempurnakan untuk akurasi tertinggi, atau centang opsi Pindai (OCR) untuk dokumen hasil scan.",
      dismiss: "Mengerti",
    },
  },
  en: {
    cardTitle: 'Signatories Index',
    cardDescription: 'Select a PDF, choose a search mode, provide names, and start the search.',
    uploadLabel: '1. Upload Document',
    uploadClick: 'Click to upload',
    uploadDrag: 'or drag and drop',
    uploadHint: 'PDF only',
    uploadAria: 'Upload PDF file',
    namesLabel: '4. Names to Find',
    namesPlaceholder: 'e.g. John Doe; Jane Smith; Peter Jones',
    namesHint: 'Use commas (,) or semicolons (;) to separate names.',
    historyTitle: 'Search History',
    optionsLabel: '2. Search Mode',
    ocrLabel: '3. Additional Options',
    useOcr: 'Run Scan (OCR) if needed',
    ocrHint: 'For scanned documents. The process will be much slower.',
    searchButton: 'Find Names',
    searchingButton: 'Searching...',
    progressLabel: (i: number, numPages: number) => `Scanning page ${i} of ${numPages}...`,
    progressOcrLabel: (i: number, numPages: number) => `Scanning page ${i} of ${numPages} with OCR...`,
    scanComplete: 'Scan complete!',
    startingScan: 'Starting...',
    resultsTitle: 'Search Results',
    resultsDescription: (found: number, total: number) => `Found ${found} of ${total} names.`,
    download: 'Download',
    notFound: 'Not Found',
    noResults: 'No results to display.',
    foundOnPages: 'Found on pages',
    page: 'Page',
    searchModes: {
      fast: {
        label: "Fast (Broad Scope)",
        description: "Finds all occurrences of a name. Most flexible, but may have false positives."
      },
      accurate: {
        label: "Accurate (Signature Context)",
        description: "Looks for names near keywords like 'Sincerely', 'Director', etc. Most recommended."
      },
      structural: {
        label: "Structural (NIK/NIP Pattern)",
        description: "Only finds names that have a NIK or NIP number below them. Very accurate for official documents."
      }
    },
    toast: {
      invalidFileTitle: 'Invalid File Type',
      invalidFileDesc: 'Please upload a PDF file.',
      noFileTitle: 'No File Selected',
      noFileDesc: 'Please select a PDF file to search.',
      noNamesTitle: 'No Names Provided',
      noNamesDesc: 'Please enter the names to search for.',
      processFailedTitle: 'Processing Failed',
      processFailedDesc: (error: string) => `Could not process the PDF: ${error}`,
    },
    updateAlert: {
      title: "Smarter New Search Modes!",
      description: "Try the improved Structural mode for the highest accuracy on official documents, or check the new Scan (OCR) option for scanned files.",
      dismiss: "Got It",
    },
  },
};

const parseNames = (inputText: string): string[] => {
    return inputText.split(/[;,]/g).map(name => name.trim()).filter(Boolean);
};

const UPDATE_ALERT_KEY = 'pdfToolSignatoryUpdateAlertDismissed_v2';

export default function ToolSignatoriesIndex({ locale }: { locale: "id" | "en" }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [namesToFind, setNamesToFind] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('accurate');
  const [useOcr, setUseOcr] = useState(false);
  const { toast } = useToast();
  const t = translations[locale];

  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(UPDATE_ALERT_KEY) !== 'true') {
        setShowUpdateAlert(true);
      }
      const history = localStorage.getItem('pdfSignatorySearchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
      const savedMode = localStorage.getItem('pdfSignatorySearchMode');
      if (savedMode && ['fast', 'accurate', 'structural'].includes(savedMode)) {
        setSearchMode(savedMode as SearchMode);
      }
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
      localStorage.clear();
    }
  }, []);

  const dismissUpdateAlert = () => {
    try {
      localStorage.setItem(UPDATE_ALERT_KEY, 'true');
      setShowUpdateAlert(false);
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
  }
  
  const handleSearchModeChange = (value: SearchMode) => {
    setSearchMode(value);
    try {
      localStorage.setItem('pdfSignatorySearchMode', value);
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: t.toast.invalidFileTitle,
          description: t.toast.invalidFileDesc,
        });
        setFile(null);
        if (event.target) {
          event.target.value = '';
        }
      } else {
        setFile(selectedFile);
        setResults(null);
      }
    }
  };

  const handleSearch = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: t.toast.noFileTitle, description: t.toast.noFileDesc });
      return;
    }
    if (!namesToFind.trim()) {
      toast({ variant: 'destructive', title: t.toast.noNamesTitle, description: t.toast.noNamesDesc });
      return;
    }

    setLoading(true);
    setResults(null);
    setProgress(0);
    setProgressLabel(t.startingScan);

    const originalCaseNames = parseNames(namesToFind);

    const newHistory = [...new Set([namesToFind.trim(), ...searchHistory])].slice(0, 5);
    setSearchHistory(newHistory);
    try {
      localStorage.setItem('pdfSignatorySearchHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }

    const searchResults: SearchResults = {};
    originalCaseNames.forEach(mainName => (searchResults[mainName] = []));
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i++) {
        setProgress(((i-1) / numPages) * 100);
        setProgressLabel(t.progressLabel(i, numPages));
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let searchableText = searchStrategies.reconstructTextFromItems(textContent.items);
        const pageTextItems = textContent.items.filter(item => 'str' in item) as TextItem[];

        if ((!searchableText.trim() || /^\s*$/.test(searchableText)) && useOcr) {
            setProgressLabel(t.progressOcrLabel(i, numPages));
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
              const { data: { text } } = await Tesseract.recognize(canvas, 'ind+eng', {
                logger: m => {
                   if (m.status === 'recognizing text') {
                      setProgress(((i-1) / numPages) * 100 + (m.progress * 100 / numPages));
                   }
                }
              });
              searchableText = text;
            }
        }
        
        if (!searchableText.trim()) continue;
        
        const searchStrategy = searchStrategies[searchMode];

        for (const name of originalCaseNames) {
           const findings = searchStrategy({
              name,
              pageNumber: i,
              pageText: searchableText,
              pageTextItems,
           });
           searchResults[name].push(...findings);
        }
      }
      
      const sortedResults: SearchResults = {};
      Object.keys(searchResults).forEach(name => {
          sortedResults[name] = searchResults[name]
            .filter((finding, index, self) => index === self.findIndex((f) => f.page === finding.page))
            .sort((a, b) => {
              if (a.hasKeyword && !b.hasKeyword) return -1;
              if (!a.hasKeyword && b.hasKeyword) return 1;
              return a.page - b.page;
          });
      });
      
      setProgressLabel(t.scanComplete);
      setProgress(100);
      setResults(sortedResults);

    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: t.toast.processFailedTitle, description: t.toast.processFailedDesc(errorMessage) });
    } finally {
      setLoading(false);
    }
  };
  
  const downloadResults = () => {
    if (!results) return;
    
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const formattedResults = Object.entries(results)
      .filter(([, findings]) => findings.length > 0)
      .map(([name, findings]) => {
        const pageNumbers = [...new Set(findings.map(f => f.page))].join(', ');
        return `${name}: ${pageNumbers}`;
      })
      .join('\n');

    const blob = new Blob([formattedResults], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `signatory_results_${dateString}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const foundNames = results ? Object.entries(results).filter(([, findings]) => findings.length > 0) : [];
  const notFoundNames = results ? Object.entries(results).filter(([, findings]) => findings.length === 0) : [];

  return (
    <>
      <main className="flex min-h-[calc(100vh-12rem)] flex-col items-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle>{t.cardTitle}</CardTitle>
                <CardDescription>{t.cardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {showUpdateAlert && (
                <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>{t.updateAlert.title}</AlertTitle>
                    <AlertDescription>{t.updateAlert.description}</AlertDescription>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary font-semibold mt-2"
                      onClick={dismissUpdateAlert}
                    >
                      {t.updateAlert.dismiss}
                    </Button>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="pdfFile" className='text-base font-semibold'>{t.uploadLabel}</Label>
                <div className="relative border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <UploadCloud className="w-12 h-12" />
                    <p><span className="font-semibold text-primary">{t.uploadClick}</span>{' '}{t.uploadDrag}</p>
                    <p className="text-xs">{t.uploadHint}</p>
                  </div>
                  <Input id="pdfFile" type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label={t.uploadAria} disabled={loading}/>
                </div>
                 {file && (
                  <div className="mt-4 flex items-center text-sm text-foreground p-3 bg-muted/50 rounded-md border">
                    <FileText className="h-5 w-5 mr-3 flex-shrink-0 text-primary" />
                    <span className="truncate flex-1 font-medium">{file.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Label className='text-base font-semibold'>{t.optionsLabel}</Label>
                <RadioGroup value={searchMode} onValueChange={(value) => handleSearchModeChange(value as SearchMode)} className="grid grid-cols-1 gap-4">
                  <div>
                    <RadioGroupItem value="fast" id="mode-fast" className="peer sr-only" />
                    <Label htmlFor="mode-fast" className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer transition-colors hover:bg-accent/50 hover:border-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                      <div className="flex items-center gap-3">
                        <FastForward className="h-6 w-6 text-primary" />
                        <span className="font-bold text-card-foreground">{t.searchModes.fast.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{t.searchModes.fast.description}</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="accurate" id="mode-accurate" className="peer sr-only" />
                     <Label htmlFor="mode-accurate" className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer transition-colors hover:bg-accent/50 hover:border-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span className="font-bold text-card-foreground">{t.searchModes.accurate.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{t.searchModes.accurate.description}</span>
                    </Label>
                  </div>
                   <div>
                    <RadioGroupItem value="structural" id="mode-structural" className="peer sr-only" />
                     <Label htmlFor="mode-structural" className="flex flex-col items-start gap-2 rounded-lg border-2 border-muted bg-popover p-4 cursor-pointer transition-colors hover:bg-accent/50 hover:border-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                      <div className="flex items-center gap-3">
                        <ScanSearch className="h-6 w-6 text-primary" />
                        <span className="font-bold text-card-foreground">{t.searchModes.structural.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{t.searchModes.structural.description}</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

               <div className="space-y-3">
                <Label className='text-base font-semibold'>{t.ocrLabel}</Label>
                <div className="flex items-start space-x-3 rounded-lg border border-muted p-4">
                  <Checkbox id="useOcr" checked={useOcr} onCheckedChange={(checked) => setUseOcr(checked as boolean)} className='mt-1' />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="useOcr"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t.useOcr}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {t.ocrHint}
                    </p>
                  </div>
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="namesToFind" className='text-base font-semibold'>{t.namesLabel}</Label>
                 <Textarea id="namesToFind" placeholder={t.namesPlaceholder} value={namesToFind} onChange={(e) => setNamesToFind(e.target.value)} disabled={loading} rows={3} />
                <p className="text-xs text-muted-foreground">{t.namesHint}</p>
              </div>
              {searchHistory.length > 0 && (
                <div className="space-y-2">
                    <Label className='text-sm font-medium'>{t.historyTitle}</Label>
                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-muted" onClick={() => !loading && setNamesToFind(item)}>
                                {item.length > 50 ? `${item.substring(0, 50)}...` : item}
                            </Badge>
                        ))}
                    </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col items-stretch border-t pt-6">
              {loading && (
                  <div className="w-full space-y-2 mb-4">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">{progressLabel}</p>
                  </div>
                )}
              <Button onClick={handleSearch} disabled={loading || !file || !namesToFind} className="w-full" size="lg">
                {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.searchingButton}</>) : (<><Search className="mr-2 h-5 w-5" />{t.searchButton}</>)}
              </Button>
            </CardFooter>
          </Card>

          {results && !loading && (
            <Card className="mt-8 w-full shadow-lg animate-in fade-in-50">
              <CardHeader className="flex flex-row items-start sm:items-center justify-between space-x-2">
                <div>
                  <CardTitle>{t.resultsTitle}</CardTitle>
                  <CardDescription>{t.resultsDescription(foundNames.length, Object.keys(results).length)}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={downloadResults} className="shrink-0" disabled={foundNames.length === 0}>
                  <Download className="mr-2 h-4 w-4" />{t.download}
                </Button>
              </CardHeader>
              <CardContent>
                {foundNames.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    {foundNames.map(([name, findings]) => (
                      <AccordionItem value={name} key={name}>
                        <AccordionTrigger>
                          <div className="flex justify-between w-full items-center pr-2">
                            <span className="font-semibold text-primary truncate">{name}</span>
                            <span className="text-sm text-muted-foreground shrink-0 ml-4">{t.foundOnPages}: {[...new Set(findings.map(f => f.page))].join(', ')}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="mt-2 space-y-3 pl-2">
                            {findings.map((finding, index) => (
                              <li key={index} className="text-sm text-muted-foreground p-2 rounded-md">
                                <strong className="text-foreground font-medium">{t.page} {finding.page}:</strong>
                                <blockquote className="mt-1 pl-3 border-l-4 border-accent bg-muted/30 italic p-2 rounded-r-md">
                                  {finding.snippet}
                                </blockquote>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
                 {notFoundNames.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">{t.notFound}</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                      {notFoundNames.map(([name]) => ( <li key={name}>{name}</li> ))}
                    </ul>
                  </div>
                )}
                {foundNames.length === 0 && notFoundNames.length === 0 && (
                   <p className="text-muted-foreground text-center py-4">{t.noResults}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Toaster />
    </>
  );
}
