import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Offering, OfferingPriceTier, OfferingCategory, OfferingPricing, OfferingVisibility } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, Pencil, Trash, Star, Eye, EyeSlash, 
  CurrencyDollar, Package, Globe, FileText, Code, Headset,
  ArrowsDownUp, CopySimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

const categoryOptions: { value: OfferingCategory; label: string; icon: any }[] = [
  { value: 'digital', label: 'Digital Product', icon: Code },
  { value: 'service', label: 'Professional Service', icon: FileText },
  { value: 'whitelabel', label: 'White-Label Solution', icon: Globe },
  { value: 'subscription', label: 'Subscription/Retainer', icon: Headset },
]

const pricingOptions: { value: OfferingPricing; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid (set price tiers)' },
  { value: 'donation', label: 'Free with Donation Option' },
  { value: 'contact', label: 'Contact for Quote' },
]

const visibilityOptions: { value: OfferingVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
]

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function OfferingsManager() {
  const [offerings, setOfferings] = useKV<Offering[]>('founder-hub-offerings', [])
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { currentUser } = useAuth()

  const handleAdd = () => {
    const now = Date.now()
    const newOffering: Offering = {
      id: `offer_${now}`,
      title: '',
      slug: '',
      summary: '',
      description: '',
      category: 'digital',
      pricingType: 'paid',
      priceTiers: [
        {
          id: `tier_${now}`,
          name: 'Standard',
          price: 0,
          currency: 'USD',
          description: '',
          features: [],
        }
      ],
      tags: [],
      featured: false,
      order: (offerings?.length || 0) + 1,
      visibility: 'public',
      gratuityEnabled: false,
      createdAt: now,
      updatedAt: now
    }
    setEditingOffering(newOffering)
    setIsDialogOpen(true)
  }

  const handleEdit = (offering: Offering) => {
    setEditingOffering({ ...offering })
    setIsDialogOpen(true)
  }

  const handleDuplicate = async (offering: Offering) => {
    const now = Date.now()
    const duplicated: Offering = {
      ...offering,
      id: `offer_${now}`,
      title: `${offering.title} (Copy)`,
      slug: `${offering.slug}-copy`,
      order: (offerings?.length || 0) + 1,
      createdAt: now,
      updatedAt: now
    }
    setOfferings([...(offerings || []), duplicated])
    toast.success('Offering duplicated')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this offering? This cannot be undone.')) return
    
    const offering = offerings?.find(o => o.id === id)
    setOfferings((offerings || []).filter(o => o.id !== id))
    
    if (currentUser && offering) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'delete_offering',
        `Deleted offering: ${offering.title}`,
        'offering',
        id
      )
    }
    
    toast.success('Offering deleted')
  }

  const handleToggleFeatured = async (offering: Offering) => {
    setOfferings(
      (offerings || []).map(o =>
        o.id === offering.id ? { ...o, featured: !o.featured, updatedAt: Date.now() } : o
      )
    )
    toast.success(offering.featured ? 'Removed from featured' : 'Added to featured')
  }

  const handleSave = async () => {
    if (!editingOffering) return
    
    if (!editingOffering.title.trim()) {
      toast.error('Title is required')
      return
    }

    // Auto-generate slug if empty
    if (!editingOffering.slug.trim()) {
      editingOffering.slug = generateSlug(editingOffering.title)
    }

    const now = Date.now()
    const isNew = !offerings?.find(o => o.id === editingOffering.id)
    
    if (isNew) {
      setOfferings([...(offerings || []), { ...editingOffering, updatedAt: now }])
    } else {
      setOfferings(
        (offerings || []).map(o =>
          o.id === editingOffering.id ? { ...editingOffering, updatedAt: now } : o
        )
      )
    }

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        isNew ? 'create_offering' : 'update_offering',
        `${isNew ? 'Created' : 'Updated'} offering: ${editingOffering.title}`,
        'offering',
        editingOffering.id
      )
    }

    toast.success(`Offering ${isNew ? 'created' : 'updated'}`)
    setIsDialogOpen(false)
    setEditingOffering(null)
  }

  const handleAddPriceTier = () => {
    if (!editingOffering) return
    const now = Date.now()
    setEditingOffering({
      ...editingOffering,
      priceTiers: [
        ...editingOffering.priceTiers,
        {
          id: `tier_${now}`,
          name: '',
          price: 0,
          currency: 'USD',
          description: '',
          features: [],
        }
      ]
    })
  }

  const handleRemovePriceTier = (tierId: string) => {
    if (!editingOffering) return
    if (editingOffering.priceTiers.length <= 1) {
      toast.error('At least one price tier is required')
      return
    }
    setEditingOffering({
      ...editingOffering,
      priceTiers: editingOffering.priceTiers.filter(t => t.id !== tierId)
    })
  }

  const handleUpdatePriceTier = (tierId: string, updates: Partial<OfferingPriceTier>) => {
    if (!editingOffering) return
    setEditingOffering({
      ...editingOffering,
      priceTiers: editingOffering.priceTiers.map(t =>
        t.id === tierId ? { ...t, ...updates } : t
      )
    })
  }

  const sortedOfferings = [...(offerings || [])].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offerings Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage products, services, and subscription offerings
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Offering
        </Button>
      </div>

      {sortedOfferings.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No offerings yet</p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Offering
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {sortedOfferings.map((offering) => {
            const catOption = categoryOptions.find(c => c.value === offering.category)
            const CatIcon = catOption?.icon || Package
            
            return (
              <GlassCard key={offering.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    <CatIcon className="h-6 w-6" weight="duotone" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{offering.title || 'Untitled'}</h3>
                      {offering.featured && (
                        <Star className="h-4 w-4 text-amber-400 shrink-0" weight="fill" />
                      )}
                      <Badge variant={offering.visibility === 'public' ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {offering.visibility}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {offering.summary || 'No summary'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">{catOption?.label || offering.category}</Badge>
                      <Badge variant="outline" className="capitalize">{offering.pricingType}</Badge>
                      {offering.priceTiers.length > 0 && (
                        <span className="text-muted-foreground">
                          <CurrencyDollar className="h-3 w-3 inline mr-1" />
                          {offering.priceTiers.length} tier{offering.priceTiers.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleToggleFeatured(offering)}
                    >
                      <Star className="h-4 w-4" weight={offering.featured ? 'fill' : 'regular'} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(offering)}
                    >
                      <CopySimple className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(offering)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => handleDelete(offering.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingOffering && offerings?.find(o => o.id === editingOffering.id)
                ? 'Edit Offering'
                : 'New Offering'
              }
            </DialogTitle>
          </DialogHeader>
          
          {editingOffering && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={editingOffering.title}
                        onChange={(e) => setEditingOffering({ ...editingOffering, title: e.target.value })}
                        placeholder="e.g., White-Label Web Creator"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={editingOffering.slug}
                        onChange={(e) => setEditingOffering({ ...editingOffering, slug: e.target.value })}
                        placeholder="auto-generated from title"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Input
                      id="summary"
                      value={editingOffering.summary}
                      onChange={(e) => setEditingOffering({ ...editingOffering, summary: e.target.value })}
                      placeholder="Brief one-line description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={editingOffering.description}
                      onChange={(e) => setEditingOffering({ ...editingOffering, description: e.target.value })}
                      placeholder="Detailed description with benefits and features"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Category & Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={editingOffering.category}
                      onValueChange={(v: OfferingCategory) => setEditingOffering({ ...editingOffering, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pricing Type</Label>
                    <Select
                      value={editingOffering.pricingType}
                      onValueChange={(v: OfferingPricing) => setEditingOffering({ ...editingOffering, pricingType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Tiers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Price Tiers</Label>
                    <Button variant="outline" size="sm" onClick={handleAddPriceTier}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tier
                    </Button>
                  </div>
                  
                  {editingOffering.priceTiers.map((tier, idx) => (
                    <Card key={tier.id} className="p-4">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Tier Name</Label>
                          <Input
                            value={tier.name}
                            onChange={(e) => handleUpdatePriceTier(tier.id, { name: e.target.value })}
                            placeholder="e.g., Starter"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Price (cents)</Label>
                          <Input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handleUpdatePriceTier(tier.id, { price: parseInt(e.target.value) || 0 })}
                            placeholder="0 for free"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={tier.description || ''}
                            onChange={(e) => handleUpdatePriceTier(tier.id, { description: e.target.value })}
                            placeholder="Brief tier description"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tier.isRecurring || false}
                              onCheckedChange={(checked) => handleUpdatePriceTier(tier.id, { isRecurring: checked })}
                            />
                            <Label className="text-xs">Recurring</Label>
                          </div>
                          {tier.isRecurring && (
                            <Select
                              value={tier.recurringInterval || 'month'}
                              onValueChange={(v: 'month' | 'year') => handleUpdatePriceTier(tier.id, { recurringInterval: v })}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="year">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemovePriceTier(tier.id)}
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <div className="mt-3 space-y-1">
                        <Label className="text-xs">Stripe Payment Link (optional)</Label>
                        <Input
                          value={tier.stripePaymentLink || ''}
                          onChange={(e) => handleUpdatePriceTier(tier.id, { stripePaymentLink: e.target.value })}
                          placeholder="https://buy.stripe.com/..."
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Donation & Gratuity */}
                {(editingOffering.pricingType === 'donation' || editingOffering.pricingType === 'paid') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingOffering.gratuityEnabled || false}
                        onCheckedChange={(checked) => setEditingOffering({ ...editingOffering, gratuityEnabled: checked })}
                      />
                      <Label>Enable gratuity/tips</Label>
                    </div>
                    
                    {(editingOffering.pricingType === 'donation' || editingOffering.gratuityEnabled) && (
                      <div className="space-y-2">
                        <Label className="text-xs">Suggested donation amounts (cents, comma-separated)</Label>
                        <Input
                          value={editingOffering.donationSuggestions?.join(', ') || ''}
                          onChange={(e) => {
                            const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
                            setEditingOffering({ ...editingOffering, donationSuggestions: values })
                          }}
                          placeholder="500, 1000, 2500, 5000"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="turnaround">Turnaround Time</Label>
                    <Input
                      id="turnaround"
                      value={editingOffering.turnaround || ''}
                      onChange={(e) => setEditingOffering({ ...editingOffering, turnaround: e.target.value })}
                      placeholder="e.g., 3-5 business days"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactCTA">Custom Contact Button Text</Label>
                    <Input
                      id="contactCTA"
                      value={editingOffering.contactCTA || ''}
                      onChange={(e) => setEditingOffering({ ...editingOffering, contactCTA: e.target.value })}
                      placeholder="e.g., Request Quote"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={editingOffering.tags?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      setEditingOffering({ ...editingOffering, tags })
                    }}
                    placeholder="e.g., web development, white-label, agency"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="externalUrl">External URL</Label>
                    <Input
                      id="externalUrl"
                      value={editingOffering.externalUrl || ''}
                      onChange={(e) => setEditingOffering({ ...editingOffering, externalUrl: e.target.value })}
                      placeholder="Link to checkout or landing page"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="downloadUrl">Download URL (for digital products)</Label>
                    <Input
                      id="downloadUrl"
                      value={editingOffering.downloadUrl || ''}
                      onChange={(e) => setEditingOffering({ ...editingOffering, downloadUrl: e.target.value })}
                      placeholder="Direct download link"
                    />
                  </div>
                </div>

                {/* Visibility & Display */}
                <div className="flex items-center gap-6">
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select
                      value={editingOffering.visibility}
                      onValueChange={(v: OfferingVisibility) => setEditingOffering({ ...editingOffering, visibility: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilityOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={editingOffering.featured}
                      onCheckedChange={(checked) => setEditingOffering({ ...editingOffering, featured: checked })}
                    />
                    <Label>Featured offering</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={editingOffering.order}
                      onChange={(e) => setEditingOffering({ ...editingOffering, order: parseInt(e.target.value) || 1 })}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Offering
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
