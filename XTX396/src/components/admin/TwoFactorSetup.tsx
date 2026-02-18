import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { ShieldCheck, QrCode, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function TwoFactorSetup() {
  const { currentUser, setup2FA, enable2FA, disable2FA, regenerateBackupCodes } = useAuth()
  
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrSecret, setQrSecret] = useState('')
  const [qrCodeURL, setQrCodeURL] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = useState('')
  const [isDisabling2FA, setIsDisabling2FA] = useState(false)

  const [showRegenCodes, setShowRegenCodes] = useState(false)
  const [regenPassword, setRegenPassword] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])

  const handleStart2FASetup = async () => {
    const result = await setup2FA()
    
    if (result.success && result.secret && result.qrCodeURL && result.backupCodes) {
      setQrSecret(result.secret)
      setQrCodeURL(result.qrCodeURL)
      setBackupCodes(result.backupCodes)
      setShow2FASetup(true)
    } else {
      toast.error(result.error || 'Failed to setup 2FA')
    }
  }

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setIsSettingUp2FA(true)
    const result = await enable2FA(qrSecret, verificationCode, backupCodes)
    
    if (result.success) {
      toast.success('Two-factor authentication enabled successfully')
      setShow2FASetup(false)
      setVerificationCode('')
      setQrSecret('')
      setQrCodeURL('')
      setBackupCodes([])
    } else {
      toast.error(result.error || 'Failed to enable 2FA')
    }
    
    setIsSettingUp2FA(false)
  }

  const handleDisable2FA = async () => {
    setIsDisabling2FA(true)
    const result = await disable2FA(disable2FAPassword)
    
    if (result.success) {
      toast.success('Two-factor authentication disabled')
      setShowDisable2FA(false)
      setDisable2FAPassword('')
    } else {
      toast.error(result.error || 'Failed to disable 2FA')
    }
    
    setIsDisabling2FA(false)
  }

  const handleRegenerateBackupCodes = async () => {
    setIsRegenerating(true)
    const result = await regenerateBackupCodes(regenPassword)
    
    if (result.success && result.backupCodes) {
      setNewBackupCodes(result.backupCodes)
      toast.success('Backup codes regenerated')
    } else {
      toast.error(result.error || 'Failed to regenerate backup codes')
    }
    
    setIsRegenerating(false)
  }

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text)
    if (type === 'secret') {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } else {
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    }
    toast.success('Copied to clipboard')
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security with time-based one-time passwords (TOTP)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser?.twoFactorEnabled ? (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <strong>Two-factor authentication is enabled</strong>
                  </div>
                  Your account is protected with TOTP. You'll need to enter a code from your authenticator app when logging in.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Backup Codes Remaining</Label>
                <p className="text-sm">
                  {currentUser.twoFactorBackupCodes?.length || 0} of 10 codes available
                </p>
                {(currentUser.twoFactorBackupCodes?.length || 0) < 3 && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Running low on backup codes. Consider regenerating them.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenCodes(true)}
                  className="flex-1"
                >
                  Regenerate Backup Codes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisable2FA(true)}
                  className="flex-1"
                >
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Enable two-factor authentication for enhanced security</strong>
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Use any TOTP authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
                    <li>Receive 10 backup codes for emergency access</li>
                    <li>Required at every login after password verification</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={handleStart2FASetup} className="w-full sm:w-auto">
                <QrCode className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-4 border border-border rounded-lg">
              <img src={qrCodeURL} alt="QR Code" className="w-64 h-64" />
              
              <div className="w-full space-y-2">
                <Label className="text-xs text-muted-foreground">Manual Entry Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrSecret}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(qrSecret, 'secret')}
                  >
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Save these backup codes!</strong> Store them securely - you'll need them if you lose access to your authenticator app.
                <div className="mt-2 p-2 bg-muted rounded font-mono text-xs grid grid-cols-2 gap-1">
                  {backupCodes.map((code, i) => (
                    <div key={i}>{code}</div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                >
                  {copiedCodes ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy All Backup Codes
                </Button>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={isSettingUp2FA}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FASetup(false)} disabled={isSettingUp2FA}>
              Cancel
            </Button>
            <Button onClick={handleEnable2FA} disabled={isSettingUp2FA || verificationCode.length !== 6}>
              {isSettingUp2FA ? 'Verifying...' : 'Enable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable two-factor authentication
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertDescription className="text-sm text-yellow-600">
              ⚠️ Disabling 2FA will reduce your account security. Your backup codes will be deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="disable-password">Password</Label>
            <Input
              id="disable-password"
              type="password"
              value={disable2FAPassword}
              onChange={(e) => setDisable2FAPassword(e.target.value)}
              disabled={isDisabling2FA}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisable2FA(false)} disabled={isDisabling2FA}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={isDisabling2FA || !disable2FAPassword}>
              {isDisabling2FA ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegenCodes} onOpenChange={setShowRegenCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              Generate a new set of 10 backup codes. Old codes will be invalidated.
            </DialogDescription>
          </DialogHeader>

          {newBackupCodes.length === 0 ? (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  This will replace all existing backup codes with new ones. Make sure to save the new codes securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="regen-password">Password</Label>
                <Input
                  id="regen-password"
                  type="password"
                  value={regenPassword}
                  onChange={(e) => setRegenPassword(e.target.value)}
                  disabled={isRegenerating}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRegenCodes(false)} disabled={isRegenerating}>
                  Cancel
                </Button>
                <Button onClick={handleRegenerateBackupCodes} disabled={isRegenerating || !regenPassword}>
                  {isRegenerating ? 'Generating...' : 'Regenerate Codes'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Save these new backup codes!</strong> Your old codes are no longer valid.
                  <div className="mt-2 p-2 bg-muted rounded font-mono text-xs grid grid-cols-2 gap-1">
                    {newBackupCodes.map((code, i) => (
                      <div key={i}>{code}</div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => copyToClipboard(newBackupCodes.join('\n'), 'codes')}
                  >
                    {copiedCodes ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy All Backup Codes
                  </Button>
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button onClick={() => {
                  setShowRegenCodes(false)
                  setNewBackupCodes([])
                  setRegenPassword('')
                }}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
