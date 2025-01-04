import '../styles/theme.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mavis AI',
  authors: [{ name: 'Narrator AI' }],
  icons: '/static/mavis/icons/logo.svg',
}

interface Props {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html className={inter.className} lang="en">
      <body className="bg-gray-1000 print:bg-white">{children}</body>
    </html>
  )
}
