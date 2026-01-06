/**
 * NFTMintService - NFT Minting on Blockchain
 *
 * Handles building and sending NFT minting transactions
 */

import { ethers, Contract, TransactionRequest as EthersTransactionRequest } from 'ethers';
import { providerService } from './ProviderService';
import { transactionService } from '../wallet/TransactionService';
import {
  SIMPLE_NFT_ABI,
  getMintingContractAddress,
  isMintingSupported,
  MINTING_SUPPORTED_CHAINS,
} from '../../constants/contracts';

// Mint transaction result
export interface MintResult {
  txHash: string;
  tokenId?: string;
}

class NFTMintService {
  /**
   * Check if minting is available on current chain
   */
  canMint(): boolean {
    const chainId = providerService.getCurrentChainId();
    return isMintingSupported(chainId);
  }

  /**
   * Get minting contract address for current chain
   */
  getContractAddress(): string | null {
    const chainId = providerService.getCurrentChainId();
    return getMintingContractAddress(chainId);
  }

  /**
   * Get supported chains for minting
   */
  getSupportedChains(): number[] {
    return MINTING_SUPPORTED_CHAINS;
  }

  /**
   * Build mint transaction
   * @param to - Recipient address (usually the minter's address)
   * @param tokenURI - IPFS URI of the token metadata
   * @param gasPrice - Optional gas price in gwei
   */
  async buildMintTransaction(
    to: string,
    tokenURI: string,
    gasPrice?: string
  ): Promise<EthersTransactionRequest> {
    const chainId = providerService.getCurrentChainId();
    const contractAddress = getMintingContractAddress(chainId);

    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Minting contract not deployed on this network');
    }

    const provider = providerService.getProvider();
    const contract = new Contract(contractAddress, SIMPLE_NFT_ABI, provider);

    // Encode mint function call
    const data = contract.interface.encodeFunctionData('mint', [to, tokenURI]);

    const tx: EthersTransactionRequest = {
      to: contractAddress,
      data,
      chainId,
      value: BigInt(0), // No ETH sent for free mint
    };

    if (gasPrice) {
      tx.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
    }

    return tx;
  }

  /**
   * Build mint transaction with custom contract address
   * For testing or using different contracts
   */
  async buildMintTransactionCustom(
    contractAddress: string,
    to: string,
    tokenURI: string,
    gasPrice?: string
  ): Promise<EthersTransactionRequest> {
    const chainId = providerService.getCurrentChainId();
    const provider = providerService.getProvider();
    const contract = new Contract(contractAddress, SIMPLE_NFT_ABI, provider);

    const data = contract.interface.encodeFunctionData('mint', [to, tokenURI]);

    const tx: EthersTransactionRequest = {
      to: contractAddress,
      data,
      chainId,
      value: BigInt(0),
    };

    if (gasPrice) {
      tx.gasPrice = ethers.parseUnits(gasPrice, 'gwei');
    }

    return tx;
  }

  /**
   * Execute mint transaction
   * @param privateKey - Signer's private key
   * @param to - Recipient address
   * @param tokenURI - IPFS URI of the token metadata
   * @param gasPrice - Optional gas price in gwei
   */
  async mint(
    privateKey: string,
    to: string,
    tokenURI: string,
    gasPrice?: string
  ): Promise<MintResult> {
    // Build the transaction
    const tx = await this.buildMintTransaction(to, tokenURI, gasPrice);

    // Sign and send using TransactionService
    const txHash = await transactionService.signAndSend(privateKey, tx);

    return {
      txHash,
    };
  }

  /**
   * Execute mint with custom contract
   */
  async mintCustom(
    privateKey: string,
    contractAddress: string,
    to: string,
    tokenURI: string,
    gasPrice?: string
  ): Promise<MintResult> {
    const tx = await this.buildMintTransactionCustom(
      contractAddress,
      to,
      tokenURI,
      gasPrice
    );

    const txHash = await transactionService.signAndSend(privateKey, tx);

    return {
      txHash,
    };
  }

  /**
   * Estimate gas for minting
   */
  async estimateMintGas(to: string, tokenURI: string): Promise<bigint> {
    const contractAddress = this.getContractAddress();

    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      // Return a reasonable estimate for testing
      return BigInt(150000);
    }

    try {
      const provider = providerService.getProvider();
      const contract = new Contract(contractAddress, SIMPLE_NFT_ABI, provider);

      const data = contract.interface.encodeFunctionData('mint', [to, tokenURI]);

      const gasEstimate = await provider.estimateGas({
        to: contractAddress,
        data,
        from: to,
      });

      return gasEstimate;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      // Return default estimate
      return BigInt(150000);
    }
  }

  /**
   * Wait for mint transaction confirmation and get token ID
   */
  async waitForMintConfirmation(txHash: string): Promise<string | null> {
    try {
      const provider = providerService.getProvider();
      const receipt = await provider.waitForTransaction(txHash, 1);

      if (!receipt || receipt.status !== 1) {
        return null;
      }

      // Try to parse Transfer event to get token ID
      const contract = new Contract(
        receipt.to || '',
        SIMPLE_NFT_ABI,
        provider
      );

      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });

          if (parsed?.name === 'Transfer') {
            // Token ID is the third argument in Transfer event
            return parsed.args[2].toString();
          }
        } catch {
          // Not this event, continue
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get mint confirmation:', error);
      return null;
    }
  }

  /**
   * Get total supply of minting contract
   */
  async getTotalSupply(): Promise<string> {
    const contractAddress = this.getContractAddress();

    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      return '0';
    }

    try {
      const provider = providerService.getProvider();
      const contract = new Contract(contractAddress, SIMPLE_NFT_ABI, provider);

      const totalSupply = await contract.totalSupply();
      return totalSupply.toString();
    } catch {
      return '0';
    }
  }
}

export const nftMintService = new NFTMintService();
export default NFTMintService;
