import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Optimize font loading with font-display: swap
  preload: true,
})

export const metadata: Metadata = {
  title: "AssetDrop - Professional File Sharing Made Simple",
  description: "Stop emailing files. Share branded asset pages with clients through a simple link. Professional, organized, and tracked.",
  keywords: ["file sharing", "asset sharing", "client portal", "file delivery", "professional file sharing"],
  authors: [{ name: "AssetDrop" }],
  openGraph: {
    title: "AssetDrop - Professional File Sharing Made Simple",
    description: "Stop emailing files. Share branded asset pages with clients through a simple link.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AssetDrop - Professional File Sharing Made Simple",
    description: "Stop emailing files. Share branded asset pages with clients through a simple link.",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
