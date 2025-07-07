import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, Plus, Folder as FolderIcon, Lock, Key, Eye, EyeOff, AlertTriangle, Check, Copy, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import CryptoJS from 'crypto-js';

interface FolderData {
  id: string;
  folder_name: string;
  created_at: string;
  encrypted_content?: string;
}

interface DecryptedFolder extends FolderData {
  decrypted_content?: any;
  isUnlocked?: boolean;
}

export default function Folder() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [folders, setFolders] = useState<DecryptedFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<DecryptedFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [unlockKey, setUnlockKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [keyAttempts, setKeyAttempts] = useState<{[key: string]: number}>({});
  const [blockedFolders, setBlockedFolders] = useState<{[key: string]: number}>({});

  useEffect(() => {
    checkUser();
    loadFolders();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/');
      return;
    }
    setUser(session.user);
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const generateEncryptionKey = () => {
    // Generate a strong 256-bit key
    const key = CryptoJS.lib.WordArray.random(32).toString();
    return key;
  };

  const encryptContent = (content: string, key: string) => {
    return CryptoJS.AES.encrypt(content, key).toString();
  };

  const decryptContent = (encryptedContent: string, key: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Invalid key');
      return decrypted;
    } catch (error) {
      throw new Error('Invalid encryption key');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    try {
      const encryptionKey = generateEncryptionKey();
      const initialContent = JSON.stringify({
        files: [],
        notes: '',
        created: new Date().toISOString()
      });
      
      const encryptedContent = encryptContent(initialContent, encryptionKey);

      const { error } = await supabase
        .from('folders')
        .insert({
          folder_name: newFolderName,
          encrypted_content: encryptedContent,
          user_id: user.id
        });

      if (error) throw error;

      setGeneratedKey(encryptionKey);
      setSuccess('Folder created successfully! Please save your encryption key.');
      setNewFolderName('');
      loadFolders();
    } catch (error: any) {
      setError('Failed to create folder: ' + error.message);
    }
  };

  const handleUnlockFolder = async (folder: DecryptedFolder) => {
    const folderId = folder.id;
    
    // Check if folder is blocked
    const blockTime = blockedFolders[folderId];
    if (blockTime && Date.now() - blockTime < 24 * 60 * 60 * 1000) {
      const remainingTime = Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - blockTime)) / (60 * 60 * 1000));
      setError(`This folder is blocked for ${remainingTime} more hours due to suspicious activity.`);
      return;
    }

    if (!unlockKey.trim()) {
      setError('Please enter the encryption key');
      return;
    }

    try {
      if (!folder.encrypted_content) {
        setError('No encrypted content found');
        return;
      }

      const decryptedContent = decryptContent(folder.encrypted_content, unlockKey);
      const parsedContent = JSON.parse(decryptedContent);

      // Success - reset attempts and unlock folder
      setKeyAttempts(prev => ({ ...prev, [folderId]: 0 }));
      setFolders(prev => prev.map(f => 
        f.id === folderId 
          ? { ...f, decrypted_content: parsedContent, isUnlocked: true }
          : f
      ));
      
      setShowUnlockModal(false);
      setUnlockKey('');
      setError('');
      setSuccess('Folder unlocked successfully!');
    } catch (error) {
      // Failed attempt - increment counter
      const currentAttempts = (keyAttempts[folderId] || 0) + 1;
      setKeyAttempts(prev => ({ ...prev, [folderId]: currentAttempts }));

      if (currentAttempts >= 3) {
        // Block folder for 24 hours
        setBlockedFolders(prev => ({ ...prev, [folderId]: Date.now() }));
        setError('Too many failed attempts. This folder is now blocked for 24 hours.');
        setShowUnlockModal(false);
      } else {
        setError(`Invalid encryption key. ${3 - currentAttempts} attempts remaining.`);
      }
    }
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setSuccess('Encryption key copied to clipboard!');
  };

  const downloadKey = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedKey], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cybervault-key-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewFolderName('');
    setGeneratedKey('');
    setError('');
    setSuccess('');
  };

  const closeUnlockModal = () => {
    setShowUnlockModal(false);
    setSelectedFolder(null);
    setUnlockKey('');
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-cyan-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  CyberVault
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2 rounded-lg font-medium transition-all duration-300"
            >
              <Plus className="h-5 w-5" />
              <span>New Folder</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Your Secure Vault
          </h1>
          <p className="text-gray-300 text-lg">
            Your encrypted folders are protected with client-side encryption. Only you have the keys.
          </p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center">
            <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Folders Grid */}
        {folders.length === 0 ? (
          <div className="text-center py-16">
            <FolderIcon className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">No folders yet</h2>
            <p className="text-gray-500 mb-8">Create your first encrypted folder to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3 rounded-lg font-medium transition-all duration-300"
            >
              Create First Folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => {
              const isBlocked = blockedFolders[folder.id] && 
                Date.now() - blockedFolders[folder.id] < 24 * 60 * 60 * 1000;
              const attempts = keyAttempts[folder.id] || 0;
              
              return (
                <div
                  key={folder.id}
                  className={`group p-6 bg-gray-800/30 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    isBlocked 
                      ? 'border-red-500/50 hover:border-red-400/50 hover:shadow-red-500/10' 
                      : folder.isUnlocked
                        ? 'border-green-500/50 hover:border-green-400/50 hover:shadow-green-500/10'
                        : 'border-gray-700/50 hover:border-cyan-400/50 hover:shadow-cyan-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isBlocked 
                          ? 'bg-red-500/10' 
                          : folder.isUnlocked 
                            ? 'bg-green-500/10' 
                            : 'bg-cyan-500/10'
                      }`}>
                        {isBlocked ? (
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        ) : folder.isUnlocked ? (
                          <FolderIcon className="h-6 w-6 text-green-400" />
                        ) : (
                          <Lock className="h-6 w-6 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{folder.folder_name}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(folder.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className={`text-sm ${
                      isBlocked 
                        ? 'text-red-400' 
                        : folder.isUnlocked 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                    }`}>
                      Status: {
                        isBlocked 
                          ? 'Blocked (24h)' 
                          : folder.isUnlocked 
                            ? 'Unlocked' 
                            : 'Locked'
                      }
                    </div>
                    {attempts > 0 && !folder.isUnlocked && !isBlocked && (
                      <div className="text-sm text-yellow-400">
                        Failed attempts: {attempts}/3
                      </div>
                    )}
                  </div>

                  {!folder.isUnlocked && !isBlocked && (
                    <button
                      onClick={() => {
                        setSelectedFolder(folder);
                        setShowUnlockModal(true);
                      }}
                      className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Key className="h-4 w-4" />
                      <span>Unlock Folder</span>
                    </button>
                  )}

                  {folder.isUnlocked && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-400 mb-2">
                        ✓ Folder unlocked and ready to use
                      </div>
                      <button className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 px-4 rounded-lg transition-colors">
                        Manage Files
                      </button>
                    </div>
                  )}

                  {isBlocked && (
                    <div className="text-sm text-red-400">
                      This folder is temporarily blocked due to multiple failed unlock attempts.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl p-8 w-full max-w-md backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Create New Folder</h2>
            
            {!generatedKey ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    placeholder="Enter folder name"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-400">
                      <p className="font-medium mb-1">Important Security Notice:</p>
                      <p>A unique encryption key will be generated for this folder. You must save this key securely - we cannot recover it if lost!</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeCreateModal}
                    className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-3 rounded-lg transition-all duration-300"
                  >
                    Create Folder
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="p-3 bg-green-500/10 rounded-full w-fit mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Folder Created!</h3>
                  <p className="text-gray-400">Save your encryption key securely</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Encryption Key</label>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3 font-mono text-sm text-white break-all">
                    {showKey ? generatedKey : '•'.repeat(generatedKey.length)}
                  </div>
                </div>

                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={copyKeyToClipboard}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 text-white py-2 px-3 rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={downloadKey}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 text-white py-2 px-3 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-400">
                      <p className="font-medium mb-1">Critical Warning:</p>
                      <p>This key is NOT stored in our database. If you lose it, your folder contents will be permanently inaccessible!</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={closeCreateModal}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-3 rounded-lg transition-all duration-300"
                >
                  I've Saved My Key
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unlock Folder Modal */}
      {showUnlockModal && selectedFolder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl p-8 w-full max-w-md backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Unlock Folder</h2>
            <p className="text-gray-400 text-center mb-6">"{selectedFolder.folder_name}"</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Encryption Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={unlockKey}
                  onChange={(e) => setUnlockKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                  placeholder="Enter your encryption key"
                  onKeyPress={(e) => e.key === 'Enter' && handleUnlockFolder(selectedFolder)}
                />
              </div>
            </div>

            {keyAttempts[selectedFolder.id] > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">
                    {3 - keyAttempts[selectedFolder.id]} attempts remaining
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={closeUnlockModal}
                className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlockFolder(selectedFolder)}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-3 rounded-lg transition-all duration-300"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}