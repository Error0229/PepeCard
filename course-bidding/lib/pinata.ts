// Pinata service for IPFS file hosting

// Get the JWT from environment variables
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || ""

// Interface for upload response
export interface PinataUploadResponse {
  id: string
  name: string
  cid: string
  size: number
  number_of_files: number
  mime_type: string
  group_id: null
}

/**
 * Upload a file to IPFS via Pinata
 * @param file The file to upload
 * @param name Optional name for the file
 * @returns The IPFS response including the hash (CID)
 */
export async function uploadFileToPinata(file: File, name?: string): Promise<PinataUploadResponse> {
  try {
    const formData = new FormData()

    // Add the file to the form data
    formData.append("file", file)

    // Set the file name if provided
    if (name) {
      formData.append("name", name)
    }

    // Set to public network
    formData.append("network", "public")

    // Make the request to Pinata
    const response = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        'Access-Control-Allow-Origin': '*',

      },
      body: formData,
    })

    // Parse the response
    const data = await response.json()

    // Check for errors
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload to Pinata")
    }

    return data.data
  } catch (error) {
    console.error("Error uploading to Pinata:", error)
    throw error
  }
}

/**
 * Generate a metadata object for a course
 * @param name Course name
 * @param description Course description
 * @param materialsCid IPFS CID of course materials (optional)
 * @returns JSON metadata string
 */
export function generateCourseMetadata(name: string, description: string, materialsCid?: string): string {
  const metadata = {
    name,
    description,
    materials: materialsCid ? `ipfs://${materialsCid}` : undefined,
    created: new Date().toISOString(),
  }

  return JSON.stringify(metadata)
}

/**
 * Upload metadata to IPFS via Pinata
 * @param metadata The metadata object
 * @param name Name for the metadata file
 * @returns The IPFS response including the hash (CID)
 */
export async function uploadMetadataToPinata(metadata: any, name: string): Promise<PinataUploadResponse> {
  try {
    // Convert metadata to JSON string if it's not already
    const metadataStr = typeof metadata === "string" ? metadata : JSON.stringify(metadata)

    // Create a file from the metadata
    const file = new File([metadataStr], `${name}.json`, { type: "application/json" })

    // Upload the file
    return await uploadFileToPinata(file, name)
  } catch (error) {
    console.error("Error uploading metadata to Pinata:", error)
    throw error
  }
}

/**
 * Get the IPFS gateway URL for a CID
 * @param cid The IPFS CID
 * @returns The gateway URL
 */
export function getIpfsGatewayUrl(cid: string): string {
  // Remove ipfs:// prefix if present
  const cleanCid = cid.replace("ipfs://", "")
  let pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud"
  return `https://${pinataGateway}/ipfs/${cleanCid}`
}

/**
 * Parse metadata URI to extract course information
 * @param metadataUri The metadata URI from the contract
 * @returns Parsed metadata or null if invalid
 */
export async function parseMetadataUri(metadataUri: string): Promise<any | null> {
  try {
    // Check if it's a JSON string
    if (metadataUri.startsWith("{")) {
      return JSON.parse(metadataUri)
    }

    // Check if it's an IPFS URI
    if (metadataUri.startsWith("ipfs://")) {
      const gatewayUrl = getIpfsGatewayUrl(metadataUri)
      const response = await fetch(gatewayUrl)
      return await response.json()
    }

    // Check if it's a gateway URL
    if (metadataUri.includes("/ipfs/")) {
      const response = await fetch(metadataUri)
      return await response.json()
    }

    return null
  } catch (error) {
    console.error("Error parsing metadata URI:", error)
    return null
  }
}
