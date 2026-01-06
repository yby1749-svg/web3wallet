/**
 * NFT Constants - ABIs and API Configuration
 */

// ERC721 ABI (minimal for NFT operations)
export const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
];

// ERC1155 ABI (minimal for NFT operations)
export const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function uri(uint256 id) view returns (string)',
];

// Alchemy NFT API endpoints by chain
export const ALCHEMY_NFT_ENDPOINTS: Record<number, string> = {
  1: 'https://eth-mainnet.g.alchemy.com/nft/v3',
  137: 'https://polygon-mainnet.g.alchemy.com/nft/v3',
  11155111: 'https://eth-sepolia.g.alchemy.com/nft/v3',
  80002: 'https://polygon-amoy.g.alchemy.com/nft/v3',
};

// IPFS Gateways (fallback list)
export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

// Default IPFS gateway
export const DEFAULT_IPFS_GATEWAY = IPFS_GATEWAYS[0];

// NFT Token Standards
export type NFTStandard = 'ERC721' | 'ERC1155';

// Placeholder image for NFTs without images
export const NFT_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300?text=NFT';

// Maximum NFTs to load per request
export const NFT_PAGE_SIZE = 50;

/**
 * Convert IPFS URI to HTTP URL
 */
export function ipfsToHttp(uri: string): string {
  if (!uri) return '';

  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    return `${DEFAULT_IPFS_GATEWAY}${uri.slice(7)}`;
  }

  // Handle ipfs/Qm... format
  if (uri.startsWith('ipfs/')) {
    return `${DEFAULT_IPFS_GATEWAY}${uri.slice(5)}`;
  }

  // Handle Qm... CID directly
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `${DEFAULT_IPFS_GATEWAY}${uri}`;
  }

  // Already HTTP URL
  return uri;
}

/**
 * Get Alchemy NFT API endpoint for chain
 */
export function getAlchemyNFTEndpoint(chainId: number): string | undefined {
  return ALCHEMY_NFT_ENDPOINTS[chainId];
}
