import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import type { AssetMetadata, FlagGallerySettings } from '@/lib/asset-types'
import { motion } from 'framer-motion'

export default function HeritageFlagsSection() {
  const [assets] = useKV<AssetMetadata[]>('asset-metadata', [])
  const [gallerySettings] = useKV<FlagGallerySettings>('flag-gallery-settings', {
    enabled: false,
    enabledForAudiences: ['friends'],
    title: 'Heritage Flags',
    description: 'A collection of historical American flags representing key moments in the nation\'s founding and development.',
    flagAssetIds: [],
  })
  
  const [audienceMode] = useKV<string>('current-audience-mode', 'all')
  
  if (!gallerySettings?.enabled) return null
  
  if (!gallerySettings.enabledForAudiences.includes(audienceMode as any) && audienceMode !== 'all') {
    return null
  }
  
  const flagsToDisplay = (assets || [])
    .filter(asset => 
      asset.category === 'flags' && 
      (gallerySettings.flagAssetIds.length === 0 || gallerySettings.flagAssetIds.includes(asset.id))
    )
    .slice(0, 6)
  
  if (flagsToDisplay.length === 0) return null
  
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {gallerySettings.title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {gallerySettings.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {flagsToDisplay.map((flag, idx) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="aspect-[3/2] bg-muted rounded-lg overflow-hidden mb-3">
                    <img 
                      src={flag.filePath} 
                      alt={flag.tags.join(', ')}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">
                      {flag.tags[0] || flag.fileName}
                    </h3>
                    {flag.tags.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {flag.tags.slice(1).join(', ')}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {gallerySettings.flagAssetIds.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              Configure flag selection in Admin → Usage Policy
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
