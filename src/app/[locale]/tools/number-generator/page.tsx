
import { Metadata } from 'next';
import { NomorGeneratorClient } from './components/NomorGeneratorClient';
import { BackToTop } from '@/components/back-to-top';

export const metadata: Metadata = {
  title: 'Unique Number Generator',
  description: 'A tool to generate unique, centralized, and duplication-proof document numbers, powered by Firebase Firestore.',
  alternates: {
    canonical: '/kit/nomor-generator',
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function NomorGeneratorPage() {
  return (
    <>
      <div className="container max-w-screen-lg">
        <main className="min-w-0 max-w-screen-lg mx-auto">
            <div className="space-y-4 mb-8">
              <h1 className="font-heading font-bold tracking-tight text-fluid-h1">
                Unique Number Generator
              </h1>
              <p className="text-fluid-p text-muted-foreground">
                Generate guaranteed unique document numbers in real-time.
              </p>
            </div>
            <NomorGeneratorClient />
        </main>
      </div>
      <BackToTop variant="floating" />
    </>
  );
}
