import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Jenna's Dashboard — UMW",
  description: 'Academic planner for Jenna at University of Mary Washington',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Jenna's Dashboard",
  },
  icons: {
    icon: [
      { url: '/frederick-favicon.svg', type: 'image/svg+xml' },
      { url: '/frederick-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/frederick-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jenna's Dashboard" />
        <link rel="apple-touch-icon" href="/frederick-icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
