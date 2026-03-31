
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AddressEntry } from '@/types/address-types';
import { PlusCircle, Download, Upload, Trash2, Edit, CornerUpLeft, Send } from 'lucide-react';
import { AddressForm } from './address-form';
import { useToast } from '@/hooks/use-toast';
import * as ExcelJS from 'exceljs';

interface AddressBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  addressBook: AddressEntry[];
  onUpdateBook: (book: AddressEntry[]) => void;
  onSelectAddress: (entry: AddressEntry, type: 'sender' | 'receiver') => void;
  locale: "id" | "en";
}

const translations = {
  id: {
    title: 'Buku Alamat',
    description: 'Kelola alamat tersimpan Anda. Pilih alamat untuk menggunakannya sebagai pengirim atau penerima.',
    addNew: 'Tambah Alamat Baru',
    import: 'Impor dari Excel',
    export: 'Ekspor ke Excel',
    noAddresses: 'Buku alamat Anda kosong. Tambahkan alamat baru untuk memulai.',
    useAsSender: 'Gunakan sebagai Pengirim',
    useAsReceiver: 'Gunakan sebagai Penerima',
    edit: 'Ubah',
    delete: 'Hapus',
    confirmDelete: 'Apakah Anda yakin ingin menghapus alamat ini?',
    table: {
      title: 'Judul',
      name: 'Nama',
      actions: 'Aksi',
    },
    toast: {
        bookSaved: 'Buku alamat berhasil diperbarui.',
        importSuccess: (count: number) => `${count} alamat berhasil diimpor.`,
        importError: 'Gagal mengimpor file. Pastikan formatnya benar.',
        exportEmpty: 'Buku alamat kosong, tidak ada yang bisa diekspor.',
    },
    form: {
        addTitle: 'Tambah Alamat Baru',
        editTitle: 'Ubah Alamat',
    }
  },
  en: {
    title: 'Address Book',
    description: 'Manage your saved addresses. Select an address to use it as a sender or receiver.',
    addNew: 'Add New Address',
    import: 'Import from Excel',
    export: 'Export to Excel',
    noAddresses: 'Your address book is empty. Add a new address to get started.',
    useAsSender: 'Use as Sender',
    useAsReceiver: 'Use as Receiver',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this address?',
    table: {
      title: 'Title',
      name: 'Name',
      actions: 'Actions',
    },
    toast: {
        bookSaved: 'Address book updated successfully.',
        importSuccess: (count: number) => `Successfully imported ${count} addresses.`,
        importError: 'Failed to import file. Please check the format.',
        exportEmpty: 'Address book is empty, nothing to export.',
    },
    form: {
        addTitle: 'Add New Address',
        editTitle: 'Edit Address',
    }
  },
};

export function AddressBookDialog({ isOpen, onClose, addressBook, onUpdateBook, onSelectAddress, locale }: AddressBookDialogProps) {
  const t = translations[locale];
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingEntry, setEditingEntry] = useState<AddressEntry | null>(null);

  const updateAndSaveBook = (newBook: AddressEntry[]) => {
    onUpdateBook(newBook);
    toast({ title: t.toast.bookSaved });
  };
  
  const handleAddNew = () => {
    setEditingEntry(null);
    setView('form');
  };

  const handleEdit = (entry: AddressEntry) => {
    setEditingEntry(entry);
    setView('form');
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      const newBook = addressBook.filter(entry => entry.id !== id);
      updateAndSaveBook(newBook);
    }
  };

  const handleSaveForm = (entryData: Omit<AddressEntry, 'id'>) => {
    let newBook: AddressEntry[];
    if (editingEntry) {
      newBook = addressBook.map(e => (e.id === editingEntry.id ? { ...editingEntry, ...entryData } : e));
    } else {
      newBook = [...addressBook, { ...entryData, id: `addr_${Date.now()}` }];
    }
    updateAndSaveBook(newBook);
    setView('list');
    setEditingEntry(null);
  };
  
  const handleExport = async () => {
    if (addressBook.length === 0) {
        toast({ variant: 'destructive', title: t.toast.exportEmpty });
        return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Address Book');
    
    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Address', key: 'address', width: 50 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'ZIP', key: 'zip', width: 10 },
      { header: 'Country', key: 'country', width: 20 },
    ];
    
    // Add data
    addressBook.forEach(({ id, ...rest }) => {
      worksheet.addRow(rest);
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf_tools_address_book.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.getWorksheet(1);
            const json: Omit<AddressEntry, 'id'>[] = [];
            
            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header row
              const values = row.values as any[];
              if (values.some(val => val !== null && val !== undefined && val !== '')) {
                json.push({
                  name: values[1] || '',
                  address: values[2] || '',
                  city: values[3] || '',
                  state: values[4] || '',
                  zip: values[5] || '',
                  country: values[6] || '',
                });
              }
            });

            const newEntries: AddressEntry[] = json.map((row, index) => ({
                id: `imported_${Date.now()}_${index}`,
                title: row.title || 'Untitled',
                name: row.name || '',
                phone: row.phone || '',
                address: row.address || '',
            }));

            updateAndSaveBook([...addressBook, ...newEntries]);
            toast({ title: t.toast.importSuccess(newEntries.length) });
        } catch (error) {
            console.error("Import failed:", error);
            toast({ variant: 'destructive', title: t.toast.importError });
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset file input
  };
  
  const handleBackToList = () => {
      setView('list');
      setEditingEntry(null);
  }

  // When dialog opens, reset to list view
  React.useEffect(() => {
    if(isOpen) {
        setView('list');
        setEditingEntry(null);
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-4">
              {view === 'form' && (
                <Button variant="ghost" size="icon" onClick={handleBackToList} aria-label={t.form.addTitle}>
                    <CornerUpLeft className="h-5 w-5"/>
                </Button>
              )}
              <div>
                <DialogTitle>{view === 'list' ? t.title : (editingEntry ? t.form.editTitle : t.form.addTitle)}</DialogTitle>
                {view === 'list' && <DialogDescription>{t.description}</DialogDescription>}
              </div>
          </div>
        </DialogHeader>

        {view === 'list' ? (
          <TooltipProvider delayDuration={0}>
            <div className="flex-none flex flex-wrap gap-2 p-4 border-b">
              <Button onClick={handleAddNew}><PlusCircle className="mr-2" />{t.addNew}</Button>
              <Button variant="outline" onClick={handleExport}><Download className="mr-2" />{t.export}</Button>
              <Button variant="outline" asChild>
                <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="mr-2" />{t.import}
                    <input type="file" id="import-file" className="sr-only" accept=".xlsx, .xls, .csv" onChange={handleImport}/>
                </label>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {addressBook.length === 0 ? (
                <p className="text-muted-foreground text-center p-8">{t.noAddresses}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.table.title}</TableHead>
                      <TableHead>{t.table.name}</TableHead>
                      <TableHead className="text-right">{t.table.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addressBook.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.title}</TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell className="text-right space-x-1">
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelectAddress(entry, 'sender')}><Send className="h-4 w-4"/></Button></TooltipTrigger>
                                <TooltipContent><p>{t.useAsSender}</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelectAddress(entry, 'receiver')}><CornerUpLeft className="h-4 w-4"/></Button></TooltipTrigger>
                                <TooltipContent><p>{t.useAsReceiver}</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4"/></Button></TooltipTrigger>
                                <TooltipContent><p>{t.edit}</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger>
                                <TooltipContent><p>{t.delete}</p></TooltipContent>
                            </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <AddressForm
              locale={locale}
              initialData={editingEntry}
              onSave={handleSaveForm}
              onCancel={handleBackToList}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
