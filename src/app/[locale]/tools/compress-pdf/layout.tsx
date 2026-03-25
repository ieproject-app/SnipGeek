
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compress PDF - PDF Tools by irweb.info',
  description: 'Reduce your PDF file size while maintaining visual quality for easier sharing.',
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
