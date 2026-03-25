
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Loader2, BookUser, ArrowRightLeft, Truck, Home, AlertTriangle, Bookmark, Save, Layers, ChevronDown, Trash2 } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { AddressBookDialog } from '@/components/tools/address-label/address-book-dialog';
import type { AddressEntry, AddressPair } from '@/types/address-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const translations = {
  id: {
    title: 'Generator Label Alamat',
    description: 'Isi atau pilih detail dari buku alamat, pratinjau label, lalu unduh sebagai PDF.',
    sender: 'Pengirim',
    receiver: 'Penerima',
    fullName: 'Nama Lengkap',
    phone: 'Nomor Telepon',
    address: 'Alamat Lengkap',
    openAddressBook: 'Buka Buku Alamat',
    swapAddresses: 'Tukar Alamat',
    preview: 'Pratinjau Label',
    from: 'DARI:',
    to: 'KEPADA:',
    generateButton: 'Buat & Unduh PDF',
    generatingButton: 'Membuat PDF...',
    backupNoticeTitle: 'Jangan Lupa Mencadangkan!',
    backupNoticeDesc: 'Buku alamat Anda disimpan di peramban ini. Gunakan fitur "Ekspor" di dalam Buku Alamat untuk membuat cadangan agar tidak hilang.',
    toast: {
      fillRequired: 'Silakan isi nama dan alamat untuk Pengirim dan Penerima.',
      bookSaved: 'Alamat berhasil disimpan ke Buku Alamat.',
      errorSaving: 'Judul diperlukan untuk menyimpan alamat.',
      addressIncomplete: 'Nama dan Alamat harus diisi untuk disimpan.',
      pairSaved: 'Templat pasangan alamat berhasil disimpan.',
      pairSaveError: 'Judul diperlukan untuk menyimpan templat.',
    },
    saveToBook: 'Simpan ke Buku Alamat',
    saveDialog: {
        title: 'Simpan Alamat',
        label: 'Beri judul untuk alamat ini (cth. Rumah, Kantor)',
        save: 'Simpan',
        cancel: 'Batal',
    },
    quickAccess: {
        title: 'Templat Pengiriman (Akses Cepat)',
        savePair: 'Simpan Pasangan Saat Ini',
        noTemplates: 'Belum ada templat tersimpan.',
        savePairDialogTitle: 'Simpan Pasangan Alamat',
        savePairDialogLabel: 'Beri judul untuk templat ini (cth. Kantor ke Gudang)',
        deleteTooltip: 'Hapus templat',
    }
  },
  en: {
    title: 'Address Label Generator',
    description: 'Fill in or select details from the address book, preview your label, then download it as a PDF.',
    sender: 'Sender',
    receiver: 'Receiver',
    fullName: 'Full Name',
    phone: 'Phone Number',
    address: 'Full Address',
    openAddressBook: 'Open Address Book',
    swapAddresses: 'Swap Addresses',
    preview: 'Label Preview',
    from: 'FROM:',
    to: 'TO:',
    generateButton: 'Create & Download PDF',
    generatingButton: 'Generating PDF...',
    backupNoticeTitle: 'Don\'t Forget to Back Up!',
    backupNoticeDesc: 'Your address book is saved in this browser. Use the "Export" feature inside the Address Book to create a backup so you don\'t lose it.',
    toast: {
      fillRequired: 'Please fill in the name and address for both Sender and Receiver.',
      bookSaved: 'Address successfully saved to Address Book.',
      errorSaving: 'A title is required to save the address.',
      addressIncomplete: 'Name and Address must be filled to be saved.',
      pairSaved: 'Address pair template saved successfully.',
      pairSaveError: 'A title is required to save the template.',
    },
    saveToBook: 'Save to Address Book',
    saveDialog: {
        title: 'Save Address',
        label: 'Give this address a title (e.g. Home, Office)',
        save: 'Save',
        cancel: 'Batal',
    },
    quickAccess: {
        title: 'Shipping Templates (Quick Access)',
        savePair: 'Save Current Pair',
        noTemplates: 'No saved templates yet.',
        savePairDialogTitle: 'Save Address Pair',
        savePairDialogLabel: 'Give this template a title (e.g. Office to Warehouse)',
        deleteTooltip: 'Delete template',
    }
  },
};

