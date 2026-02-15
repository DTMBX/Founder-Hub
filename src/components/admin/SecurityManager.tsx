import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth'
import { ShieldCheck, Key, Lock, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function SecurityManager() {
  const { currentUser, changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 12) {
      toast.error('Password must be at least 12 characters long')
      return
    }

    setIsChanging(true)
    const result = await changePassword(currentPassword, newPassword)
    
    if (result.success) {
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error(result.error || 'Failed to change password')
    }
    
    setIsChanging(false)
  }

  const passwordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, label: '', color: '' }
    
    let score = 0
    if (password.length >= 12) score++
    if (password.length >= 16) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    if (score <= 2) return { score, label: 'Weak', color: 'text-destructive' }
    if (score <= 4) return { score, label: 'Fair', color: 'text-yellow-500' }
    if (score <= 5) return { score, label: 'Good', color: 'text-green-500' }
    return { score, label: 'Strong', color: 'text-green-600' }
  }

  const strength = passwordStrength(newPassword)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Security & Access</h2>
        <p className="text-muted-foreground">
          Manage your account security and authentication settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>Your current account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-mono">{currentUser?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <p className="text-sm capitalize">{currentUser?.role}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Login</Label>
              <p className="text-sm">
                {currentUser?.lastLogin 
                  ? new Date(currentUser.lastLogin).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Account Created</Label>
              <p className="text-sm">
                {new Date(currentUser?.createdAt || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Security Features</CardTitle>
            </div>
            <CardDescription>Active protection mechanisms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Password Hashing</p>
                <p className="text-xs text-muted-foreground">SHA-256 cryptographic hash</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Rate Limiting</p>
                <p className="text-xs text-muted-foreground">5 attempts per 15 minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Session Management</p>
                <p className="text-xs text-muted-foreground">8-hour expiration</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Audit Logging</p>
                <p className="text-xs text-muted-foreground">All actions tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>
            Update your password to maintain account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription className="text-sm">
              <strong>Password Requirements:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Minimum 12 characters</li>
                <li>Mix of uppercase and lowercase letters</li>
                <li>Include numbers and special characters</li>
                <li>Avoid common words or patterns</li>
              </ul>
            </AlertDescription>
          </Alert>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isChanging}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isChanging}
                autoComplete="new-password"
              />
              {newPassword && (
                <p className={`text-sm ${strength.color}`}>
                  Password strength: {strength.label}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isChanging}
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isChanging || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full sm:w-auto"
            >
              {isChanging ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
          <CardDescription>Recommendations for keeping your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Change your password regularly (every 90 days recommended)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Never share your credentials with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use a unique password not used on other websites</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Review audit logs regularly to monitor account activity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Log out when using shared or public computers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
