
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2, Minimize, FileCheck2, UploadCloud, FileText, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { storage, functions } from '@/lib/firebase-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const compressPdfCallable = httpsCallable(functions, 'processPdfOnCall');

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type StatusKey = 'waiting' | 'uploading' | 'compressing' | 'complete' | 'failed';

const translations = {
  id: {
    title: 'Kompres PDF',
    description: 'Unggah file PDF Anda, dan kami akan secara otomatis mengompresnya. Ideal untuk lampiran email atau pengiriman online.',
    uploadLabel: 'Pilih File PDF',
    uploadClick: 'Klik untuk mengunggah',
    uploadDrag: 'atau seret dan lepas',
    uploadHint: `Hanya satu file PDF (Maks. ${MAX_FILE_SIZE_MB} MB)`,
    compressButton: 'Unggah & Kompres PDF',
    downloadResult: 'Unduh Hasil & Mulai Lagi',
    status: {
      waiting: 'Menunggu file...',
      uploading: (progress: number) => `Mengunggah... ${progress.toFixed(0)}%`,
      compressing: 'Server sedang memproses file, mohon tunggu...',
      complete: 'Selesai! File Anda siap diunduh.',
      failed: 'Proses Gagal. Silakan coba lagi.',
    },
    toast: {
      noFile: 'Silakan unggah file PDF terlebih dahulu.',
      fileTooLarge: `Ukuran file melebihi batas maksimum ${MAX_FILE_SIZE_MB} MB.`,
      uploadFailed: 'Unggahan Gagal',
      uploadFailedDesc: (error: string) => `Terjadi kesalahan saat mengunggah: ${error}. Periksa koneksi Anda dan aturan Firebase Storage.`,
      compressionFailed: 'Kompresi Gagal',
      compressionFailedDesc: (error: string) => `Server gagal memproses file. Rincian: ${error}`,
      invalidFile: 'File tidak valid. Silakan pilih file PDF.',
    },
    compressionResult: {
      title: "Kompresi Berhasil",
      original: "Ukuran Asli",
      compressed: "Ukuran Baru",
      reduction: "Pengurangan",
    },
    retentionPolicy: {
        title: "Kebijakan Penyimpanan File",
        description: "Untuk keamanan dan efisiensi penyimpanan, semua file yang diunggah dan hasil kompresi akan dihapus secara otomatis dari server kami setelah 1 hari.",
    },
  },
  en: {
    title: 'Compress PDF',
    description: 'Upload your PDF, and we will automatically compress it. Perfect for email attachments or online submissions.',
    uploadLabel: 'Select PDF File',
    uploadClick: 'Click to upload',
    uploadDrag: 'or drag and drop',
    uploadHint: `Single PDF file only (Max ${MAX_FILE_SIZE_MB} MB)`,
    compressButton: 'Upload & Compress PDF',
    downloadResult: 'Download Result & Start Over',
    status: {
      waiting: 'Waiting for file...',
      uploading: (progress: number) => `Uploading... ${progress.toFixed(0)}%`,
      compressing: 'Server is processing your file, please wait...',
      complete: 'Complete! Your file is ready for download.',
      failed: 'Process Failed. Please try again.',
    },
    toast: {
      noFile: 'Please upload a PDF file first.',
      fileTooLarge: `File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB} MB.`,
      uploadFailed: 'Upload Failed',
      uploadFailedDesc: (error: string) => `An error occurred during upload: ${error}. Check your connection and Firebase Storage rules.`,
      compressionFailed: 'Compression Failed',
      compressionFailedDesc: (error: string) => `Server failed to process the file. Details: ${error}`,
      invalidFile: 'Invalid file. Please select a PDF file.',
    },
    compressionResult: {
      title: "Compression Successful",
      original: "Original Size",
      compressed: "New Size",
      reduction: "Reduction",
    },
     retentionPolicy: {
        title: "File Retention Policy",
        description: "For security and storage efficiency, all uploaded files and their compressed results will be automatically deleted from our servers after 1 day.",
    },
  },
};