const initialAddressState: Omit<AddressEntry, 'id' | 'title'> = { name: '', phone: '', address: '' };
type AddressToSave = { type: 'sender' | 'receiver'; data: Omit<AddressEntry, 'id' | 'title'> } | null;


export default function ToolAddressLabel({ locale }: { locale: "id" | "en" }) {
  const t = translations[locale];
  const { toast } = useToast();

  const [sender, setSender] = useState(initialAddressState);
  const [receiver, setReceiver] = useState(initialAddressState);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  
  const [addressBook, setAddressBook] = useState<AddressEntry[]>([]);
  const [addressPairs, setAddressPairs] = useState<AddressPair[]>([]);
  const [showBackupNotice, setShowBackupNotice] = useState(false);
  
  const [addressToSave, setAddressToSave] = useState<AddressToSave>(null);
  const [saveTitle, setSaveTitle] = useState('');
  
  const [isSavePairOpen, setIsSavePairOpen] = useState(false);
  const [pairSaveTitle, setPairSaveTitle] = useState('');


  useEffect(() => {
    try {
      const storedBook = localStorage.getItem('pdfToolAddressBook');
      if (storedBook) {
        const parsedBook = JSON.parse(storedBook);
        if (Array.isArray(parsedBook)) {
           setAddressBook(parsedBook);
           if (parsedBook.length > 0) setShowBackupNotice(true);
        }
      }
      const storedPairs = localStorage.getItem('pdfToolAddressPairs');
      if (storedPairs) {
        const parsedPairs = JSON.parse(storedPairs);
        if (Array.isArray(parsedPairs)) {
            setAddressPairs(parsedPairs);
        }
      }
    } catch (e) {
      console.error("Could not access localStorage or parse data", e);
    }
  }, []);

  const updateAndSaveBook = (newBook: AddressEntry[]) => {
    setAddressBook(newBook);
    try {
      localStorage.setItem('pdfToolAddressBook', JSON.stringify(newBook));
    } catch (e) {
      console.error("Failed to save address book to localStorage", e);
    }
  };

  const updateAndSavePairs = (newPairs: AddressPair[]) => {
    setAddressPairs(newPairs);
    try {
        localStorage.setItem('pdfToolAddressPairs', JSON.stringify(newPairs));
    } catch (e) {
        console.error("Failed to save address pairs to localStorage", e);
    }
  };
  
  const handleSelectAddress = useCallback((entry: AddressEntry, type: 'sender' | 'receiver') => {
    const { id, title, ...addressData } = entry;
    if (type === 'sender') {
      setSender(addressData);
    } else {
      setReceiver(addressData);
    }
    setIsAddressBookOpen(false);
  }, []);
  
  const handleSwap = () => {
    const tempSender = sender;
    setSender(receiver);
    setReceiver(tempSender);
  }
  
  const promptToSaveAddress = (type: 'sender' | 'receiver') => {
    const addressData = type === 'sender' ? sender : receiver;
    if (!addressData.name || !addressData.address) {
        toast({ variant: 'destructive', title: t.toast.addressIncomplete });
        return;
    }
    setAddressToSave({ type, data: addressData });
    setSaveTitle('');
  };
  
  const handleConfirmSaveAddress = () => {
    if (!saveTitle.trim()) {
        toast({ variant: 'destructive', title: t.toast.errorSaving });
        return;
    }
    if (addressToSave) {
        const newEntry: AddressEntry = {
            id: `addr_${Date.now()}`,
            title: saveTitle,
            ...addressToSave.data,
        };
        updateAndSaveBook([...addressBook, newEntry]);
        toast({ title: t.toast.bookSaved });
    }
    setAddressToSave(null);
  };
  
  const handleConfirmSavePair = () => {
    if (!pairSaveTitle.trim()) {
        toast({ variant: 'destructive', title: t.toast.pairSaveError });
        return;
    }
    const newPair: AddressPair = {
        id: `pair_${Date.now()}`,
        title: pairSaveTitle,
        sender,
        receiver,
    };
    updateAndSavePairs([...addressPairs, newPair]);
    toast({ title: t.toast.pairSaved });
    setIsSavePairOpen(false);
    setPairSaveTitle('');
  };

  const handleLoadPair = (pair: AddressPair) => {
    setSender(pair.sender);
    setReceiver(pair.receiver);
  };
  
  const handleDeletePair = (pairId: string) => {
    updateAndSavePairs(addressPairs.filter(p => p.id !== pairId));
  };

  const handleGeneratePdf = async () => {
    if (!sender.name || !sender.address || !receiver.name || !receiver.address) {
      toast({ variant: 'destructive', title: t.toast.fillRequired });
      return;
    }

    setIsGenerating(true);

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(PageSizes.A4);
      const { width, height } = page.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const margin = 50;
      const labelWidth = width - margin * 2;
      const labelHeight = height / 4; 
      const startY = height - margin - 50;

      page.drawRectangle({
        x: margin,
        y: startY - labelHeight,
        width: labelWidth,
        height: labelHeight,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      const padding = 20;
      const contentWidth = (labelWidth - padding * 3) / 2;

      // --- Sender ---
      let currentY = startY - padding;
      page.drawText(t.from, { x: margin + padding, y: currentY, font: boldFont, size: 12 });
      currentY -= 20;
      page.drawText(sender.name, { x: margin + padding, y: currentY, font: boldFont, size: 14, maxWidth: contentWidth });
      currentY -= 18;
      page.drawText(sender.phone, { x: margin + padding, y: currentY, font, size: 11, maxWidth: contentWidth });
      currentY -= 15;
      page.drawText(sender.address, { x: margin + padding, y: currentY, font, size: 11, maxWidth: contentWidth, lineHeight: 14 });

      // --- Receiver ---
      currentY = startY - padding;
      const receiverX = margin + padding * 2 + contentWidth;
      page.drawText(t.to, { x: receiverX, y: currentY, font: boldFont, size: 12 });
      currentY -= 20;
      page.drawText(receiver.name, { x: receiverX, y: currentY, font: boldFont, size: 14, maxWidth: contentWidth });
      currentY -= 18;
      page.drawText(receiver.phone, { x: receiverX, y: currentY, font, size: 11, maxWidth: contentWidth });
      currentY -= 15;
      page.drawText(receiver.address, { x: receiverX, y: currentY, font, size: 11, maxWidth: contentWidth, lineHeight: 14 });

      const pdfBytes = await pdfDoc.save();
      const senderPart = sender.name.split(' ')[0] || 'pengirim';
      const receiverPart = receiver.name.split(' ')[0] || 'penerima';
      const fileName = `Label_${senderPart}_ke_${receiverPart}.pdf`.replace(/\s/g, '_');
      saveAs(new Blob([pdfBytes as any], { type: 'application/pdf' }), fileName);

    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const isFormValid = sender.name && sender.address && receiver.name && receiver.address;

  return (
    <>
      <main className="flex min-h-[calc(100vh-12rem)] flex-col items-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-5xl mx-auto">
          <Card className="w-full shadow-lg">
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {showBackupNotice && (
                <Alert variant="default" className="border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-700 dark:text-yellow-400">{t.backupNoticeTitle}</AlertTitle>
                  <AlertDescription className="text-yellow-600 dark:text-yellow-500">{t.backupNoticeDesc}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-center mb-4">
                  <Button onClick={() => setIsAddressBookOpen(true)}>
                      <BookUser className="mr-2 h-5 w-5" />
                      {t.openAddressBook}
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
                {/* Sender Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-primary">{t.sender}</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title={t.saveToBook} onClick={() => promptToSaveAddress('sender')}>
                        <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sender-name">{t.fullName}</Label>
                    <Input id="sender-name" value={sender.name} onChange={e => setSender({...sender, name: e.target.value})} autoComplete="name" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sender-phone">{t.phone}</Label>
                    <Input id="sender-phone" value={sender.phone} onChange={e => setSender({...sender, phone: e.target.value})} autoComplete="tel" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sender-address">{t.address}</Label>
                    <Textarea id="sender-address" value={sender.address} onChange={e => setSender({...sender, address: e.target.value})} rows={4} autoComplete="street-address" />
                  </div>
                </div>

                {/* Swap Button */}
                <Button variant="outline" size="icon" onClick={handleSwap} aria-label={t.swapAddresses} className="hidden md:flex">
                    <ArrowRightLeft className="h-5 w-5" />
                </Button>

                {/* Receiver Column */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-primary">{t.receiver}</h3>
                     <Button variant="ghost" size="icon" className="h-7 w-7" title={t.saveToBook} onClick={() => promptToSaveAddress('receiver')}>
                        <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiver-name">{t.fullName}</Label>
                    <Input id="receiver-name" value={receiver.name} onChange={e => setReceiver({...receiver, name: e.target.value})} autoComplete="name" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiver-phone">{t.phone}</Label>
                    <Input id="receiver-phone" value={receiver.phone} onChange={e => setReceiver({...receiver, phone: e.target.value})} autoComplete="tel" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiver-address">{t.address}</Label>
                    <Textarea id="receiver-address" value={receiver.address} onChange={e => setReceiver({...receiver, address: e.target.value})} rows={4} autoComplete="street-address" />
                  </div>
                </div>
              </div>
              
              {/* Quick Access Section */}
              <Collapsible className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                       <Button variant="ghost" className="text-lg font-semibold p-1 h-auto">
                            {t.quickAccess.title}
                            <ChevronDown className="ml-2 h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                       </Button>
                    </CollapsibleTrigger>
                    <Button variant="outline" size="sm" onClick={() => setIsSavePairOpen(true)} disabled={!isFormValid}>
                        <Save className="mr-2 h-4 w-4" />
                        {t.quickAccess.savePair}
                    </Button>
                  </div>
                  <CollapsibleContent className="space-y-2">
                      {addressPairs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {addressPairs.map(pair => (
                                <div key={pair.id} className="group flex items-center">
                                    <Button variant="secondary" className="w-full justify-start text-left h-auto" onClick={() => handleLoadPair(pair)}>
                                        <Layers className="mr-3 h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{pair.title}</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 opacity-0 group-hover:opacity-100 shrink-0" title={t.quickAccess.deleteTooltip} onClick={() => handleDeletePair(pair.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">{t.quickAccess.noTemplates}</p>
                      )}
                  </CollapsibleContent>
              </Collapsible>
              
              {/* Preview Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">{t.preview}</h3>
                <div className="border rounded-lg p-6 min-h-[200px] bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                      <Truck className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-bold text-muted-foreground">{t.from}</p>
                        <p className="font-bold text-lg">{sender.name || '...'}</p>
                        <p className="text-sm text-muted-foreground">{sender.phone}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sender.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Home className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-bold text-muted-foreground">{t.to}</p>
                        <p className="font-bold text-lg">{receiver.name || '...'}</p>
                        <p className="text-sm text-muted-foreground">{receiver.phone}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{receiver.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter>
              <Button size="lg" onClick={handleGeneratePdf} disabled={isGenerating || !isFormValid}>
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.generatingButton}</>
                ) : (
                  <><Download className="mr-2 h-5 w-5" />{t.generateButton}</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <AddressBookDialog
        isOpen={isAddressBookOpen}
        onClose={() => setIsAddressBookOpen(false)}
        addressBook={addressBook}
        onUpdateBook={updateAndSaveBook}
        onSelectAddress={handleSelectAddress}
        locale={locale}
      />
      <Dialog open={!!addressToSave} onOpenChange={() => setAddressToSave(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.saveDialog.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="save-title">{t.saveDialog.label}</Label>
                <Input 
                    id="save-title" 
                    value={saveTitle} 
                    onChange={e => setSaveTitle(e.target.value)} 
                    placeholder={t.saveDialog.label}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t.saveDialog.cancel}</Button>
                </DialogClose>
                <Button type="button" onClick={handleConfirmSaveAddress}>{t.saveDialog.save}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
       <Dialog open={isSavePairOpen} onOpenChange={setIsSavePairOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.quickAccess.savePairDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="save-pair-title">{t.quickAccess.savePairDialogLabel}</Label>
                <Input 
                    id="save-pair-title" 
                    value={pairSaveTitle} 
                    onChange={e => setPairSaveTitle(e.target.value)} 
                    placeholder={t.quickAccess.savePairDialogLabel}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t.saveDialog.cancel}</Button>
                </DialogClose>
                <Button type="button" onClick={handleConfirmSavePair}>{t.saveDialog.save}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  );
}

    