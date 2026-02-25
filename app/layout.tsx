import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comedy Roast Tournament – Check-In",
  description: "Stage manager check-in app for Comedy Roast Tournament",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
