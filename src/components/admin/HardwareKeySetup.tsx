import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { Usb, Download, Key, Warning, CheckCircle, Trash, ShieldWarning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  generateKeyfile, 
  exportKeyfileToFile, 
  storeKeyfileLocally,
  getLocalKeyfile,
  clearLocalKeyfile,
  hasLocalKeyfile,
  AdminKeyfile
} from '@/lib/keyfile'
import { useKV, kv } from '@/lib/local-storage-kv'
import { User } from '@/lib/types'

const USERS_KEY = 'founder-hub-users'

export default function HardwareKeySetup() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useKV<User[]>(USERS_KEY, [])
  const [password, setPassword] = useState('')
  const [keyLabel, setKeyLabel] = useState('Primary Key')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [generatedKeyfile, setGeneratedKeyfile] = useState<AdminKeyfile | null>(null)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [hasSavedLocally, setHasSavedLocally] = useState(false)

  const localKeyfile = getLocalKeyfile()
  const isEnabled = currentUser?.keyfileEnabled

  const handleGenerateKeyfile = async () => {
    if (!currentUser || !password) {
      toast.error('Please enter your password')
      return
    }

    setIsGenerating(true)

    try {
      const { keyfile, keyHash } = await generateKeyfile(currentUser.id, password, keyLabel)
      
      // Update user record with keyfile info
      const updatedUsers = (users || []).map(u => 
        u.id === currentUser.id 
          ? { ...u, keyfileEnabled: true, keyfileHash: keyHash, keyfileId: keyfile.keyId }
          : u
      )
      await kv.set(USERS_KEY, updatedUsers)
      setUsers(updatedUsers)
      
      setGeneratedKeyfile(keyfile)
      toast.success('Hardware key generated successfully')
    } catch (error) {
      console.error('Keyfile generation failed:', error)
      toast.error('Failed to generate keyfile')
    }

    setIsGenerating(false)
  }

  const handleDownloadKeyfile = () => {
    if (!generatedKeyfile) return
    exportKeyfileToFile(generatedKeyfile)
    setHasDownloaded(true)
    toast.success('Keyfile downloaded - save it to your USB drive')
  }

  const handleSaveLocally = () => {
    if (!generatedKeyfile) return
    storeKeyfileLocally(generatedKeyfile)
    setHasSavedLocally(true)
    toast.success('Keyfile saved to this browser - auto-login enabled on this device')
  }

  const handleCompleteSetup = () => {
    if (!hasDownloaded && !hasSavedLocally) {
      toast.error('Please download or save your keyfile first')
      return
    }
    setShowSetupDialog(false)
    setGeneratedKeyfile(null)
    setPassword('')
    setHasDownloaded(false)
    setHasSavedLocally(false)
    toast.success('Hardware key authentication enabled!')
  }

  const handleRevokeKeyfile = async () => {
    if (!currentUser) return

    try {
      // Clear keyfile from user record
      const updatedUsers = (users || []).map(u => 
        u.id === currentUser.id 
          ? { ...u, keyfileEnabled: false, keyfileHash: undefined, keyfileId: undefined }
          : u
      )
      await kv.set(USERS_KEY, updatedUsers)
      setUsers(updatedUsers)
      
      // Clear local keyfile if exists
      clearLocalKeyfile()
      
      setShowRevokeDialog(false)
      toast.success('Hardware key authentication disabled')
    } catch (error) {
      toast.error('Failed to revoke keyfile')
    }
  }

  return (
    <>
      <Card className="border-amber-500/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Usb className="h-5 w-5 text-amber-500" weight="duotone" />
            <CardTitle>Hardware Key Authentication</CardTitle>
          </div>
          <CardDescription>
            Require a physical USB keyfile for admin login — maximum security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <>
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
                <AlertDescription className="text-emerald-400">
                  Hardware key authentication is <strong>enabled</strong>. You need your keyfile to log in.
                </AlertDescription>
              </Alert>

              {localKeyfile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="h-4 w-4" />
                  <span>Local keyfile: {localKeyfile.label}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSetupDialog(true)}
                >
                  Generate New Key
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowRevokeDialog(true)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Disable
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <ShieldWarning className="h-4 w-4" />
                <AlertDescription>
                  When enabled, you will need both your password AND your hardware keyfile to log in. 
                  Keep the keyfile on your home computer or a USB drive.
                </AlertDescription>
              </Alert>

              <Button onClick={() => setShowSetupDialog(true)}>
                <Usb className="h-4 w-4 mr-2" />
                Enable Hardware Key
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Usb className="h-5 w-5 text-primary" />
              Generate Hardware Key
            </DialogTitle>
            <DialogDescription>
              Create an encrypted keyfile for secure admin access
            </DialogDescription>
          </DialogHeader>

          {!generatedKeyfile ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Label</Label>
                <Input
                  value={keyLabel}
                  onChange={(e) => setKeyLabel(e.target.value)}
                  placeholder="e.g., Home PC, USB Backup"
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this keyfile
                </p>
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
                <p className="text-xs text-muted-foreground">
                  Required to encrypt the keyfile
                </p>
              </div>

              <Alert className="border-amber-500/30">
                <Warning className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Once enabled, you MUST have this keyfile to log in. 
                  If you lose it, you'll be locked out.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <AlertDescription>
                  Keyfile generated! Save it now.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadKeyfile}
                  className={hasDownloaded ? 'border-emerald-500/30 text-emerald-400' : ''}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {hasDownloaded ? 'Downloaded ✓' : 'Download for USB'}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleSaveLocally}
                  className={hasSavedLocally ? 'border-emerald-500/30 text-emerald-400' : ''}
                >
                  <Key className="h-4 w-4 mr-2" />
                  {hasSavedLocally ? 'Saved Locally ✓' : 'Save to This Computer'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Download to your USB drive for portable access, or save locally for automatic login on this computer.
              </p>
            </div>
          )}

          <DialogFooter>
            {!generatedKeyfile ? (
              <Button 
                onClick={handleGenerateKeyfile} 
                disabled={isGenerating || !password}
              >
                {isGenerating ? 'Generating...' : 'Generate Keyfile'}
              </Button>
            ) : (
              <Button 
                onClick={handleCompleteSetup}
                disabled={!hasDownloaded && !hasSavedLocally}
              >
                Complete Setup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Warning className="h-5 w-5" />
              Disable Hardware Key
            </DialogTitle>
            <DialogDescription>
              This will revoke your current keyfile and disable hardware key authentication.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-destructive/30">
            <AlertDescription>
              After disabling, you'll only need your password to log in. 
              Old keyfiles will no longer work.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeKeyfile}>
              Disable Hardware Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
