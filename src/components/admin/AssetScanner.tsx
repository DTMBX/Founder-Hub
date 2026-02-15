import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { scanAssets, generateSuggestions, generateUsageReport } from '@/lib/asset-scanner'
import type { AssetMetadata, AssetCategory, ThemeSuitability, ColorTreatment } from '@/lib/asset-types'
import { MagnifyingGlass, ArrowsClockwise, Image as ImageIcon, Flag, Trademark, Cube, MapTrifold, Sparkle, CheckCircle, Warning, Info } from '@phosphor-icons/react'

export default function AssetScanner() {
  const [assets, setAssets] = useKV<AssetMetadata[]>('asset-metadata', [])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetMetadata | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all')
  
  const handleScan = async () => {
    setIsScanning(true)
    try {
      const scannedAssets = await scanAssets()
      
      const mergedAssets = scannedAssets.map(scanned => {
        const existing = (assets || []).find(a => a.filePath === scanned.filePath)
        if (existing) {
          return {
            ...scanned,
            tags: existing.tags,
            themeSuitability: existing.themeSuitability,
            usageIntent: existing.usageIntent,
            colorTreatment: existing.colorTreatment,
            licensingNotes: existing.licensingNotes,
            sourceNotes: existing.sourceNotes,
            isPrimaryBrandMark: existing.isPrimaryBrandMark,
            isSecondaryBrandMark: existing.isSecondaryBrandMark,
            allowedAudiences: existing.allowedAudiences,
            whereUsed: existing.whereUsed,
          }
        }
        return scanned
      })
      
      setAssets(mergedAssets)
      toast.success(`Found ${mergedAssets.length} assets`)
    } catch (error) {
      toast.error('Failed to scan assets')
      console.error(error)
    } finally {
      setIsScanning(false)
    }
  }
  
  useEffect(() => {
    if (!assets || assets.length === 0) {
      handleScan()
    }
  }, [])
  
  const filteredAssets = (assets || []).filter(asset => {
    const matchesSearch = searchQuery === '' || 
      asset.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })
  
  const categoryIcons = {
    flags: Flag,
    logos: Trademark,
    icons: Cube,
    backgrounds: Sparkle,
    maps: MapTrifold,
    other: ImageIcon,
  }
  
  const categoryColors = {
    flags: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    logos: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icons: 'bg-green-500/10 text-green-500 border-green-500/20',
    backgrounds: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    maps: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  }
  
  const report = generateUsageReport(assets || [])
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asset Scanner</h2>
          <p className="text-sm text-muted-foreground">
            Discover and manage all visual assets across the site
          </p>
        </div>
        <Button onClick={handleScan} disabled={isScanning} className="gap-2">
          <ArrowsClockwise className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning...' : 'Scan Assets'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{assets?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Assets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{report.usedOnPublicLanding.length}</div>
          <div className="text-sm text-muted-foreground">Used on Landing</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{report.unusedAssets.length}</div>
          <div className="text-sm text-muted-foreground">Unused Assets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{report.oversizedAssets.length}</div>
          <div className="text-sm text-muted-foreground text-destructive">Oversized</div>
        </Card>
      </div>
      
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AssetCategory | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="flags">Flags</SelectItem>
              <SelectItem value="logos">Logos</SelectItem>
              <SelectItem value="icons">Icons</SelectItem>
              <SelectItem value="backgrounds">Backgrounds</SelectItem>
              <SelectItem value="maps">Maps</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {filteredAssets.map(asset => {
                const Icon = categoryIcons[asset.category]
                const suggestions = generateSuggestions(asset)
                const hasSuggestions = suggestions.length > 0
                
                return (
                  <Card
                    key={asset.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedAsset?.id === asset.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                      {asset.format === 'mp4' ? (
                        <video src={asset.filePath} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={asset.filePath} alt={asset.fileName} className="w-full h-full object-contain" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate flex-1">{asset.fileName}</h3>
                        {hasSuggestions && (
                          <Info size={16} className="text-primary shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`gap-1 ${categoryColors[asset.category]}`}>
                          <Icon size={12} />
                          {asset.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {asset.format.toUpperCase()}
                        </Badge>
                        {asset.dimensions && (
                          <Badge variant="outline" className="text-xs">
                            {asset.dimensions.width}×{asset.dimensions.height}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {(asset.fileSize / 1024).toFixed(1)} KB
                      </div>
                      
                      {asset.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {asset.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
        
        <div className="lg:col-span-1">
          {selectedAsset ? (
            <AssetEditor
              asset={selectedAsset}
              onSave={(updated) => {
                setAssets(prev => (prev || []).map(a => a.id === updated.id ? updated : a))
                setSelectedAsset(updated)
                toast.success('Asset metadata updated')
              }}
            />
          ) : (
            <Card className="p-8 flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <ImageIcon size={48} weight="thin" className="mx-auto mb-4 opacity-20" />
                <p>Select an asset to edit metadata</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

interface AssetEditorProps {
  asset: AssetMetadata
  onSave: (asset: AssetMetadata) => void
}

function AssetEditor({ asset, onSave }: AssetEditorProps) {
  const [editedAsset, setEditedAsset] = useState<AssetMetadata>(asset)
  const suggestions = generateSuggestions(asset)
  
  useEffect(() => {
    setEditedAsset(asset)
  }, [asset])
  
  const handleSave = () => {
    onSave(editedAsset)
  }
  
  const suggestionIcons = {
    placement: Info,
    optimization: Warning,
    warning: Warning,
  }
  
  const suggestionColors = {
    placement: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    optimization: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    warning: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  
  return (
    <Card className="p-4">
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Preview</h3>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {asset.format === 'mp4' ? (
                <video src={asset.filePath} className="w-full h-full object-cover" muted loop autoPlay />
              ) : (
                <img src={asset.filePath} alt={asset.fileName} className="w-full h-full object-contain" />
              )}
            </div>
          </div>
          
          <Separator />
          
          <Tabs defaultValue="metadata">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metadata" className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={editedAsset.category}
                  onValueChange={(v) => setEditedAsset(prev => ({ ...prev, category: v as AssetCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flags">Flags</SelectItem>
                    <SelectItem value="logos">Logos/Marks</SelectItem>
                    <SelectItem value="icons">Icons</SelectItem>
                    <SelectItem value="backgrounds">Backgrounds</SelectItem>
                    <SelectItem value="maps">Maps</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Theme Suitability</Label>
                <Select
                  value={editedAsset.themeSuitability}
                  onValueChange={(v) => setEditedAsset(prev => ({ ...prev, themeSuitability: v as ThemeSuitability }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Theme</SelectItem>
                    <SelectItem value="dark">Dark Theme</SelectItem>
                    <SelectItem value="both">Both Themes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Color Treatment</Label>
                <Select
                  value={editedAsset.colorTreatment}
                  onValueChange={(v) => setEditedAsset(prev => ({ ...prev, colorTreatment: v as ColorTreatment }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original Colors</SelectItem>
                    <SelectItem value="monochrome-white">Monochrome White</SelectItem>
                    <SelectItem value="monochrome-muted">Monochrome Muted</SelectItem>
                    <SelectItem value="accent-tinted">Accent Tinted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={editedAsset.tags.join(', ')}
                  onChange={(e) => setEditedAsset(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  }))}
                  placeholder="heritage, patriotic, historical"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Brand Marks</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editedAsset.isPrimaryBrandMark}
                      onCheckedChange={(checked) => setEditedAsset(prev => ({ ...prev, isPrimaryBrandMark: checked }))}
                    />
                    <Label className="text-sm">Primary</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editedAsset.isSecondaryBrandMark}
                      onCheckedChange={(checked) => setEditedAsset(prev => ({ ...prev, isSecondaryBrandMark: checked }))}
                    />
                    <Label className="text-sm">Secondary</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Licensing Notes</Label>
                <Textarea
                  value={editedAsset.licensingNotes || ''}
                  onChange={(e) => setEditedAsset(prev => ({ ...prev, licensingNotes: e.target.value }))}
                  placeholder="Public domain, CC-BY, proprietary..."
                  rows={2}
                />
              </div>
              
              <div>
                <Label>Source Notes</Label>
                <Textarea
                  value={editedAsset.sourceNotes || ''}
                  onChange={(e) => setEditedAsset(prev => ({ ...prev, sourceNotes: e.target.value }))}
                  placeholder="Created in-house, sourced from..."
                  rows={2}
                />
              </div>
              
              <Button onClick={handleSave} className="w-full">
                <CheckCircle className="mr-2" />
                Save Changes
              </Button>
            </TabsContent>
            
            <TabsContent value="suggestions" className="space-y-3 mt-4">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, idx) => {
                  const Icon = suggestionIcons[suggestion.type]
                  return (
                    <Card key={idx} className={`p-3 ${suggestionColors[suggestion.type]}`}>
                      <div className="flex gap-2">
                        <Icon className="shrink-0 mt-0.5" size={16} />
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{suggestion.suggestion}</p>
                          <p className="text-xs opacity-80">{suggestion.reason}</p>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.confidence} confidence
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No suggestions for this asset</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </Card>
  )
}
