import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Home, Upload, Menu } from "lucide-react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Lead Manager Dashboard",
  description: "Manage and track your leads with powerful analytics",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-white`}
      >
        {/* Sidebar (Desktop) */}
        <aside className="hidden sm:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lead Manager
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track & Manage Leads
            </p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              <Home className="h-5 w-5" />
              Lead Dashboard
            </Link>

            <Link
              href="/lead-upload"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              <Upload className="h-5 w-5" />
              Lead Upload
            </Link>
          </nav>

          <div className="p-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-neutral-800">
            <p className="font-semibold mb-1">© 2025 Lead Tracker</p>
            <p className="text-[10px]">Powered by Crossml</p>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shadow-sm">
          <header className="flex items-center justify-between p-4">
            <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lead Manager
            </h1>
            <Menu className="h-6 w-6" />
          </header>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto sm:mt-0 mt-16">{children}</main>
      </body>
    </html>
  )
}