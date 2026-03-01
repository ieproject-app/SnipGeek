
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { populateDatabaseAction } from '@/app/actions/populate-numbers';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'iwan.efndi@gmail.com';

export function MaintenanceClient({ dictionary }: { dictionary: any }) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState<number>(0);

  if (isUserLoading) {
    return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
    );
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="p-6 bg-destructive/10 rounded-full ring-8 ring-destructive/5">
            <ShieldAlert className="h-16 w-16 text-destructive" />
        </div>
        <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter text-primary">
                {dictionary.unauthorized}
            </h2>
            <p className="text-muted-foreground mt-2">Only {ADMIN_EMAIL} can access this area.</p>
        </div>
      </div>
    );
  }

  const handlePopulate = async () => {
    if (confirm("Are you SURE? This will inject thousands of records into Firestore.")) {
        setIsProcessing(true);
        try {
            const result = await populateDatabaseAction(user.email);
            setStats(result);
            setIsFinished(true);
            toast({ title: dictionary.success, description: `${result} numbers generated.` });
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: dictionary.error, description: error.message });
        } finally {
            setIsProcessing(false);
        }
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-700">
      <Card className="border-primary/10 bg-card/50 shadow-xl overflow-hidden">
        <div className="h-1.5 w-full bg-accent" />
        <CardHeader className="bg-muted/20 border-b p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
                <Database className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl font-black uppercase tracking-tight">
                {dictionary.populateTitle}
            </CardTitle>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {dictionary.populateDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isFinished ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-500">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-xl text-primary">{dictionary.success}</h3>
                    <p className="text-muted-foreground font-mono text-sm mt-1">Total: {stats} items created.</p>
                </div>
                <Button variant="outline" className="mt-4" onClick={() => setIsFinished(false)}>
                    Populate More?
                </Button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-600">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">This process uses Write Batches. It may take up to a minute depending on your connection speed.</p>
                </div>
                
                <Button 
                    onClick={handlePopulate} 
                    disabled={isProcessing}
                    className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            {dictionary.loading}
                        </>
                    ) : (
                        <>
                            <Database className="mr-3 h-6 w-6" />
                            {dictionary.populateButton}
                        </>
                    )}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">
        System Maintenance Area &bull; Restricted Access
      </p>
    </div>
  );
}
