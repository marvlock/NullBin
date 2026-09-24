'use client'

import { useParams } from 'next/navigation'
import PasteViewer from '@/components/paste-viewer'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PastePage() {
  const params = useParams()
  const id = params.id as string
  return (
    <div className="nullbin-shell min-h-screen bg-[#09090d] text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#09090d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-white text-sm font-black text-zinc-950">
                N
              </div>
              <span className="text-lg font-semibold tracking-[-0.04em]">NullBin</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="h-9 border-white/10 bg-transparent text-white hover:bg-white/[.06] hover:text-white">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                <span>Back</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <PasteViewer pasteId={id} />
        </div>
      </main>
    </div>
  )
}
