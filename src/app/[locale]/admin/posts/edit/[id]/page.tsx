
'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PostEditor } from '@/components/admin/post-editor';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditPostPage() {
  const { id, locale } = useParams();
  const db = useFirestore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // We need to check both collections since status might have changed
  const pubRef = useMemoFirebase(() => doc(db, 'blogPosts_published', id as string), [db, id]);
  const draftRef = useMemoFirebase(() => doc(db, 'blogPosts_drafts', id as string), [db, id]);

  const { data: pubData, isLoading: loadingPub } = useDoc(pubRef);
  const { data: draftData, isLoading: loadingDraft } = useDoc(draftRef);

  useEffect(() => {
    if (!loadingPub && !loadingDraft) {
      setData(pubData || draftData);
      setLoading(false);
    }
  }, [pubData, draftData, loadingPub, loadingDraft]);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center p-20">Post not found in database.</div>;
  }

  return <PostEditor initialData={data} id={id as string} />;
}
