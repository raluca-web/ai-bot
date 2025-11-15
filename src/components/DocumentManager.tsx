import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Calendar, HardDrive } from 'lucide-react';
import { fetchDocuments } from '../services/chatService';
import { deleteDocument } from '../services/uploadService';
import BulkUpload from './BulkUpload';
import type { Document } from '../types';

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(documentId);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-dark-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-dark px-6 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Document Library</h2>
                <p className="text-white/70 text-sm mt-1">
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'} available
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-white text-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-accent hover:text-dark hover:ring-2 hover:ring-accent transition-all duration-300 flex items-center gap-2 shadow-lg transform hover:scale-105"
            >
              <Upload className="w-4 h-4" />
              {showUpload ? 'Hide Upload' : 'Upload PDFs'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {showUpload && (
            <div className="mb-6">
              <BulkUpload onUploadComplete={loadDocuments} />
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-primary/10 border border-primary/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No documents yet</h3>
              <p className="text-gray-400 mb-6">
                Upload your first PDF document to get started with AI-powered Q&A
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-accent/30 hover:ring-2 hover:ring-accent/50 transition-all duration-300 inline-flex items-center gap-2 transform hover:scale-105"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-white/10 rounded-2xl p-5 hover:border-accent/50 hover:bg-dark-card/50 transition-all duration-300 backdrop-blur-sm transform hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3 truncate">
                          {doc.filename}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(doc.upload_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{doc.page_count} pages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2.5 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 backdrop-blur-sm">
        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-3 rounded-xl h-fit shadow-lg shadow-primary/20">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">How to add documents</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Upload PDF files containing your software documentation. The AI will automatically process and index them for intelligent question answering. Supported formats: PDF only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
