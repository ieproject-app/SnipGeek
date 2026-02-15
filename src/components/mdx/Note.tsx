import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="my-6 bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
      <Info className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
      <AlertTitle className="font-bold text-blue-800 dark:text-blue-300">Note</AlertTitle>
      <AlertDescription>
        {children}
      </AlertDescription>
    </Alert>
  );
}
