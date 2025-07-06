'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, isAddress, Address } from 'viem';
import { 
  createCoin, 
  createMetadataBuilder, 
  createZoraUploaderForCreator,
  DeployCurrency,
  InitialPurchaseCurrency,
} from '@zoralabs/coins-sdk';
import { setApiKey } from "@zoralabs/coins-sdk";

interface TokenForm {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  payoutRecipient: string;
  currency: DeployCurrency;
  platformReferrer: string;
  initialPurchaseAmount: string;
  enableInitialPurchase: boolean;
}

export default function CreateTokenPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY || '');

  const [form, setForm] = useState<TokenForm>({
    name: '',
    symbol: '',
    description: '',
    image: null,
    payoutRecipient: '',
    currency: DeployCurrency.ZORA,
    platformReferrer: '',
    initialPurchaseAmount: '0.01',
    enableInitialPurchase: false,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<{ hash: string; address: string } | null>(null);

  // Auto-fill payout recipient with connected address
  useEffect(() => {
    if (address && !form.payoutRecipient) {
      setForm(prev => ({ ...prev, payoutRecipient: address }));
    }
  }, [address, form.payoutRecipient]);

  const handleInputChange = (field: keyof TokenForm, value: string | File | boolean | DeployCurrency | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB');
        return;
      }
      handleInputChange('image', file);
    }
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'Token name is required';
    if (!form.symbol.trim()) return 'Token symbol is required';
    if (!form.description.trim()) return 'Token description is required';
    if (!form.image) return 'Token image is required';
    if (!form.payoutRecipient.trim()) return 'Payout recipient is required';
    if (!isAddress(form.payoutRecipient)) return 'Invalid payout recipient address';
    
    if (form.platformReferrer && !isAddress(form.platformReferrer)) {
      return 'Invalid platform referrer address';
    }
    
    if (form.enableInitialPurchase && (!form.initialPurchaseAmount || parseFloat(form.initialPurchaseAmount) <= 0)) {
      return 'Initial purchase amount must be greater than 0';
    }

    return null;
  };

  const createToken = async () => {
    if (!isConnected || !walletClient || !publicClient || !address) {
      setError('Please connect your wallet');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      console.log('🚀 Starting real token creation...');
      
      // Step 1: Build and upload metadata (following official docs)
      console.log('📦 Building metadata...');
      
      const { createMetadataParameters } = await createMetadataBuilder()
        .withName(form.name)
        .withSymbol(form.symbol)
        .withDescription(form.description)
        .withImage(form.image!)
        .upload(createZoraUploaderForCreator(address as Address));

      console.log('✅ Metadata uploaded successfully');

      // Step 2: Prepare coin creation parameters
      const coinParams = {
        ...createMetadataParameters,
        payoutRecipient: form.payoutRecipient as `0x${string}`,
        currency: form.currency,
        ...(form.platformReferrer && { platformReferrer: form.platformReferrer as `0x${string}` }),
        ...(form.enableInitialPurchase && {
          initialPurchase: {
            currency: InitialPurchaseCurrency.ETH,
            amount: parseEther(form.initialPurchaseAmount),
          }
        }),
      };

      console.log('💰 Creating coin with parameters:', {
        name: coinParams.name,
        symbol: coinParams.symbol,
        payoutRecipient: coinParams.payoutRecipient,
        currency: coinParams.currency === DeployCurrency.ZORA ? 'ZORA' : 'ETH',
        hasInitialPurchase: !!coinParams.initialPurchase,
        chainId: publicClient.chain?.id,
      });

      // Step 3: Create the coin on-chain
      const result = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120, // Add 20% buffer to gas
      });

      console.log('🎉 Token created successfully!');
      console.log('Transaction hash:', result.hash);
      console.log('Contract address:', result.address);

      setSuccess({
        hash: result.hash,
        address: result.address,
      });

    } catch (err) {
      console.error('❌ Error creating token:', err);
      let errorMessage = 'Failed to create token';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle common errors with user-friendly messages
        if (errorMessage.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to cover gas fees and initial purchase';
        } else if (errorMessage.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Network error - please check your connection and try again';
        } else if (errorMessage.includes('API key')) {
          errorMessage = 'API key is required for metadata upload. Please set NEXT_PUBLIC_ZORA_API_KEY in your environment variables.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Zora Token Creator
              </h1>
              <ConnectButton />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
              Token Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your Zora token has been deployed on Base and is ready to trade.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Token Details</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Symbol:</strong> {form.symbol}</p>
                <p><strong>Contract Address:</strong> 
                  <code className="ml-2 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                    {success.address}
                  </code>
                </p>
                <p><strong>Transaction:</strong> 
                  <a 
                    href={`https://basescan.org/tx/${success.hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                  >
                    View on BaseScan
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSuccess(null);
                  setForm({
                    name: '',
                    symbol: '',
                    description: '',
                    image: null,
                    payoutRecipient: address || '',
                    currency: DeployCurrency.ZORA,
                    platformReferrer: '',
                    initialPurchaseAmount: '0.01',
                    enableInitialPurchase: false,
                  });
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Another Token
              </button>
              <a
                href={`https://zora.co/coin/base:${success.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                View on Zora
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                ← Back to Vault
              </a>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Zora Token Creator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/create-content"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                📝 Create Content
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Your Zora Token
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Deploy an ERC20 token on the Zora protocol with built-in trading functionality
            </p>
            
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Live Mode:</strong> This will create real tokens on Base mainnet. You'll need to pay gas fees.
              </p>
            </div>
          </div>

          {!isConnected ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-2xl font-semibold mb-4">Connect Your Wallet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your wallet to create and deploy your Zora token
              </p>
              <ConnectButton />
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); createToken(); }} className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., My Awesome Token"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    value={form.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    placeholder="e.g., MAT"
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your token and its purpose..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Image *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg dark:border-gray-600">
                  <div className="space-y-1 text-center">
                    {form.image ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(form.image)}
                          alt="Token preview"
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <p className="text-sm text-gray-500">{form.image.name}</p>
                        <button
                          type="button"
                          onClick={() => handleInputChange('image', null)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={isCreating}
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload an image</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isCreating}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payout Recipient *
                  </label>
                  <input
                    type="text"
                    value={form.payoutRecipient}
                    onChange={(e) => handleInputChange('payoutRecipient', e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trading Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleInputChange('currency', parseInt(e.target.value) as DeployCurrency)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isCreating}
                  >
                    <option value={DeployCurrency.ZORA}>ZORA (Recommended)</option>
                    <option value={DeployCurrency.ETH}>ETH</option>
                  </select>
                </div>
              </div>

              {/* Optional Platform Referrer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform Referrer (Optional)
                </label>
                <input
                  type="text"
                  value={form.platformReferrer}
                  onChange={(e) => handleInputChange('platformReferrer', e.target.value)}
                  placeholder="0x... (Optional referrer address for fee sharing)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                />
              </div>

              {/* Initial Purchase */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Initial Purchase</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enableInitialPurchase}
                      onChange={(e) => handleInputChange('enableInitialPurchase', e.target.checked)}
                      className="sr-only peer"
                      disabled={isCreating}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Purchase initial tokens during creation to seed liquidity (Base mainnet only)
                </p>
                {form.enableInitialPurchase && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ETH Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.initialPurchaseAmount}
                      onChange={(e) => handleInputChange('initialPurchaseAmount', e.target.value)}
                      placeholder="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={isCreating}
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isCreating || !isConnected}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Token...
                    </>
                  ) : (
                    'Create Token'
                  )}
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Important:</strong> This will create a real token on Base mainnet. You'll need ETH for gas fees. 
                  Make sure all information is correct before proceeding.
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
} 