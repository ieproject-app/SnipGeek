
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signatories Index - PDF Tools by irweb.info',
  description: 'Find and list all signatory names and their page numbers from a PDF document.',
  robots: {
    index: false,
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
