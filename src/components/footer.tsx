import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#07070a] px-5 py-5 text-xs text-zinc-600 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="font-medium text-zinc-400 transition hover:text-zinc-200">nullbin</Link>
        <span>Client-side encrypted</span>
      </div>
    </footer>
  )
}
