import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Download, Trash2, Eye, EyeOff, Save, Plus, File, Image, Video, Music, Archive, AlertTriangle, Check, Copy, Edit3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import CryptoJS from 'crypto-js';

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

  useEffect(() => {
    if (folderId) {
      loadFolder();
    }
  }, [folderId]);

  const loadFolder = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Folder not found');

      setFolder(data);
    } catch (error: any) {
      setError('Failed to load folder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const decryptContent = (encryptedContent: string, key: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Invalid key');
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Invalid encryption key');
    }
  };

  const encryptContent = (content: FolderContent, key: string) => {
    return CryptoJS.AES.encrypt(JSON.stringify(content), key).toString();
  };

  const handleUnlockFolder = async () => {
    if (!encryptionKey.trim()) {
      setError('Please enter the encryption key');
      return;
    }

    try {
      if (!folder.encrypted_content) {
        setError('No encrypted content found');
        return;
      }

      const decryptedContent = decryptContent(folder.encrypted_content, encryptionKey);
      setFolderContent(decryptedContent);
      setTempNotes(decryptedContent.notes || '');
      setShowKeyModal(false);
      setError('');
    } catch (error) {
      setError('Invalid encryption key');
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const updatedContent = {
        ...folderContent,
        updated: new Date().toISOString()
      };

      const encryptedContent = encryptContent(updatedContent, encryptionKey);

      const { error } = await supabase
        .from('folders')
        .update({ encrypted_content: encryptedContent })
        .eq('id', folderId);

      if (error) throw error;

      setFolderContent(updatedContent);
      setSuccess('Content saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to save content: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        const newFile: FileItem = {
          id: crypto.randomUUID(),
          name: file.name,
          type: 'file',
          file_data: base64Data,
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const updatedContent = {
          ...folderContent,
          files: [...folderContent.files, newFile]
        };

        setFolderContent(updatedContent);
        setSuccess(`File "${file.name}" uploaded successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      setError('Failed to upload file: ' + error.message);
    }

    // Reset input
    event.target.value = '';
  };

  const handleDownloadFile = (file: FileItem) => {
    if (!file.file_data) return;

    try {
      const link = document.createElement('a');
      link.href = file.file_data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError('Failed to download file');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const updatedContent = {
      ...folderContent,
      files: folderContent.files.filter(f => f.id !== fileId)
    };
    setFolderContent(updatedContent);
    setSuccess('File deleted successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveNotes = () => {
    const updatedContent = {
      ...folderContent,
      notes: tempNotes
    };
    setFolderContent(updatedContent);
    setEditingNotes(false);
    setSuccess('Notes saved!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (fileType.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading folder...</p>
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
                onClick={() => navigate('/folder')}
                className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Vault</span>
              </button>
              <div className="text-xl font-semibold text-white">
                {folder?.folder_name}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={saveContent}
                disabled={saving}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* File Upload Section */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-cyan-400" />
            Upload Files
          </h2>
          
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-cyan-400/50 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">Drag and drop files here, or click to select</p>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              multiple={false}
            />
            <label
              htmlFor="file-upload"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer inline-block"
            >
              Choose File
            </label>
            <p className="text-sm text-gray-400 mt-2">Maximum file size: 10MB</p>
          </div>
        </div>

        {/* Files Grid */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <File className="h-5 w-5 mr-2 text-cyan-400" />
            Files ({folderContent.files.length})
          </h2>
          
          {folderContent.files.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No files uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folderContent.files.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 hover:border-cyan-400/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        {getFileIcon(file.file_type || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{file.name}</h3>
                        <p className="text-sm text-gray-400">
                          {file.file_size ? formatFileSize(file.file_size) : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 px-3 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Added: {new Date(file.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FileText className="h-5 w-5 mr-2 text-cyan-400" />
              Secure Notes
            </h2>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {showNotes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showNotes ? 'Hide' : 'Show'} Notes</span>
            </button>
          </div>
          
          {showNotes && (
            <div className="space-y-4">
              {editingNotes ? (
                <div>
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-none"
                    placeholder="Write your secure notes here..."
                  />
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleSaveNotes}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Notes</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setTempNotes(folderContent.notes);
                      }}
                      className="bg-gray-700/50 hover:bg-gray-600/50 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-900/50 rounded-lg p-4 min-h-[200px] border border-gray-600/50">
                    {folderContent.notes ? (
                      <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                        {folderContent.notes}
                      </pre>
                    ) : (
                      <p className="text-gray-500 italic">No notes yet. Click edit to add some.</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingNotes(true);
                      setTempNotes(folderContent.notes);
                    }}
                    className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Notes</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
    </div>
  );
}