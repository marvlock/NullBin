"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Copy, 
  Download, 
  Code, 
  Lock, 
  Unlock,
  Loader2,
  AlertCircle
} from "lucide-react"
import { decryptData, extractEncryptionFromHash } from "@/lib/crypto"
import { highlightCode } from "@/lib/syntax"
import { isExpired } from "@/lib/utils"
import { toast } from "sonner"
import { notFound } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"

interface PasteData {
  id: string
  title?: string
  content: string
  language: string
  createdAt: number
  expiresAt: number | null
  iv: string
  salt?: string
  passwordProtected: boolean
  viewCount: number
}

interface PasteViewerProps {
  pasteId: string
}

export function PasteViewer({ pasteId }: PasteViewerProps) {
  const { resolvedTheme } = useTheme()
  const [paste, setPaste] = useState<PasteData | null>(null)
  const [decryptedContent, setDecryptedContent] = useState<string>("")
  const [highlightedContent, setHighlightedContent] = useState<string>("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isDecrypted, setIsDecrypted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    loadPaste()
  }, [pasteId]) // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    if (decryptedContent && paste) {
      highlightCodeContent()
    }
  }, [decryptedContent, paste, resolvedTheme]) // eslint-disable-line react-hooks/exhaustive-deps
  
  const loadPaste = async () => {
    try {
      const response = await fetch(`/api/paste/${pasteId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        if (response.status === 404) {
          notFound()
        } else if (response.status === 410) {
          setError(errorData.message || 'This paste has expired and has been automatically removed for security.')
          return
        }
        
        throw new Error(`Failed to load paste: ${errorData.error}`)
      }
      
      const pasteData: PasteData = await response.json()

      if (isExpired(pasteData.expiresAt)) {
        const expiredTime = pasteData.expiresAt ? new Date(pasteData.expiresAt).toLocaleString() : 'Unknown'
        setError(`This paste expired on ${expiredTime} and has been automatically removed for security.`)
        return
      }
      
      setPaste(pasteData)
      
      const encryptionData = extractEncryptionFromHash()
      if (encryptionData && 
          !pasteData.passwordProtected && 
          encryptionData.key !== 'password-protected') {
        await attemptDecryption(pasteData, encryptionData.key, encryptionData.iv)
      }
    } catch (error) {
      console.error("Error loading paste:", error)
      setError("Failed to load paste. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }  
  }
  
  const attemptDecryption = async (
    pasteData: PasteData, 
    key: string, 
    iv: string, 
    userPassword?: string
  ) => {
    setIsDecrypting(true)
    setError(null)

    try {
      const decryptionParams: {
        encryptedData: string;
        key: string;
        iv: string;
        password?: string;
        salt?: string;
      } = {
        encryptedData: pasteData.content,
        key,
        iv,
      }

      if (pasteData.passwordProtected && userPassword) {
        if (key !== 'password-protected') {
          decryptionParams.key = 'password-protected';
        }
        if (!pasteData.salt) throw new Error('Salt is required for password-protected decryption');
        decryptionParams.password = userPassword;
        decryptionParams.salt = pasteData.salt;
      }      
      
      try {
        const decrypted = await decryptData(decryptionParams)
        setDecryptedContent(decrypted)
        setIsDecrypted(true)
        toast.success("Content decrypted successfully")
      } catch {
        if (pasteData.passwordProtected && userPassword) {
          toast.error("Incorrect password. Please try again.")
        } else if (pasteData.passwordProtected) {
          toast.error("This paste is password-protected. Please enter the correct password.")
        } else {
          setError("Failed to decrypt content. The decryption link may be invalid or corrupted.")
        }
      }
    } catch {
      setError("Failed to prepare decryption parameters.")
    } finally {
      setIsDecrypting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paste || !password) return

    const encryptionData = extractEncryptionFromHash()
    if (!encryptionData) {
      alert("Invalid decryption link")
      return
    }

    const pasteWithSalt = {
      ...paste,
      salt: paste.salt || encryptionData.salt
    };
    
    if (!pasteWithSalt.salt) {
      alert("This paste is missing salt information required for password decryption");
      return;
    }
    
    await attemptDecryption(pasteWithSalt, 'password-protected', encryptionData.iv, password)
  }

  const highlightCodeContent = async () => {
    if (!paste || !decryptedContent) return
    try {
      const highlighted = await highlightCode(
        decryptedContent,
        paste.language,
        resolvedTheme === "light" ? "github-light" : "github-dark"
      )
      setHighlightedContent(highlighted)
    } catch {
      setHighlightedContent(`<pre><code>${decryptedContent}</code></pre>`)
    }
  }
  
  const copyToClipboard = async () => {    
    if (!decryptedContent) return
    try {
      await navigator.clipboard.writeText(decryptedContent)
      toast.success("Content copied to clipboard")
    } catch {
      toast.error("Failed to copy content")
    }
  }

  const copyShareableLink = async () => {
    try {
      const currentUrl = window.location.href
      await navigator.clipboard.writeText(currentUrl)
      toast.success("Shareable link copied to clipboard")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  const downloadPaste = () => {
    if (!decryptedContent || !paste) return
    const blob = new Blob([decryptedContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = paste.title || `paste-${paste.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("File downloaded")
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-5 px-4 animate-pulse">
        <div className="rounded-xl border border-white/10 p-6 h-32 bg-white/[.03]" />
        <div className="rounded-xl border border-white/10 p-6 h-24 bg-white/[.03]" />
        <div className="rounded-xl border border-white/10 p-6 h-96 bg-white/[.03]" />
      </div>    
    )
  }
  
  if (error) {
    const isExpiredError = error.includes("expired")
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <div className="glass-panel rounded-2xl p-8 text-center border-red-500/20 bg-red-500/5">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500 animate-bounce" />
          <h2 className="text-2xl font-bold mb-2 text-red-500">
            {isExpiredError ? 'Paste Expired' : 'Decryption Failed'}
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/">Back</Link>
            </Button>
            <Button asChild>
              <Link href="/?mode=create">New Paste</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!paste) notFound()

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 px-4 py-3 animate-fade-in">
      
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-zinc-300">
            {paste.passwordProtected && !isDecrypted ? <Lock className="h-4 w-4" /> : <Code className="h-4 w-4" />}
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.04em]">{paste.title || "Untitled paste"}</h1>
        </div>
        <Button onClick={copyShareableLink} variant="outline" size="sm" className="h-9 border-white/10 bg-transparent text-white hover:bg-white/[.06] hover:text-white">
          <Copy className="mr-1.5 h-3.5 w-3.5" />Copy link
        </Button>
      </div>

      {/* Password Protection */}
      {paste.passwordProtected && !isDecrypted && (
        <div className="rounded-xl border border-white/10 bg-white/[.02] p-8 text-center max-w-md mx-auto mt-8">
          <Lock className="w-10 h-10 text-zinc-300 mx-auto mb-5" />
          <h2 className="text-xl font-bold tracking-tight mb-2">Protected Content</h2>
          <p className="text-muted-foreground mb-6 text-sm">Decryption requires the password you set during creation.</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
               <Label htmlFor="password">Passphrase</Label>
               <Input
                 id="password"
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="h-12 border-white/10 bg-black/20"
                 required
               />
            </div>
            <Button type="submit" className="w-full h-12 rounded-md bg-white text-zinc-950 hover:bg-zinc-200" disabled={isDecrypting || !password}>
               {isDecrypting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Unlock className="w-5 h-5 mr-2" />}
               {isDecrypting ? "Decrypting..." : "Decrypt Content"}
            </Button>
          </form>
        </div>
      )}

      {/* Content */}
      {isDecrypted && decryptedContent && (
        <div className="rounded-xl overflow-hidden border border-white/10 flex flex-col">
          <div className="bg-white/[.03] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1.5 px-2">
                 <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={copyToClipboard} className="h-8 hover:bg-background">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={downloadPaste} className="h-8 hover:bg-background">
                <Download className="w-3.5 h-3.5 mr-1" /> Download
              </Button>
            </div>
          </div>
          <div className={`relative ${resolvedTheme === "light" ? "bg-white text-zinc-900" : "bg-black text-white"}`}>
            {highlightedContent ? (
              <div
                className="overflow-x-auto p-6 font-mono text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedContent }}
              />
            ) : (
              <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed">
                <code>{decryptedContent}</code>
              </pre>
            )}
          </div>
        </div>
      )}

      {/* No decryption data */}
      {!paste.passwordProtected && !isDecrypted && (!extractEncryptionFromHash() || extractEncryptionFromHash()?.key === 'password-protected') && (
        <div className="glass-panel p-8 rounded-2xl text-center max-w-md mx-auto mt-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold tracking-tight mb-2">Missing Key</h2>
          <p className="text-muted-foreground mb-6 text-sm">This snippet is encrypted and requires a valid URL link containing the hash fragment to view.</p>
        </div>
      )}
    </div>
  )
}

export default PasteViewer
