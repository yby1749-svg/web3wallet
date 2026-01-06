/**
 * RequestHandler - WalletConnect Request Processing
 *
 * Handles JSON-RPC requests by integrating with existing TransactionService
 */

import { transactionService } from '../wallet/TransactionService';
import { keyManager } from '../wallet/KeyManager';
import { providerService } from '../blockchain/ProviderService';
import { WCSignRequest, WCFormattedRequest } from '../../types/walletconnect';
import { ethers } from 'ethers';

class RequestHandler {
  /**
   * Format request params for UI display
   */
  formatRequest(request: WCSignRequest): WCFormattedRequest {
    const { method, params } = request;

    switch (method) {
      case 'personal_sign':
      case 'eth_sign': {
        // personal_sign: [message, address]
        // eth_sign: [address, message]
        const message = method === 'personal_sign' ? params[0] : params[1];
        return {
          type: 'message',
          message: this.decodeMessage(message as string),
        };
      }

      case 'eth_signTransaction':
      case 'eth_sendTransaction': {
        const txParams = params[0] as Record<string, string>;
        return {
          type: 'transaction',
          transaction: {
            to: txParams.to || '',
            value: txParams.value ? ethers.formatEther(txParams.value) : '0',
            data: txParams.data,
            gasLimit: txParams.gas || txParams.gasLimit,
            gasPrice: txParams.gasPrice,
          },
        };
      }

      case 'eth_signTypedData':
      case 'eth_signTypedData_v4': {
        // [address, typedData]
        const typedDataString = params[1] as string;
        try {
          const parsed = JSON.parse(typedDataString);
          return {
            type: 'typedData',
            typedData: {
              domain: parsed.domain,
              types: parsed.types,
              message: parsed.message,
            },
          };
        } catch {
          return {
            type: 'typedData',
            typedData: {
              domain: {},
              types: {},
              message: { raw: typedDataString },
            },
          };
        }
      }

      default:
        return { type: 'message', message: `Unsupported method: ${method}` };
    }
  }

  /**
   * Handle signing request after PIN verification
   */
  async handleRequest(
    request: WCSignRequest,
    address: string,
    pin: string
  ): Promise<string> {
    // Verify PIN first
    const isValidPin = await keyManager.verifyPin(pin);
    if (!isValidPin) {
      throw new Error('Invalid PIN');
    }

    // Retrieve private key
    const privateKey = await keyManager.retrievePrivateKey(address, pin);
    if (!privateKey) {
      throw new Error('Failed to retrieve private key');
    }

    // Set the correct chain
    providerService.setCurrentChain(request.chainId);

    // Process based on method
    switch (request.method) {
      case 'personal_sign':
        return this.handlePersonalSign(request.params, privateKey);

      case 'eth_sign':
        return this.handleEthSign(request.params, privateKey);

      case 'eth_signTransaction':
        return this.handleSignTransaction(request.params, privateKey);

      case 'eth_sendTransaction':
        return this.handleSendTransaction(request.params, privateKey);

      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        return this.handleSignTypedData(request.params, privateKey);

      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  }

  /**
   * Handle personal_sign
   * Params: [message, address]
   */
  private async handlePersonalSign(params: unknown[], privateKey: string): Promise<string> {
    const message = params[0] as string;
    const decodedMessage = this.decodeMessage(message);
    return transactionService.signMessage(privateKey, decodedMessage);
  }

  /**
   * Handle eth_sign
   * Params: [address, message]
   */
  private async handleEthSign(params: unknown[], privateKey: string): Promise<string> {
    const message = params[1] as string;
    const decodedMessage = this.decodeMessage(message);
    return transactionService.signMessage(privateKey, decodedMessage);
  }

  /**
   * Handle eth_signTransaction
   * Params: [txParams]
   */
  private async handleSignTransaction(params: unknown[], privateKey: string): Promise<string> {
    const txParams = params[0] as Record<string, string>;
    const tx = this.formatTransactionParams(txParams);
    return transactionService.signTransaction(privateKey, tx);
  }

  /**
   * Handle eth_sendTransaction
   * Params: [txParams]
   */
  private async handleSendTransaction(params: unknown[], privateKey: string): Promise<string> {
    const txParams = params[0] as Record<string, string>;
    const tx = this.formatTransactionParams(txParams);
    return transactionService.signAndSend(privateKey, tx);
  }

  /**
   * Handle eth_signTypedData and eth_signTypedData_v4
   * Params: [address, typedData]
   */
  private async handleSignTypedData(params: unknown[], privateKey: string): Promise<string> {
    const typedDataString = params[1] as string;
    const typedData = JSON.parse(typedDataString);

    const { domain, types, message } = typedData;

    // Remove EIP712Domain from types (ethers handles it automatically)
    const cleanTypes = { ...types };
    delete cleanTypes.EIP712Domain;

    return transactionService.signTypedData(privateKey, domain, cleanTypes, message);
  }

  /**
   * Decode hex-encoded message
   */
  private decodeMessage(message: string): string {
    if (message.startsWith('0x')) {
      try {
        return Buffer.from(message.slice(2), 'hex').toString('utf8');
      } catch {
        return message;
      }
    }
    return message;
  }

  /**
   * Format transaction params from WalletConnect to ethers format
   */
  private formatTransactionParams(params: Record<string, string>): ethers.TransactionRequest {
    const tx: ethers.TransactionRequest = {
      to: params.to,
    };

    if (params.value) {
      tx.value = params.value;
    }

    if (params.data) {
      tx.data = params.data;
    }

    if (params.gas || params.gasLimit) {
      tx.gasLimit = params.gas || params.gasLimit;
    }

    if (params.gasPrice) {
      tx.gasPrice = params.gasPrice;
    }

    if (params.nonce) {
      tx.nonce = parseInt(params.nonce, 16);
    }

    if (params.maxFeePerGas) {
      tx.maxFeePerGas = params.maxFeePerGas;
    }

    if (params.maxPriorityFeePerGas) {
      tx.maxPriorityFeePerGas = params.maxPriorityFeePerGas;
    }

    return tx;
  }
}

export const requestHandler = new RequestHandler();
export default RequestHandler;
