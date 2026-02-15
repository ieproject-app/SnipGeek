import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="destructive" className="my-6 bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-200 [&>svg]:text-red-600 dark:[&>svg]:text-red-400">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-bold text-red-800 dark:text-red-300">Warning</AlertTitle>
      <AlertDescription>
        {children}
      </AlertDescription>
    </Alert>
  );
}
