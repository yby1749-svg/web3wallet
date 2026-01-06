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

// Sample NFTs for development/testing
const SAMPLE_NFTS: NFT[] = [
  {
    contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    tokenId: '1234',
    name: 'Bored Ape #1234',
    description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs.',
    imageUrl: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8mhs?w=500',
    collectionName: 'Bored Ape Yacht Club',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
    tokenId: '5678',
    name: 'Mutant Ape #5678',
    description: 'The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes.',
    imageUrl: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyY-Qkpgx5GJL8DZdOvNmcvCGwPfML-kU9YXAc8FZ1u?w=500',
    collectionName: 'Mutant Ape Yacht Club',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
    tokenId: '9012',
    name: 'Azuki #9012',
    description: 'Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden.',
    imageUrl: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500',
    collectionName: 'Azuki',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
    tokenId: '3456',
    name: 'CloneX #3456',
    description: 'CLONE X - X TAKASHI MURAKAMI',
    imageUrl: 'https://i.seadn.io/gae/XN0XuD8Uj3GBC5EPfRBN3k46F-n7Vb4KYXPX4KkVdpkc7N-V8f5EbEXjOqoF6K6D0LuC_Ld1MjdAOrhYZlZQTk8V9wuYVW1Y9rU?w=500',
    collectionName: 'CloneX',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
    tokenId: '7890',
    name: 'Doodle #7890',
    description: 'A community-driven collectibles project featuring art by Burnt Toast.',
    imageUrl: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500',
    collectionName: 'Doodles',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x23581767a106ae21c074b2276D25e5C3e136a68b',
    tokenId: '2468',
    name: 'Moonbird #2468',
    description: 'A collection of 10,000 utility-enabled PFPs that feature a richly diverse and unique collection of owls.',
    imageUrl: 'https://i.seadn.io/gae/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5OLuyO3Z5PpJFSwdm7rq-TikAh7f5eUw338A2cy6HRH75?w=500',
    collectionName: 'Moonbirds',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
    tokenId: '1357',
    name: 'Meebits #1357',
    description: 'The Meebits are 20,000 unique 3D voxel characters.',
    imageUrl: 'https://i.seadn.io/gae/d784iHHbqQFVH1XYD6HoT4u3y_Fsu_9FZUltWjnOzoYv7qqB5dLUqpGyHBd8Gq3h4mykK5Enj8pxqOUorgD2PfIWcVj9ugvu8l0?w=500',
    collectionName: 'Meebits',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x1A92f7381B9F03921564a437210bB9396471050C',
    tokenId: '4321',
    name: 'Cool Cat #4321',
    description: 'Cool Cats is a collection of 9,999 randomly generated and stylistically curated NFTs.',
    imageUrl: 'https://i.seadn.io/gae/LIov33kogXOK4XZd2ESj29sqm_Hww5JSdO7AFn5LpKax-CYHDhGCAdHOIItBixeHKNuKsJ1drHlEmJrhqYCP1X7D_SPw5bO2k-pH?w=500',
    collectionName: 'Cool Cats',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x394E3d3044fC89fCDd966D3cb35Ac0536A002753',
    tokenId: '8642',
    name: 'Renga #8642',
    description: 'RENGA is a hand-drawn collection of 10,000 characters by artist DirtyRobot.',
    imageUrl: 'https://i.seadn.io/gcs/files/4fde144c3f5a3b97dd09799f7cc93c93.png?w=500',
    collectionName: 'RENGA',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
  {
    contractAddress: '0x764AeebcF425d56800eF2c84F2578689415a2DAa',
    tokenId: '999',
    name: 'Pudgy Penguin #999',
    description: 'Pudgy Penguins is a collection of 8,888 NFTs.',
    imageUrl: 'https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500',
    collectionName: 'Pudgy Penguins',
    chainId: 1,
    tokenType: 'ERC721',
    balance: '1',
  },
];

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
      console.log('Alchemy API not configured, returning sample NFTs');
      return SAMPLE_NFTS;
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
