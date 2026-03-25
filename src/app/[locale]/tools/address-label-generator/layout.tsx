
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Address Label Generator - PDF Tools by irweb.info',
  description: 'Easily create and print shipping address labels in PDF format.',
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
