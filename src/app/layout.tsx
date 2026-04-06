import "./globals.css";

// This is a root layout that doesn't have locale.
// It's just a pass-through.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
