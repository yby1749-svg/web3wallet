/**
 * PinataService - IPFS Upload via Pinata
 *
 * Handles image and metadata uploads to IPFS using Pinata API
 */

// Pinata API Configuration
// Replace with your own keys from https://app.pinata.cloud/
const PINATA_API_KEY = 'YOUR_PINATA_API_KEY';
const PINATA_SECRET_KEY = 'YOUR_PINATA_SECRET_KEY';
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// NFT Metadata Interface
export interface NFTMetadataInput {
  name: string;
  description: string;
  image: string; // IPFS hash or URL
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Upload Response
export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

class PinataService {
  private apiKey: string;
  private secretKey: string;

  constructor() {
    this.apiKey = PINATA_API_KEY;
    this.secretKey = PINATA_SECRET_KEY;
  }

  /**
   * Check if Pinata is configured
   */
  isConfigured(): boolean {
    return (
      this.apiKey !== 'YOUR_PINATA_API_KEY' &&
      this.secretKey !== 'YOUR_PINATA_SECRET_KEY'
    );
  }

  /**
   * Upload image file to IPFS
   * @param imageUri - Local file URI (file:// or content://)
   * @param filename - Original filename
   */
  async uploadImage(imageUri: string, filename: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Pinata API not configured');
    }

    try {
      // Create form data
      const formData = new FormData();

      // Determine file type from extension
      const extension = filename.split('.').pop()?.toLowerCase() || 'png';
      const mimeType = this.getMimeType(extension);

      // Add file to form data
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);

      // Add pinata metadata
      formData.append(
        'pinataMetadata',
        JSON.stringify({
          name: filename,
        })
      );

      // Upload to Pinata
      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${error}`);
      }

      const result: PinataUploadResponse = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Failed to upload image to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload NFT metadata JSON to IPFS
   * @param metadata - NFT metadata object
   */
  async uploadMetadata(metadata: NFTMetadataInput): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Pinata API not configured');
    }

    try {
      const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name}-metadata.json`,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata metadata upload failed: ${error}`);
      }

      const result: PinataUploadResponse = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('Failed to upload metadata to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload image and create metadata in one step
   * @param imageUri - Local image URI
   * @param name - NFT name
   * @param description - NFT description
   * @param attributes - Optional attributes
   */
  async uploadNFTData(
    imageUri: string,
    name: string,
    description: string,
    attributes?: Array<{ trait_type: string; value: string | number }>
  ): Promise<{ imageHash: string; metadataHash: string; tokenURI: string }> {
    // 1. Upload image
    const filename = `${name.replace(/\s+/g, '-')}-${Date.now()}.png`;
    const imageHash = await this.uploadImage(imageUri, filename);

    // 2. Create and upload metadata
    const metadata: NFTMetadataInput = {
      name,
      description,
      image: `ipfs://${imageHash}`,
      attributes: attributes || [],
    };

    const metadataHash = await this.uploadMetadata(metadata);

    return {
      imageHash,
      metadataHash,
      tokenURI: `ipfs://${metadataHash}`,
    };
  }

  /**
   * Get IPFS gateway URL for hash
   */
  getGatewayUrl(ipfsHash: string): string {
    return `${PINATA_GATEWAY}${ipfsHash}`;
  }

  /**
   * Convert ipfs:// URI to gateway URL
   */
  ipfsToHttp(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      return `${PINATA_GATEWAY}${ipfsUri.slice(7)}`;
    }
    return ipfsUri;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[extension] || 'image/png';
  }

  /**
   * Test Pinata connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const pinataService = new PinataService();
export default PinataService;
