import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { CheckCircle, XCircle, ArrowLeft, Package, Receipt } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface CheckoutResultProps {
  status: 'success' | 'cancel'
  onBack: () => void
}

export default function CheckoutResult({ status, onBack }: CheckoutResultProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  useEffect(() => {
    // Extract session_id from URL if present
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('session_id')
    if (sid) {
      setSessionId(sid)
    }
  }, [])

  const isSuccess = status === 'success'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <GlassCard intensity="high" className="p-8 text-center">
          <div className={`
            w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center
            ${isSuccess 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/20 text-amber-400'
            }
          `}>
            {isSuccess ? (
              <CheckCircle className="h-10 w-10" weight="fill" />
            ) : (
              <XCircle className="h-10 w-10" weight="fill" />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {isSuccess ? 'Payment Successful!' : 'Checkout Cancelled'}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {isSuccess 
              ? 'Thank you for your purchase. You will receive a confirmation email shortly.'
              : 'Your checkout was cancelled. No payment was processed.'}
          </p>

          {isSuccess && sessionId && (
            <div className="mb-6 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Receipt className="h-4 w-4" />
                <span className="font-mono">Session: {sessionId.slice(0, 20)}...</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {isSuccess && (
              <GlassButton 
                variant="glassAccent" 
                className="w-full justify-center gap-2"
                onClick={() => {
                  // You could link to a downloads page or dashboard here
                  onBack()
                }}
              >
                <Package className="h-4 w-4" />
                View My Purchases
              </GlassButton>
            )}
            
            <GlassButton 
              variant="glass" 
              className="w-full justify-center gap-2"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </GlassButton>
          </div>

          {isSuccess && (
            <p className="mt-6 text-xs text-muted-foreground">
              Questions? Contact <a href="mailto:support@devon-tyler.com" className="text-primary hover:underline">support@devon-tyler.com</a>
            </p>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
