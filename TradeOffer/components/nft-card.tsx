import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface NFTCardProps {
  tokenId: number
  metadata: {
    name?: string
    description?: string
    image?: string
    attributes?: Array<{ trait_type: string; value: string }>
  }
}

export default function NFTCard({ tokenId, metadata }: NFTCardProps) {
  // Handle missing metadata
  const name = metadata?.name || `Token #${tokenId}`
  const description = metadata?.description || "No description available"

  // Format image URL (handle IPFS URLs)
  const formatImageUrl = (url?: string) => {
    if (!url) return "/placeholder.svg?height=300&width=300"
    if (url.startsWith("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
    return url
  }

  const imageUrl = formatImageUrl(metadata?.image)

  return (
    <Card className="overflow-hidden bg-gray-800/70 border-gray-700 hover:border-purple-500 transition-all">
      <div className="aspect-square overflow-hidden bg-gray-900">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=300&width=300"
          }}
        />
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="outline" className="bg-purple-900/50 text-purple-200 border-purple-500">
            #{tokenId}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
      </CardContent>
      {metadata?.attributes && metadata.attributes.length > 0 && (
        <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
          {metadata.attributes.slice(0, 3).map((attr, index) => (
            <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
              {attr.trait_type}: {attr.value}
            </Badge>
          ))}
          {metadata.attributes.length > 3 && (
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              +{metadata.attributes.length - 3} more
            </Badge>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

