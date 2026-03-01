
'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { NoteEditor } from '@/components/admin/note-editor';
import { Loader2 } from 'lucide-react';

export default function EditNotePage() {
  const { id } = useParams();
  const db = useFirestore();

  const noteRef = useMemoFirebase(() => doc(db, 'notes_published', id as string), [db, id]);
  const { data, isLoading } = useDoc(noteRef);

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center p-20">Note not found in database.</div>;
  }

  return <NoteEditor initialData={data} id={id as string} />;
}
