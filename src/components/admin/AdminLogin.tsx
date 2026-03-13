import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth, LoginOptions, loginWithGitHubToken } from '@/lib/auth'
import { ArrowLeft, ShieldCheck, Lock, EnvelopeSimple, Key, Usb, CheckCircle, Warning, Password, Notepad, GithubLogo, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  getLocalKeyfile, 
  parseKeyfileFromContent, 
  hasLocalKeyfile,
  AdminKeyfile 
} from '@/lib/keyfile'
import { isLocalhost } from '@/lib/local-storage-kv'

type AuthMethod = 'usb' | 'backup' | 'recovery'
type LoginTab = 'credentials' | 'github'

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
  
  // Login tabs: credentials vs GitHub token
  const [loginTab, setLoginTab] = useState<LoginTab>(() => isLocalhost() ? 'credentials' : 'github')
  const [ghToken, setGhToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  
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

  const handleGitHubTokenLogin = async () => {
    if (!ghToken.trim()) {
      toast.error('Please enter a GitHub Personal Access Token')
      return
    }
    setIsLoading(true)
    const result = await loginWithGitHubToken(ghToken.trim())
    if (result.success) {
      toast.success(`Signed in as ${result.username}`)
      // Force page reload to pick up new session
      window.location.reload()
    } else {
      toast.error(result.error || 'Authentication failed')
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
          <h1 className="text-xl font-bold tracking-tight">Founder Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your control center</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          {/* Login method tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setLoginTab('credentials')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                loginTab === 'credentials'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="h-3.5 w-3.5" weight="bold" />
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setLoginTab('github')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                loginTab === 'github'
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GithubLogo className="h-3.5 w-3.5" weight="bold" />
              GitHub Token
            </button>
          </div>

          {/* GitHub Token form */}
          {loginTab === 'github' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleGitHubTokenLogin(); }}>
              <CardContent className="space-y-4 pt-6">
                <input type="text" name="username" autoComplete="username" value="DTMBX" readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
                <p className="text-xs text-muted-foreground">
                  Sign in from anywhere using a GitHub Personal Access Token with repo access to <strong>DTMBX/Founder-Hub</strong>.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="gh-token" className="text-xs font-medium">Personal Access Token</Label>
                  <div className="relative">
                    <GithubLogo className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gh-token"
                      type={showToken ? 'text' : 'password'}
                      value={ghToken}
                      onChange={(e) => setGhToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      required
                      disabled={isLoading}
                      autoComplete="off"
                      className="pl-9 pr-9 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground">Required scopes:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.5 rounded">repo</span>
                    <span className="text-[10px] text-muted-foreground/60">or</span>
                    <span className="bg-primary/10 text-primary text-[9px] font-mono px-1.5 py-0.5 rounded">public_repo</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">
                    Create one at <span className="font-mono">github.com/settings/tokens</span>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3 pb-6">
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={isLoading || !ghToken.trim()}
                  size="lg"
                  onClick={handleGitHubTokenLogin}
                >
                  {isLoading ? (
                    <>Verifying...</>
                  ) : (
                    <>
                      <GithubLogo className="h-4 w-4" weight="bold" />
                      Sign in with GitHub
                    </>
                  )}
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
          ) : (
          /* Email/password form (existing) */
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
          )}
        </Card>

        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Encrypted</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Key className="h-2.5 w-2.5" />Hardware Keys</span>
          <span>·</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" />Rate Protected</span>
        </div>
      </div>
    </div>
  )
}
