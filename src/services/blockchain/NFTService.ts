/**
 * NFTService - NFT Data Fetching and Management
 *
 * Uses Alchemy NFT API as primary source with fallback to direct contract calls
 */

import { ethers, Contract } from 'ethers';
import { NFT, NFTMetadata } from '../../types';
import { providerService } from './ProviderService';
import {
  ERC721_ABI,
  ERC1155_ABI,
  getAlchemyNFTEndpoint,
  ipfsToHttp,
  NFT_PAGE_SIZE,
  NFT_PLACEHOLDER_IMAGE,
} from '../../constants/nfts';

// Alchemy API Key - Replace with your own for production
const ALCHEMY_API_KEY = 'YOUR_ALCHEMY_API_KEY';

// Alchemy API Response Types
interface AlchemyNFT {
  contract: {
    address: string;
    name?: string;
    symbol?: string;
    tokenType: 'ERC721' | 'ERC1155';
  };
  tokenId: string;
  name?: string;
  description?: string;
  image?: {
    cachedUrl?: string;
    originalUrl?: string;
    thumbnailUrl?: string;
  };
  raw?: {
    metadata?: NFTMetadata;
  };
  balance?: string;
}

interface AlchemyResponse {
  ownedNfts: AlchemyNFT[];
  totalCount: number;
  pageKey?: string;
}

class NFTService {
  /**
   * Get all NFTs owned by an address using Alchemy API
   */
  async getNFTsForOwner(address: string, chainId: number): Promise<NFT[]> {
    const endpoint = getAlchemyNFTEndpoint(chainId);

    if (!endpoint || ALCHEMY_API_KEY === 'YOUR_ALCHEMY_API_KEY') {
      console.log('Alchemy API not configured, returning empty NFT list');
      return [];
    }

    try {
      const url = `${endpoint}/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=${NFT_PAGE_SIZE}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data: AlchemyResponse = await response.json();

      return data.ownedNfts.map((nft) => this.formatAlchemyNFT(nft, chainId));
    } catch (error) {
      console.error('Failed to fetch NFTs from Alchemy:', error);
      return [];
    }
  }

  /**
   * Format Alchemy NFT response to our NFT type
   */
  private formatAlchemyNFT(nft: AlchemyNFT, chainId: number): NFT {
    // Get best available image URL
    let imageUrl = nft.image?.cachedUrl || nft.image?.originalUrl || nft.image?.thumbnailUrl;

    // Fallback to raw metadata image
    if (!imageUrl && nft.raw?.metadata?.image) {
      imageUrl = ipfsToHttp(nft.raw.metadata.image);
    }

    // Use placeholder if no image
    if (!imageUrl) {
      imageUrl = NFT_PLACEHOLDER_IMAGE;
    }

    // Get animation URL if available
    let animationUrl: string | undefined;
    if (nft.raw?.metadata?.animation_url) {
      animationUrl = ipfsToHttp(nft.raw.metadata.animation_url);
    }

    return {
      contractAddress: nft.contract.address,
      tokenId: nft.tokenId,
      name: nft.name || nft.raw?.metadata?.name || `#${nft.tokenId}`,
      description: nft.description || nft.raw?.metadata?.description,
      imageUrl: ipfsToHttp(imageUrl),
      animationUrl,
      collectionName: nft.contract.name || 'Unknown Collection',
      chainId,
      tokenType: nft.contract.tokenType,
      balance: nft.balance || '1',
    };
  }

  /**
   * Get NFT metadata directly from contract (fallback method)
   */
  async getNFTMetadataFromContract(
    contractAddress: string,
    tokenId: string,
    tokenType: 'ERC721' | 'ERC1155',
    chainId: number
  ): Promise<NFTMetadata | null> {
    try {
      const provider = providerService.getProvider(chainId);
      const abi = tokenType === 'ERC721' ? ERC721_ABI : ERC1155_ABI;
      const contract = new Contract(contractAddress, abi, provider);

      let tokenURI: string;

      if (tokenType === 'ERC721') {
        tokenURI = await contract.tokenURI(tokenId);
      } else {
        tokenURI = await contract.uri(tokenId);
        // ERC1155 may have {id} placeholder
        tokenURI = tokenURI.replace('{id}', tokenId.padStart(64, '0'));
      }

      // Convert IPFS to HTTP
      const metadataUrl = ipfsToHttp(tokenURI);

      // Fetch metadata
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get NFT metadata from contract:', error);
      return null;
    }
  }

  /**
   * Get collection name from contract
   */
  async getCollectionName(
    contractAddress: string,
    chainId: number
  ): Promise<string> {
    try {
      const provider = providerService.getProvider(chainId);
      const contract = new Contract(contractAddress, ERC721_ABI, provider);
      return await contract.name();
    } catch {
      return 'Unknown Collection';
    }
  }

  /**
   * Check if an address owns a specific NFT
   */
  async ownsNFT(
    ownerAddress: string,
    contractAddress: string,
    tokenId: string,
    tokenType: 'ERC721' | 'ERC1155',
    chainId: number
  ): Promise<boolean> {
    try {
      const provider = providerService.getProvider(chainId);

      if (tokenType === 'ERC721') {
        const contract = new Contract(contractAddress, ERC721_ABI, provider);
        const owner = await contract.ownerOf(tokenId);
        return owner.toLowerCase() === ownerAddress.toLowerCase();
      } else {
        const contract = new Contract(contractAddress, ERC1155_ABI, provider);
        const balance = await contract.balanceOf(ownerAddress, tokenId);
        return balance > 0n;
      }
    } catch (error) {
      console.error('Failed to check NFT ownership:', error);
      return false;
    }
  }

  /**
   * Get ERC1155 balance for a specific token
   */
  async getERC1155Balance(
    ownerAddress: string,
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<string> {
    try {
      const provider = providerService.getProvider(chainId);
      const contract = new Contract(contractAddress, ERC1155_ABI, provider);
      const balance = await contract.balanceOf(ownerAddress, tokenId);
      return balance.toString();
    } catch {
      return '0';
    }
  }

  /**
   * Get explorer URL for NFT
   */
  getExplorerUrl(nft: NFT): string {
    const chainExplorers: Record<number, string> = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      11155111: 'https://sepolia.etherscan.io',
      80002: 'https://amoy.polygonscan.com',
    };

    const explorer = chainExplorers[nft.chainId];
    if (!explorer) return '';

    return `${explorer}/token/${nft.contractAddress}?a=${nft.tokenId}`;
  }

  /**
   * Get OpenSea URL for NFT (mainnet only)
   */
  getOpenSeaUrl(nft: NFT): string | null {
    if (nft.chainId === 1) {
      return `https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`;
    } else if (nft.chainId === 137) {
      return `https://opensea.io/assets/matic/${nft.contractAddress}/${nft.tokenId}`;
    }
    return null;
  }
}

export const nftService = new NFTService();
export default NFTService;
