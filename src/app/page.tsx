'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { readContract } from '@wagmi/core';
import { erc20Abi, erc721Abi } from 'viem';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';

// ERC1155 ABI for balanceOf function
const erc1155Abi = [
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Custom Zora Token ABI - simplified version
const zoraTokenAbi = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

function ClientConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[120px] h-[40px]" />; // Placeholder to prevent layout shift
  }

  return <ConnectButton />;
}

function SearchBar({ onTokenSearch }: { onTokenSearch: (address: string) => void }) {
  const [searchInput, setSearchInput] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);

  const extractTokenAddress = (input: string): string | null => {
    const trimmed = input.trim();
    
    // Check if it's a direct token address (starts with 0x and is 42 characters)
    if (trimmed.match(/^0x[a-fA-F0-9]{40}$/)) {
      return trimmed.toLowerCase();
    }
    
    // Check if it's a Zora URL and extract the token address
    const zoraUrlMatch = trimmed.match(/zora\.co\/coin\/base:(0x[a-fA-F0-9]{40})/);
    if (zoraUrlMatch) {
      return zoraUrlMatch[1].toLowerCase();
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    const extractedAddress = extractTokenAddress(value);
    setIsValidAddress(!!extractedAddress);
    
    if (extractedAddress) {
      onTokenSearch(extractedAddress);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extractedAddress = extractTokenAddress(searchInput);
    if (extractedAddress) {
      onTokenSearch(extractedAddress);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            placeholder="Enter token address (0x...) or Zora URL (https://zora.co/coin/base:0x...)"
            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          {searchInput && (
            <div className="absolute right-3 top-3">
              {isValidAddress ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="text-red-500">✗</span>
              )}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!isValidAddress}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          Search Token
        </button>
      </form>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <p>Examples:</p>
        <p>• Token address: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">0xe90af9670eb73e3aba8176a5aeabfb9c260af930</code></p>
        <p>• Zora URL: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">https://zora.co/coin/base:0xe90af9670eb73e3aba8176a5aeabfb9c260af930</code></p>
      </div>
    </div>
  );
}

function ContentGate({ tokenAddress }: { tokenAddress: string }) {
  const { address, isConnected } = useAccount();
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contentExists, setContentExists] = useState(false);
  const [checkingContent, setCheckingContent] = useState(false);
  const [tokenStandard, setTokenStandard] = useState<string>('');
  const [balanceError, setBalanceError] = useState<string>('');
  const publicClient = usePublicClient();

  // Check if content exists for this token
  useEffect(() => {
    async function checkContentExists() {
      if (!tokenAddress) return;
      
      setCheckingContent(true);
      try {
        const response = await fetch(`/api/content?address=${tokenAddress}`);
        setContentExists(response.ok);
      } catch (error) {
        setContentExists(false);
      } finally {
        setCheckingContent(false);
      }
    }

    checkContentExists();
  }, [tokenAddress]);

  // Helper function to check token balance with different standards
  const checkTokenBalance = async (address: string, tokenAddress: string) => {
    // First, let's check if the contract exists
    try {
      console.log('🔍 Checking if contract exists at:', tokenAddress);
      const bytecode = await publicClient?.getBytecode({
        address: tokenAddress as `0x${string}`,
      });
      console.log('📄 Contract bytecode length:', bytecode?.length || 0);
      
      if (!bytecode || bytecode === '0x') {
        throw new Error('No contract found at this address');
      }

      // Try to get basic contract info to determine what type it is
      try {
        console.log('🔍 Trying to get contract name...');
        const name = await readContract(config, {
          address: tokenAddress as `0x${string}`,
          abi: [{ name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function', inputs: [] }],
          functionName: 'name',
        });
        console.log('📝 Contract name:', name);
      } catch (e) {
        console.log('❌ No name function');
      }

      try {
        console.log('🔍 Trying to get contract symbol...');
        const symbol = await readContract(config, {
          address: tokenAddress as `0x${string}`,
          abi: [{ name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function', inputs: [] }],
          functionName: 'symbol',
        });
        console.log('🏷️ Contract symbol:', symbol);
      } catch (e) {
        console.log('❌ No symbol function');
      }

      try {
        console.log('🔍 Trying to get totalSupply...');
        const totalSupply = await readContract(config, {
          address: tokenAddress as `0x${string}`,
          abi: [{ name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function', inputs: [] }],
          functionName: 'totalSupply',
        });
        console.log('📊 Total supply:', totalSupply);
      } catch (e) {
        console.log('❌ No totalSupply function');
      }

    } catch (error) {
      console.error('❌ Contract check failed:', error);
      throw new Error('Invalid contract address - no contract deployed at this address');
    }

    const attempts = [
      // Try ERC721 first (since Zora uses ERC721Drop)
      {
        name: 'ERC721',
        fn: async () => {
          console.log('🔍 Trying ERC721 balanceOf...');
          const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: erc721Abi,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          });
          return { balance, standard: 'ERC721' };
        }
      },
      
      // Try ERC20 
      {
        name: 'ERC20',
        fn: async () => {
          console.log('🔍 Trying ERC20 balanceOf...');
          const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          });
          return { balance, standard: 'ERC20' };
        }
      },
      
      // Try ERC1155 with token ID 1 (common for Zora coins)
      {
        name: 'ERC1155',
        fn: async () => {
          console.log('🔍 Trying ERC1155 balanceOf with token ID 1...');
          const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: erc1155Abi,
            functionName: 'balanceOf',
            args: [address as `0x${string}`, BigInt(1)],
          });
          return { balance, standard: 'ERC1155' };
        }
      },
      
      // Try multiple ERC1155 token IDs (0, 1, 2)
      {
        name: 'ERC1155 (ID 0)',
        fn: async () => {
          console.log('🔍 Trying ERC1155 balanceOf with token ID 0...');
          const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: erc1155Abi,
            functionName: 'balanceOf',
            args: [address as `0x${string}`, BigInt(0)],
          });
          return { balance, standard: 'ERC1155 (ID 0)' };
        }
      },
      
      // Try custom Zora interface
      {
        name: 'Custom Zora',
        fn: async () => {
          console.log('🔍 Trying custom Zora balanceOf...');
          const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: zoraTokenAbi,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          });
          return { balance, standard: 'Zora' };
        }
      },
    ];

    // Try each method until one succeeds
    for (const attempt of attempts) {
      try {
        const result = await attempt.fn();
        console.log(`✅ Success with ${result.standard}:`, result.balance);
        return result;
      } catch (error) {
        console.log(`❌ Failed with ${attempt.name}:`, error);
        continue;
      }
    }
    
    throw new Error(`Unable to read balance with any token standard - this address may not be a valid token contract or may use a non-standard interface. Contract exists but doesn't respond to standard token functions.`);
  };

  useEffect(() => {
    async function checkBalance() {
      if (!address || !publicClient || !isConnected || !tokenAddress) {
        setHasToken(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('🔍 Checking token balance for:', address);
        console.log('📍 Contract address:', tokenAddress);
        console.log('🌐 Chain ID:', publicClient.chain?.id);
        console.log('🌐 Chain name:', publicClient.chain?.name);
        console.log('🌐 Expected: Base (8453) or Base Sepolia (84532)');
        
        // Check if we're on the right network
        if (publicClient.chain?.id !== 8453 && publicClient.chain?.id !== 84532) {
          throw new Error(`Wrong network! Connected to ${publicClient.chain?.name} (${publicClient.chain?.id}). Please connect to Base Mainnet (8453) or Base Sepolia (84532).`);
        }

        const result = await checkTokenBalance(address, tokenAddress);
        
        console.log('💰 Raw balance:', result.balance);
        console.log('💰 Token standard:', result.standard);
        console.log('💰 Balance as BigInt:', BigInt(result.balance));
        console.log('💰 Has token:', BigInt(result.balance) > BigInt(0));

        setHasToken(BigInt(result.balance) > BigInt(0));
        setTokenStandard(result.standard);
        setBalanceError('');
      } catch (error) {
        console.error('❌ Error checking token balance:', error);
        setHasToken(false);
        setTokenStandard('');
        setBalanceError(error instanceof Error ? error.message : 'Failed to check token balance');
      } finally {
        setIsLoading(false);
      }
    }

    checkBalance();
  }, [address, publicClient, isConnected, tokenAddress]);

  // Reset states when token changes
  useEffect(() => {
    setHasToken(false);
    setTokenStandard('');
    setBalanceError('');
  }, [tokenAddress]);

  if (!tokenAddress) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-semibold mb-4">Search for Token</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a token address or Zora URL to check for exclusive content
        </p>
      </div>
    );
  }

  if (checkingContent) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <h2 className="text-2xl font-semibold mb-4">Checking Content...</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Verifying if content exists for this token
        </p>
      </div>
    );
  }

  if (!contentExists) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-2xl font-semibold mb-4">No Content Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          There is no exclusive content available for this token.
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Token Address:</strong><br />
            <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              {tokenAddress}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🔐 Exclusive Content Vault
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access restricted content with your token ownership
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚪</div>
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet to verify your token ownership and access exclusive content.
            </p>
            <div className="flex justify-center">
              <ClientConnectButton />
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <h2 className="text-2xl font-semibold mb-4">Verifying Access...</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Checking your token balance on the connected network
            </p>
          </div>
        ) : hasToken ? (
          <SecretContent tokenAddress={tokenAddress} tokenStandard={tokenStandard} />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to own the access token to unlock this content.
            </p>
            
            {/* Debug Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Debug Info:</strong><br />
                Connected Address: <code className="text-xs">{address}</code><br />
                Network: <code className="text-xs">{publicClient?.chain?.name} (ID: {publicClient?.chain?.id})</code><br />
                Token Address: <code className="text-xs">{tokenAddress}</code><br />
                {tokenStandard && <span>Token Standard: <code className="text-xs">{tokenStandard}</code><br /></span>}
                {balanceError && <span className="text-red-600 dark:text-red-400">Balance Error: <code className="text-xs">{balanceError}</code></span>}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Required:</strong> Token at address: <br />
                <code className="text-xs bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">
                  {tokenAddress}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SecretContent({ tokenAddress, tokenStandard }: { tokenAddress: string; tokenStandard: string }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/content?address=${tokenAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(data.body);
      } catch (err) {
        setError('Failed to load exclusive content');
        console.error('Error fetching content:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [tokenAddress]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse text-2xl mb-4">📄</div>
        <p>Loading exclusive content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <div className="text-4xl mb-4">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-semibold mb-6 text-green-600">Access Granted!</h2>
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-left">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          📚 Exclusive Content
        </h3>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border mb-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {content}
          </pre>
        </div>
        {/* <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <strong>Token Info:</strong> {tokenAddress}
        </div> */}
      </div>
    </div>
  );
}

export default function Home() {
  const [searchedToken, setSearchedToken] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Token-Gated Content Vault
            </h1>
            <div className="flex items-center space-x-4">
              <a
                href="/create"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                🚀 Create Token
              </a>
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
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <SearchBar onTokenSearch={setSearchedToken} />
        <ContentGate tokenAddress={searchedToken} />
      </main>
    </div>
  );
}
