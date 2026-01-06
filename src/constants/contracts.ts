/**
 * Smart Contract Constants for NFT Minting
 */

// Simple ERC721 Minting Contract ABI
// This ABI is for a basic ERC721 contract with public minting
export const SIMPLE_NFT_ABI = [
  // Minting functions
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function safeMint(address to, string memory tokenURI) public returns (uint256)',

  // ERC721 standard functions
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Mint(address indexed to, uint256 indexed tokenId, string tokenURI)',
];

// Contract addresses by chain
export const NFT_MINTING_CONTRACTS: Record<number, string> = {
  // Sepolia Testnet - Simple NFT Contract
  // This is a test contract address - replace with your deployed contract
  11155111: '0x0000000000000000000000000000000000000000', // Placeholder - needs deployment
};

// Contract bytecode for deployment (minimal ERC721 with minting)
// This is a placeholder - actual bytecode would be from compiled Solidity
export const SIMPLE_NFT_BYTECODE = '';

/**
 * Get minting contract address for chain
 */
export function getMintingContractAddress(chainId: number): string | null {
  return NFT_MINTING_CONTRACTS[chainId] || null;
}

/**
 * Check if minting is supported on chain
 */
export function isMintingSupported(chainId: number): boolean {
  const address = NFT_MINTING_CONTRACTS[chainId];
  return address !== undefined && address !== '0x0000000000000000000000000000000000000000';
}

// Supported chains for minting
export const MINTING_SUPPORTED_CHAINS = [11155111]; // Only Sepolia for now
