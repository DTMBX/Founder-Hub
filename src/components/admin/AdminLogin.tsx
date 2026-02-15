import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AdminLoginProps {
  onBack: () => void
}

export default function AdminLogin({ onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await login(email, password, totpCode || undefined)
    
    if (!result.success) {
      if (result.requires2FA) {
        setRequires2FA(true)
        toast.info('Please enter your authentication code')
      } else {
        toast.error(result.error || 'Login failed')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
            </div>
            <CardDescription>
              Secure authentication with rate limiting and audit logging
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Default credentials:</strong><br />
                  Email: admin@xtx396.online<br />
                  Password: SecureAdmin2024!
                  <div className="mt-2 text-xs text-muted-foreground">
                    Change your password immediately after first login.
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@xtx396.online"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || requires2FA}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || requires2FA}
                  autoComplete="current-password"
                />
              </div>

              {requires2FA && (
                <div className="space-y-2">
                  <Label htmlFor="totp-code">Authentication Code</Label>
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app or use a backup code.
                  </p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🔒 Passwords are hashed with SHA-256</p>
                <p>🛡️ Rate limiting: 5 attempts per 15 minutes</p>
                <p>📝 All login attempts are logged</p>
                <p>⏱️ Sessions expire after 8 hours</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
