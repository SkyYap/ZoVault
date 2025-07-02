'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { readContract } from '@wagmi/core';
import { erc20Abi } from 'viem';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';

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

const coinAddress = '0xe90af9670eb73e3aba8176a5aeabfb9c260af930'; // Replace with actual coin address

function ContentGate() {
  const { address, isConnected } = useAccount();
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function checkBalance() {
      if (!address || !publicClient || !isConnected) {
        setHasToken(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('🔍 Checking token balance for:', address);
        console.log('📍 Contract address:', coinAddress);
        console.log('🌐 Chain ID:', publicClient.chain?.id);
        console.log('🌐 Chain name:', publicClient.chain?.name);

        const balance = await readContract(config, {
          address: coinAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });

        console.log('💰 Raw balance:', balance);
        console.log('💰 Balance as BigInt:', BigInt(balance));
        console.log('💰 Has token:', BigInt(balance) > BigInt(0));

        setHasToken(BigInt(balance) > BigInt(0));
      } catch (error) {
        console.error('❌ Error checking token balance:', error);
        setHasToken(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkBalance();
  }, [address, publicClient, isConnected]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🔐 Exclusive Content Vault
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Access restricted content with your Zora coin ownership
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚪</div>
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet to verify your coin ownership and access exclusive content.
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
              Checking your coin balance on the connected network
            </p>
          </div>
        ) : hasToken ? (
          <SecretContent />
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
                Looking for token: <code className="text-xs">{coinAddress}</code>
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Required:</strong> Zora coin at address: <br />
                <code className="text-xs bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">
                  {coinAddress}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SecretContent() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch('/api/content');
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
  }, []);

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
        <div className="bg-white dark:bg-gray-800 p-4 rounded border">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Connect Button */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Zora Hackathon
              </h1>
            </div>
            <ClientConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <ContentGate />
      </main>
    </div>
  );
}
