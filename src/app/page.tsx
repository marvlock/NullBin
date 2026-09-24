"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, KeyRound, Search, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PasteForm from "@/components/paste-form"
import { ThemeToggle } from "@/components/theme-toggle"

type Mode = "select" | "create" | "view"

function Mark() {
  return <div className="grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-white text-sm font-black text-zinc-950">N</div>
}

function Header({ setMode }: { setMode: (mode: Mode) => void }) {
  return <header className="sticky top-0 z-50 border-b border-white/5 bg-[#09090d]/75 backdrop-blur-2xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3" onClick={(event) => { event.preventDefault(); setMode("select") }}><Mark /><span className="text-lg font-semibold tracking-[-0.04em] text-white">NullBin</span></Link>
      <ThemeToggle />
    </div>
  </header>
}

function HomeContent() {
  const [mode, setMode] = useState<Mode>("select")
  const [pasteId, setPasteId] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const requested = searchParams.get("mode")
    if (requested === "create" || requested === "view") setMode(requested)
  }, [searchParams])

  const openPaste = () => {
    const input = pasteId.trim()
    if (!input) return toast.error("Enter a paste ID or full link")
    if (input.includes("://")) {
      try { const url = new URL(input); router.push(url.pathname + url.hash); return } catch { return toast.error("That link is not valid") }
    }
    const match = input.match(/paste\/([a-zA-Z0-9]+(?:#.*)?)/)
    router.push(match ? `/paste/${match[1]}` : `/paste/${input}`)
  }

  if (mode === "create") return <div className="nullbin-shell min-h-screen bg-[#09090d] text-white"><Header setMode={setMode} />
    <main className="relative mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
      <div className="relative mx-auto max-w-5xl"><div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-4xl font-bold tracking-[-0.06em] sm:text-5xl">Drop a secret. Share a link.</h1></div><div className="flex items-center gap-2 text-sm text-zinc-400"><ShieldCheck className="h-4 w-4 text-emerald-400" />Encrypted before upload</div></div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-1 shadow-2xl shadow-black/40"><PasteForm /></div></div>
    </main></div>

  if (mode === "view") return <div className="nullbin-shell min-h-screen bg-[#09090d] text-white"><Header setMode={setMode} />
    <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-16">
      <section className="relative w-full max-w-xl rounded-xl border border-white/10 bg-zinc-950 p-7 sm:p-10"><div className="mb-8 grid h-11 w-11 place-items-center rounded-lg border border-white/10 text-zinc-300"><KeyRound className="h-5 w-5" /></div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Decrypt locally</p><h1 className="text-4xl font-bold tracking-[-0.06em]">Open a paste.</h1><p className="mt-4 max-w-md text-zinc-400">Paste the complete secure link or snippet identifier. The key is read only in your browser.</p>
        <div className="mt-9 space-y-3"><Label htmlFor="paste-id" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Paste link or ID</Label><div className="flex gap-2"><Input id="paste-id" value={pasteId} onChange={(event) => setPasteId(event.target.value)} onKeyDown={(event) => event.key === "Enter" && openPaste()} placeholder="https://nullbin.dev/paste/..." className="h-12 border-white/10 bg-white/[.04] font-mono text-sm text-white placeholder:text-zinc-600" /><Button onClick={openPaste} className="h-12 rounded-xl bg-white px-5 text-zinc-950 hover:bg-zinc-200"><ArrowRight className="h-4 w-4" /></Button></div></div>
      </section></main></div>

  return <div className="nullbin-shell flex min-h-screen flex-col overflow-hidden bg-[#09090d] text-white"><Header setMode={setMode} />
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center"><section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl text-center"><p className="mb-7 font-mono text-xs text-zinc-500">PRIVATE PASTE SHARING</p>
        <h1 className="text-balance text-5xl font-bold leading-[.98] tracking-[-0.07em] sm:text-7xl">Encrypted pastes.<br />No account needed.</h1>
        <p className="mx-auto mt-7 max-w-xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">Create a paste, share the link, and choose when it expires.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => setMode("create")} size="lg" className="h-14 rounded-lg bg-white px-6 text-base text-zinc-950 hover:bg-zinc-200">Create a paste <ArrowRight className="ml-2 h-4 w-4" /></Button><Button onClick={() => setMode("view")} variant="outline" size="lg" className="h-14 rounded-lg border-white/10 bg-transparent px-6 text-base text-white hover:bg-white/[.06] hover:text-white"><Search className="mr-2 h-4 w-4" />Open a paste</Button></div>
      </div>
    </section></main></div>
}

export default function Home() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#09090d] font-mono text-sm text-zinc-500">Loading NullBin…</div>}><HomeContent /></Suspense>
}
