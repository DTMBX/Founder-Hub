import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { ArrowLeft, ShieldCheck, Eye, EyeSlash, Copy, CheckCircle, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  generateBackupCodes,
  hashBackupCodes,
  storeBackupCodes,
  generateRecoveryPhrase,
  hashRecoveryPhrase,
  storeRecoveryPhraseHash,
} from '@/lib/keyfile'
import { createCheckpoint } from '@/lib/recovery-checkpoint'

interface FirstRunSetupProps {
  onBack: () => void
}

type SetupStep = 'credentials' | 'recovery' | 'confirm'

export default function FirstRunSetup({ onBack }: FirstRunSetupProps) {
  const { createFirstAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Recovery state
  const [step, setStep] = useState<SetupStep>('credentials')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [recoveryPhrase, setRecoveryPhrase] = useState('')
  const [codesCopied, setCodesCopied] = useState(false)
  const [phraseCopied, setPhraseCopied] = useState(false)

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 12) {
      toast.error('Password must be at least 12 characters')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await createFirstAdmin(email, password)
      if (!result.success) {
        toast.error(result.error || 'Setup failed')
        return
      }

      // Generate recovery materials
      const codes = generateBackupCodes()
      const phrase = generateRecoveryPhrase()

      // Store hashed versions (plaintext never persisted)
      const hashedCodes = await hashBackupCodes(codes)
      await storeBackupCodes(hashedCodes, password)
      const phraseHash = await hashRecoveryPhrase(phrase)
      await storeRecoveryPhraseHash(phraseHash)

      setBackupCodes(codes)
      setRecoveryPhrase(phrase)
      setStep('recovery')

      // Create initial recovery checkpoint
      try {
        await createCheckpoint('First-run setup')
      } catch {
        // Non-fatal — checkpoint is a convenience, not a gate
      }
    } catch {
      toast.error('An error occurred during setup')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'codes' | 'phrase') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'codes') setCodesCopied(true)
      else setPhraseCopied(true)
      toast.success(`${type === 'codes' ? 'Backup codes' : 'Recovery phrase'} copied`)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  const handleFinish = () => {
    window.location.reload()
  }

  // ── Step 1: Credentials ──
  if (step === 'credentials') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">First-Run Setup</CardTitle>
            <CardDescription>
              No admin account exists yet. Create your owner account to get started.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateAccount}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !email || password.length < 12 || password !== confirmPassword}
              >
                {isSubmitting ? 'Creating...' : 'Create Admin Account'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to site
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  // ── Step 2: Recovery Materials ──
  if (step === 'recovery') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Warning className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl">Save Your Recovery Materials</CardTitle>
            <CardDescription>
              These are shown <strong>once</strong>. Store them in a secure location (password manager, printed copy in a safe). You will need them if you lose access to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backup Codes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Backup Codes (8 one-time use)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                >
                  {codesCopied ? <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {codesCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-muted/50 p-3 rounded-md font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i} className="text-center py-1">{code}</div>
                ))}
              </div>
            </div>

            {/* Recovery Phrase */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Recovery Phrase (12 words)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(recoveryPhrase, 'phrase')}
                >
                  {phraseCopied ? <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {phraseCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="bg-muted/50 p-3 rounded-md font-mono text-sm leading-relaxed text-center">
                {recoveryPhrase}
              </div>
            </div>

            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md">
              If you lose your password and do not have these recovery materials, your account cannot be recovered. There is no password reset email — this is a sovereign system.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => setStep('confirm')}
              disabled={!codesCopied && !phraseCopied}
            >
              I've saved my recovery materials
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Copy at least one set of recovery materials to continue
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ── Step 3: Confirmation ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-xl">Setup Complete</CardTitle>
          <CardDescription>
            Your admin account is ready. A recovery checkpoint has been created automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span>Owner account created ({email})</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span>8 backup codes generated and stored</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span>Recovery phrase hash stored</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span>Recovery checkpoint saved</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="button" className="w-full" onClick={handleFinish}>
            Continue to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
