import { useKV } from '@/lib/local-storage-kv'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import type { AssetMetadata, UsagePolicy, AudienceMode } from '@/lib/asset-types'
import { ShieldCheck, UsersThree, Briefcase, Scales } from '@phosphor-icons/react'

export default function AssetUsagePolicyManager() {
  const [assets] = useKV<AssetMetadata[]>('asset-metadata', [])
  const [usagePolicy, setUsagePolicy] = useKV<UsagePolicy>('asset-usage-policy', {
    publicFlags: [],
    restrictedFlags: [],
    audienceSpecificFlags: {
      investors: [],
      legal: [],
      friends: [],
    },
  })
  
  const flagAssets = (assets || []).filter(a => a.category === 'flags')
  
  const isPublic = (assetId: string) => usagePolicy?.publicFlags.includes(assetId)
  const isRestricted = (assetId: string) => usagePolicy?.restrictedFlags.includes(assetId)
  const getAudiences = (assetId: string): AudienceMode[] => {
    const audiences: AudienceMode[] = []
    if (usagePolicy?.audienceSpecificFlags.investors.includes(assetId)) audiences.push('investors')
    if (usagePolicy?.audienceSpecificFlags.legal.includes(assetId)) audiences.push('legal')
    if (usagePolicy?.audienceSpecificFlags.friends.includes(assetId)) audiences.push('friends')
    return audiences
  }
  
  const togglePublic = (assetId: string) => {
    setUsagePolicy(current => {
      const policy = current || {
        publicFlags: [],
        restrictedFlags: [],
        audienceSpecificFlags: { investors: [], legal: [], friends: [] },
      }
      
      const isCurrentlyPublic = policy.publicFlags.includes(assetId)
      const publicFlags = isCurrentlyPublic
        ? policy.publicFlags.filter(id => id !== assetId)
        : [...policy.publicFlags, assetId]
      
      const restrictedFlags = policy.restrictedFlags.filter(id => id !== assetId)
      
      return { ...policy, publicFlags, restrictedFlags }
    })
    toast.success(isPublic(assetId) ? 'Asset restricted' : 'Asset made public')
  }
  
  const toggleRestricted = (assetId: string) => {
    setUsagePolicy(current => {
      const policy = current || {
        publicFlags: [],
        restrictedFlags: [],
        audienceSpecificFlags: { investors: [], legal: [], friends: [] },
      }
      
      const isCurrentlyRestricted = policy.restrictedFlags.includes(assetId)
      const restrictedFlags = isCurrentlyRestricted
        ? policy.restrictedFlags.filter(id => id !== assetId)
        : [...policy.restrictedFlags, assetId]
      
      const publicFlags = policy.publicFlags.filter(id => id !== assetId)
      
      return { ...policy, publicFlags, restrictedFlags }
    })
    toast.success(isRestricted(assetId) ? 'Asset unrestricted' : 'Asset restricted')
  }
  
  const toggleAudience = (assetId: string, audience: 'investors' | 'legal' | 'friends') => {
    setUsagePolicy(current => {
      const policy = current || {
        publicFlags: [],
        restrictedFlags: [],
        audienceSpecificFlags: { investors: [], legal: [], friends: [] },
      }
      
      const audiences = { ...policy.audienceSpecificFlags }
      const isCurrentlyEnabled = audiences[audience].includes(assetId)
      
      audiences[audience] = isCurrentlyEnabled
        ? audiences[audience].filter(id => id !== assetId)
        : [...audiences[audience], assetId]
      
      return { ...policy, audienceSpecificFlags: audiences }
    })
    toast.success(`${audience} access ${getAudiences(assetId).includes(audience) ? 'removed' : 'granted'}`)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Asset Usage Policy</h2>
        <p className="text-sm text-muted-foreground">
          Control which assets appear on public pages and in specific audience pathways
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-primary" />
            <h3 className="font-semibold">Public Assets</h3>
          </div>
          <div className="text-2xl font-bold">{usagePolicy?.publicFlags.length || 0}</div>
          <p className="text-xs text-muted-foreground">Shown to all visitors</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-destructive" />
            <h3 className="font-semibold">Restricted</h3>
          </div>
          <div className="text-2xl font-bold">{usagePolicy?.restrictedFlags.length || 0}</div>
          <p className="text-xs text-muted-foreground">Hidden from public pages</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UsersThree className="text-accent" />
            <h3 className="font-semibold">Audience-Specific</h3>
          </div>
          <div className="text-2xl font-bold">
            {(usagePolicy?.audienceSpecificFlags.investors.length || 0) + 
             (usagePolicy?.audienceSpecificFlags.legal.length || 0) + 
             (usagePolicy?.audienceSpecificFlags.friends.length || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Pathway controlled</p>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Flag Asset Permissions</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure which flag imagery appears in each audience pathway. By default, use flags only as subtle accents.
        </p>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {flagAssets.map(asset => (
              <Card key={asset.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 bg-muted rounded overflow-hidden shrink-0">
                    <img src={asset.filePath} alt={asset.fileName} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">{asset.fileName}</h4>
                      <div className="flex gap-1 mt-1">
                        {asset.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Public Pages</Label>
                        <Button
                          size="sm"
                          variant={isPublic(asset.id) ? 'default' : 'outline'}
                          onClick={() => togglePublic(asset.id)}
                        >
                          {isPublic(asset.id) ? 'Allowed' : 'Not Allowed'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Restrict from Public</Label>
                        <Button
                          size="sm"
                          variant={isRestricted(asset.id) ? 'destructive' : 'outline'}
                          onClick={() => toggleRestricted(asset.id)}
                        >
                          {isRestricted(asset.id) ? 'Restricted' : 'Not Restricted'}
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Audience Pathways</Label>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant={getAudiences(asset.id).includes('investors') ? 'default' : 'outline'}
                          onClick={() => toggleAudience(asset.id, 'investors')}
                          className="gap-1"
                        >
                          <Briefcase size={14} />
                          Investors
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={getAudiences(asset.id).includes('legal') ? 'default' : 'outline'}
                          onClick={() => toggleAudience(asset.id, 'legal')}
                          className="gap-1"
                        >
                          <Scales size={14} />
                          Legal
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={getAudiences(asset.id).includes('friends') ? 'default' : 'outline'}
                          onClick={() => toggleAudience(asset.id, 'friends')}
                          className="gap-1"
                        >
                          <UsersThree size={14} />
                          Friends
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>
      
      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold text-sm mb-2">Guidance</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Investors:</strong> Minimal branding accents, focus on product clarity</li>
          <li>• <strong>Legal:</strong> Most restrained visuals, emphasize document organization</li>
          <li>• <strong>Friends:</strong> Richer heritage/flag visuals allowed</li>
          <li>• <strong>Default:</strong> Use flag assets only as subtle accents (badges, watermarks) rather than dominant backgrounds</li>
        </ul>
      </Card>
    </div>
  )
}
