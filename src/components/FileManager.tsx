import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Download, Trash2, Eye, EyeOff, Save, Plus, File, Image, Video, Music, Archive, AlertTriangle, Check, Copy, Edit3, Shield, Bomb, QrCode, Package, Key } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'note';
  content?: string; // For notes
  file_data?: string; // For files (base64 encoded)
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

interface FolderContent {
  files: FileItem[];
  notes: string;
  created: string;
  updated: string;
}

export default function FileManager() {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [folder, setFolder] = useState<any>(null);
  const [folderContent, setFolderContent] = useState<FolderContent>({
    files: [],
    notes: '',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  });
  const [encryptionKey, setEncryptionKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showSelfDestructModal, setShowSelfDestructModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selfDestructKey, setSelfDestructKey] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupData, setBackupData] = useState('');

  // ... [rest of the code remains the same until the return statement]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* ... [header and main content sections remain the same] */}

      {/* Unlock Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl p-8 w-full max-w-md backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Enter Encryption Key</h2>
            <p className="text-gray-400 text-center mb-6">
              Enter your encryption key to access "{folder?.folder_name}"
            </p>
            
            <div className="mb-6">
              <input
                type="password"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                placeholder="Enter your encryption key"
                onKeyPress={(e) => e.key === 'Enter' && handleUnlockFolder()}
              />
            </div>

            <button
              onClick={handleUnlockFolder}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-3 rounded-lg transition-all duration-300"
            >
              Unlock Folder
            </button>
          </div>
        </div>
      )}

      {/* Self-Destruct Modal */}
      {showSelfDestructModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-red-500/50 rounded-2xl p-8 w-full max-w-md backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto mb-4">
                <Bomb className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Self-Destruct Folder</h2>
              <p className="text-gray-400">
                This action will permanently delete this folder and all its contents from our servers.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-400">
                  <p className="font-medium mb-1">⚠️ CRITICAL WARNING:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• This action is IRREVERSIBLE</li>
                    <li>• ALL files and notes will be permanently lost</li>
                    <li>• No recovery will be possible</li>
                    <li>• Consider creating a backup first</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm with Encryption Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={selfDestructKey}
                  onChange={(e) => setSelfDestructKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-red-500/50 rounded-lg text-white placeholder-gray-400 focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-colors"
                  placeholder="Enter your encryption key to confirm"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSelfDestructModal(false);
                  setSelfDestructKey('');
                }}
                className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelfDestruct}
                disabled={!selfDestructKey}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
              >
                🔥 DESTROY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-blue-500/50 rounded-2xl p-8 w-full max-w-2xl backdrop-blur-sm max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="p-3 bg-blue-500/10 rounded-full w-fit mx-auto mb-4">
                <Package className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Backup & Export</h2>
              <p className="text-gray-400">
                Your encrypted folder data is ready for backup
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* QR Code */}
              <div className="bg-gray-800/30 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
                  <QrCode className="h-5 w-5 mr-2 text-cyan-400" />
                  QR Code Backup
                </h3>
                {qrCodeUrl && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <img src={qrCodeUrl} alt="Backup QR Code" className="mx-auto" />
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-3">
                  Scan with any QR reader to get backup data
                </p>
              </div>

              {/* Download Options */}
              <div className="bg-gray-800/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-green-400" />
                  Download Options
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={downloadBackup}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON File</span>
                  </button>
                  
                  <button
                    onClick={copyBackupToClipboard}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy to Clipboard</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Backup Information */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-400">
                  <p className="font-medium mb-1">🔒 Security Information:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Backup contains encrypted data only</li>
                    <li>• Your encryption key is NOT included</li>
                    <li>• Data remains secure even if backup is compromised</li>
                    <li>• Store your encryption key separately and securely</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Backup Data Preview */}
            <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Backup Data Preview:</h4>
              <div className="bg-gray-900/50 rounded p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-400 font-mono">
                  {backupData.substring(0, 200)}...
                </pre>
              </div>
            </div>

            <button
              onClick={() => {
                setShowBackupModal(false);
                setBackupData('');
                setQrCodeUrl('');
              }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-3 rounded-lg transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}