
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AddressEntry } from '@/types/address-types';

const translations = {
  id: {
    labels: {
        title: 'Judul/Label Alamat',
        name: 'Nama Lengkap',
        phone: 'Nomor Telepon',
        address: 'Alamat Lengkap',
    },
    placeholders: {
        title: 'cth. Rumah, Kantor, Gudang',
    },
    save: 'Simpan Alamat',
    cancel: 'Batal',
    errors: {
        title: 'Judul diperlukan',
        name: 'Nama diperlukan',
        address: 'Alamat diperlukan',
    }
  },
  en: {
    labels: {
        title: 'Address Title/Label',
        name: 'Full Name',
        phone: 'Phone Number',
        address: 'Full Address',
    },
    placeholders: {
        title: 'e.g. Home, Office, Warehouse',
    },
    save: 'Save Address',
    cancel: 'Cancel',
    errors: {
        title: 'Title is required',
        name: 'Name is required',
        address: 'Address is required',
    }
  },
};

interface AddressFormProps {
  initialData?: AddressEntry | null;
  onSave: (data: AddressEntry) => void;
  onCancel: () => void;
  locale: "id" | "en";
}

export function AddressForm({ initialData, onSave, onCancel, locale }: AddressFormProps) {
  const t = translations[locale];

  const validationSchema = z.object({
    title: z.string().min(1, t.errors.title),
    name: z.string().min(1, t.errors.name),
    phone: z.string().catch(''),
    address: z.string().min(1, t.errors.address),
  });
  
  const { control, handleSubmit, formState: { errors } } = useForm<Omit<AddressEntry, 'id'>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: initialData?.title || '',
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
    },
  });

  const onSubmit = (data: Omit<AddressEntry, 'id'>) => {
    onSave({ id: initialData?.id || '', ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">{t.labels.title}</Label>
        <Controller name="title" control={control} render={({ field }) => <Input id="title" {...field} placeholder={t.placeholders.title} />} />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="name">{t.labels.name}</Label>
        <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} autoComplete="name" />} />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="phone">{t.labels.phone}</Label>
        <Controller name="phone" control={control} render={({ field }) => <Input id="phone" {...field} autoComplete="tel" />} />
      </div>
      <div>
        <Label htmlFor="address">{t.labels.address}</Label>
        <Controller name="address" control={control} render={({ field }) => <Textarea id="address" {...field} rows={4} autoComplete="street-address"/>} />
        {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>{t.cancel}</Button>
        <Button type="submit">{t.save}</Button>
      </div>
    </form>
  );
}

    