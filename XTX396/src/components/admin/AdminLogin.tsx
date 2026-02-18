import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth, LoginOptions } from '@/lib/auth'
import { ArrowLeft, ShieldCheck, Lock, EnvelopeSimple, Key, Usb, CheckCircle, Warning, Password, Notepad } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  getLocalKeyfile, 
  parseKeyfileFromContent, 
  hasLocalKeyfile,
  AdminKeyfile 
} from '@/lib/keyfile'

type AuthMethod = 'usb' | 'backup' | 'recovery'

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
  
  // Alternative auth methods
  const [authMethod, setAuthMethod] = useState<AuthMethod>('usb')
  const [backupCode, setBackupCode] = useState('')
  const [backupPassphrase, setBackupPassphrase] = useState('')
  const [recoveryPhrase, setRecoveryPhrase] = useState('')
  
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
      // Build login options based on selected auth method
      const loginOptions: LoginOptions = {
        email,
        password,
        totpCode: totpCode || undefined,
      }
      
      // Add keyfile auth based on selected method
      if (requiresKeyfile || importedKeyfile) {
        switch (authMethod) {
          case 'usb':
            loginOptions.keyfile = importedKeyfile || undefined
            break
          case 'backup':
            loginOptions.backupCode = backupCode || undefined
            loginOptions.backupPassphrase = backupPassphrase || undefined
            break
          case 'recovery':
            loginOptions.recoveryPhrase = recoveryPhrase || undefined
            break
        }
      } else if (importedKeyfile) {
        loginOptions.keyfile = importedKeyfile
      }
      
      const result = await login(loginOptions)
      
      if (!result.success) {
        if (result.requiresKeyfile) {
          setRequiresKeyfile(true)
          if (!requiresKeyfile) {
            toast.warning('Hardware keyfile required for this account')
          } else {
            toast.error(result.error || 'Authentication failed')
          }
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
                <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldCheck className="h-4 w-4" weight="duotone" />
                    <Label className="text-xs font-medium">Additional Authentication Required</Label>
                  </div>
                  
                  {/* Auth method selector */}
                  <div className="flex gap-1 p-1 bg-background/50 rounded-md">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('usb')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium rounded transition-colors ${
                        authMethod === 'usb' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Usb className="h-3 w-3" weight="bold" />
                      USB Key
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('backup')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium rounded transition-colors ${
                        authMethod === 'backup' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Password className="h-3 w-3" weight="bold" />
                      Backup Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('recovery')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium rounded transition-colors ${
                        authMethod === 'recovery' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Notepad className="h-3 w-3" weight="bold" />
                      Recovery
                    </button>
                  </div>
                  
                  {/* USB Keyfile option */}
                  {authMethod === 'usb' && (
                    <div className="space-y-2">
                      {importedKeyfile ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <CheckCircle className="h-4 w-4" weight="fill" />
                          <span>Keyfile loaded: {importedKeyfile.label}</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] text-muted-foreground">
                            Insert your USB key and import the keyfile.
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
                            className="w-full gap-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Usb className="h-4 w-4" />
                            Import Keyfile from USB
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Backup code option */}
                  {authMethod === 'backup' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Enter a one-time backup code and your backup passphrase.
                      </p>
                      <Input
                        type="text"
                        placeholder="XXXX-XXXX-XXXX"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                        className="font-mono text-center text-sm"
                        maxLength={14}
                      />
                      <Input
                        type="password"
                        placeholder="Backup passphrase"
                        value={backupPassphrase}
                        onChange={(e) => setBackupPassphrase(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  {/* Recovery phrase option */}
                  {authMethod === 'recovery' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Enter your 12-word recovery phrase. This should only be used as a last resort.
                      </p>
                      <textarea
                        placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                        value={recoveryPhrase}
                        onChange={(e) => setRecoveryPhrase(e.target.value.toLowerCase())}
                        className="w-full h-20 px-3 py-2 text-sm font-mono rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-[10px] text-amber-400">
                        After recovery, set up a new USB keyfile immediately.
                      </p>
                    </div>
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
                disabled={isLoading || (requiresKeyfile && authMethod === 'usb' && !importedKeyfile)} 
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
