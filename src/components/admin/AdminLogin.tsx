import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { ArrowLeft, ShieldCheck, Lock, EnvelopeSimple, Key, Usb, CheckCircle, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  getLocalKeyfile, 
  parseKeyfileFromContent, 
  hasLocalKeyfile,
  AdminKeyfile 
} from '@/lib/keyfile'

interface AdminLoginProps {
  onBack: () => void
}

export default function AdminLogin({ onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [requiresKeyfile, setRequiresKeyfile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importedKeyfile, setImportedKeyfile] = useState<AdminKeyfile | null>(null)
  const [hasStoredKeyfile, setHasStoredKeyfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()

  useEffect(() => {
    setHasStoredKeyfile(hasLocalKeyfile())
    const localKey = getLocalKeyfile()
    if (localKey) {
      setImportedKeyfile(localKey)
    }
  }, [])

  const handleKeyfileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const keyfile = parseKeyfileFromContent(content)
      if (keyfile) {
        setImportedKeyfile(keyfile)
        toast.success(`Keyfile loaded: ${keyfile.label}`)
      } else {
        toast.error('Invalid keyfile format')
      }
    }
    reader.onerror = () => toast.error('Failed to read keyfile')
    reader.readAsText(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    
    if (isLoading) return
    
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    
    setIsLoading(true)

    try {
      const result = await login(
        email, 
        password, 
        totpCode || undefined,
        importedKeyfile || undefined
      )
      
      if (!result.success) {
        if (result.requiresKeyfile) {
          setRequiresKeyfile(true)
          toast.warning('Hardware keyfile required for this account')
        } else if (result.requires2FA) {
          setRequires2FA(true)
          toast.info('Please enter your authentication code')
        } else {
          toast.error(result.error || 'Login failed')
        }
      }
    } catch (err) {
      console.error('[AdminLogin] Login error:', err)
      toast.error('An unexpected error occurred')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" weight="duotone" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure access to your control center</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || requires2FA}
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || requires2FA}
                    autoComplete="current-password"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Hardware Keyfile Section */}
              {requiresKeyfile && (
                <div className="space-y-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Usb className="h-4 w-4" weight="duotone" />
                    <Label className="text-xs font-medium">Hardware Key Required</Label>
                  </div>
                  
                  {importedKeyfile ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle className="h-4 w-4" weight="fill" />
                      <span>Keyfile loaded: {importedKeyfile.label}</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-muted-foreground">
                        Insert your USB key and import the keyfile, or use your home computer where the key is stored.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleKeyfileImport}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Usb className="h-4 w-4" />
                        Import Keyfile from USB
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Keyfile status indicator when not required but available */}
              {!requiresKeyfile && importedKeyfile && (
                <div className="flex items-center gap-2 text-emerald-400/70 text-xs p-2 rounded bg-emerald-500/5">
                  <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                  <span>Hardware key: {importedKeyfile.label}</span>
                </div>
              )}

              {requires2FA && (
                <div className="space-y-2">
                  <Label htmlFor="totp-code" className="text-xs font-medium">Authentication Code</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totp-code"
                      type="text"
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      disabled={isLoading}
                      autoComplete="one-time-code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className="pl-9 font-mono tracking-widest text-center"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3 pb-6">
              <Button 
                type="button"
                className="w-full" 
                disabled={isLoading || (requiresKeyfile && !importedKeyfile)} 
                size="lg"
                onClick={handleSubmit}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-xs text-muted-foreground gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to site
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60">
          <span>PBKDF2 + AES-256-GCM</span>
          <span>·</span>
          <span>Hardware Keys</span>
          <span>·</span>
          <span>Rate limited</span>
        </div>
      </div>
    </div>
  )
}