export default function ToolCompressPdf({ locale }: { locale: "id" | "en" }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<StatusKey>('waiting');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; newSize: number; originalSize: number } | null>(null);
  
  const { toast } = useToast();
  const t = translations[locale];

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const resetState = useCallback(() => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setStatus('waiting');
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let files: FileList | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      e.stopPropagation();
      files = e.dataTransfer.files;
    } else {
      files = e.target.files;
    }

    if (files && files.length > 0) {
      const selectedFile = files[0];
      resetState();
      
      if (selectedFile.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: t.toast.invalidFile });
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        toast({ variant: 'destructive', title: t.toast.fileTooLarge });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadAndCompress = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: t.toast.noFile });
      return;
    }

    setStatus('uploading');
    setProgress(0);

    const originalSize = file.size;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const uploadPath = `uploads/original_${Date.now()}_${sanitizedFileName}`;
    const storageRef = ref(storage, uploadPath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    try {
      // Step 1: Upload the file
      await new Promise<UploadTaskSnapshot>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(percent);
          },
          (error) => {
            // This is the critical error handler for uploads
            console.error("Upload error in handler:", error);
            toast({ variant: 'destructive', title: t.toast.uploadFailed, description: t.toast.uploadFailedDesc(error.code), duration: 9000 });
            setStatus('failed');
            reject(error);
          },
          () => {
            // Upload complete
            resolve(uploadTask.snapshot);
          }
        );
      });

      // Step 2: Call the Cloud Function
      setStatus('compressing');
      setProgress(0); // Reset progress for the next step

      const functionResponse = await compressPdfCallable({ originalFilePath: uploadPath });
      const { downloadUrl, newSize } = functionResponse.data as { downloadUrl: string, newSize: number };

      // Step 3: Set result and finish
      setResult({ url: downloadUrl, newSize, originalSize });
      setStatus('complete');
      setProgress(100);

    } catch (error: any) {
      console.error("An error occurred during the process:", error);
      setStatus('failed');
      const errorMessage = error.details?.message || error.message || 'An unknown error occurred.';
      toast({ variant: 'destructive', title: t.toast.compressionFailed, description: t.toast.compressionFailedDesc(errorMessage), duration: 9000 });
    }
  };

  const handleDownloadAndReset = () => {
    if (result?.url) {
      window.open(result.url, '_blank');
    }
    resetState();
  };

  const isLoading = status === 'uploading' || status === 'compressing';
  
  const reductionPercentage = (original: number, compressed: number) => {
    if (!compressed || original === 0) return 0;
    return ((original - compressed) / original) * 100;
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'uploading': return t.status.uploading(progress);
      case 'compressing': return t.status.compressing;
      case 'complete': return t.status.complete;
      case 'failed': return t.status.failed;
      default: return t.status.waiting;
    }
  };

  return (
    <>
      <main className="flex min-h-[calc(100vh-12rem)] flex-col items-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <Alert variant="default" className="border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-700 dark:text-yellow-400">{t.retentionPolicy.title}</AlertTitle>
                  <AlertDescription className="text-yellow-600 dark:text-yellow-500">
                    {t.retentionPolicy.description}
                  </AlertDescription>
                </Alert>

               <div className="space-y-2">
                <Label htmlFor="pdfFile" className="text-base font-semibold">{t.uploadLabel}</Label>
                { !file ? (
                    <div 
                        className="relative border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleFileChange}
                        >
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                            <UploadCloud className="w-12 h-12" />
                            <p><span className="font-semibold text-primary">{t.uploadClick}</span> {t.uploadDrag}</p>
                            <p className="text-xs">{t.uploadHint}</p>
                        </div>
                        <Input id="pdfFile" type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label={t.uploadLabel} disabled={isLoading} />
                    </div>
                ) : (
                    <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50 border shadow-sm">
                         <FileText className="h-6 w-6 text-primary" />
                         <div className="flex-1 truncate">
                           <p className="font-medium text-sm">{file.name}</p>
                           <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                         </div>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={resetState} title="Remove file" disabled={isLoading}>
                           <XCircle className="h-5 w-5" />
                         </Button>
                    </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex-col items-stretch border-t pt-6 space-y-4">
              {status !== 'waiting' && status !== 'complete' && (
                <div className="w-full space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {getStatusMessage()}
                  </p>
                </div>
              )}
              {result && status === 'complete' && (
                 <Alert variant="default" className="border-green-400/50 bg-green-50 dark:bg-green-900/10">
                  <FileCheck2 className="h-4 w-4 text-green-500" />
                   <AlertTitle className="text-green-700 dark:text-green-400">{t.compressionResult.title}</AlertTitle>
                  <AlertDescription>
                    <div className="text-green-600 dark:text-green-500 text-sm space-y-1 mt-2">
                        <div className="flex justify-between"><span>{t.compressionResult.original}:</span> <span className="font-medium">{formatBytes(result.originalSize)}</span></div>
                        <div className="flex justify-between"><span>{t.compressionResult.compressed}:</span> <span className="font-medium">{formatBytes(result.newSize)}</span></div>
                        <div className="flex justify-between font-bold text-green-700 dark:text-green-400"><span>{t.compressionResult.reduction}:</span> <span>{reductionPercentage(result.originalSize, result.newSize).toFixed(2)}%</span></div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {result ? (
                 <div className="grid grid-cols-1">
                    <Button onClick={handleDownloadAndReset} className="w-full" size="lg">
                        <Download className="mr-2 h-5 w-5" />{t.downloadResult}
                    </Button>
                </div>
              ) : (
                <Button onClick={handleUploadAndCompress} disabled={isLoading || !file} className="w-full" size="lg">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Minimize className="mr-2 h-5 w-5" />}
                  {status === 'uploading' ? getStatusMessage() : t.compressButton}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
      <Toaster />
    </>
  );
}
