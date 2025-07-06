'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';

interface ContentForm {
  tokenAddress: string;
  title: string;
  body: string;
}

export default function CreateExclusiveContentPage() {
  const { address, isConnected } = useAccount();

  const [form, setForm] = useState<ContentForm>({
    tokenAddress: '',
    title: '',
    body: '',
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleInputChange = (field: keyof ContentForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): string | null => {
    if (!form.tokenAddress.trim()) return 'Token address is required';
    if (!isAddress(form.tokenAddress)) return 'Invalid token address';
    if (!form.title.trim()) return 'Title is required';
    if (!form.body.trim()) return 'Content body is required';
    return null;
  };

  const createContent = async () => {
    if (!isConnected) {
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
      console.log('📝 Creating exclusive content...');
      
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coin_address: form.tokenAddress.toLowerCase(),
          title: form.title,
          body: form.body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create content');
      }

      const result = await response.json();
      console.log('✅ Content created successfully:', result);

      setSuccess('Exclusive content created successfully!');
      
      // Reset form
      setForm({
        tokenAddress: '',
        title: '',
        body: '',
      });

    } catch (err) {
      console.error('❌ Error creating content:', err);
      let errorMessage = 'Failed to create content';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

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
                Create Exclusive Content
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/create"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                🚀 Create Token
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
              Create Exclusive Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Create content that only token holders can access
            </p>
            
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>How it works:</strong> Content will be locked behind token ownership verification. Only users who hold the specified token can view this content.
              </p>
            </div>
          </div>

          {!isConnected ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-2xl font-semibold mb-4">Connect Your Wallet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your wallet to create exclusive content
              </p>
              <ConnectButton />
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); createContent(); }} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Token Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Address *
                </label>
                <input
                  type="text"
                  value={form.tokenAddress}
                  onChange={(e) => handleInputChange('tokenAddress', e.target.value)}
                  placeholder="0x... (Token contract address)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only holders of this token will be able to view the content
                </p>
              </div>

              {/* Content Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter content title..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                />
              </div>

              {/* Content Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Body *
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Enter your exclusive content here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This content will only be visible to token holders
                </p>
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
                      Creating Content...
                    </>
                  ) : (
                    'Create Exclusive Content'
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> Once created, this content will be stored in your database and can be accessed by anyone who holds the specified token. Make sure the token address is correct before submitting.
                </p>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
} 