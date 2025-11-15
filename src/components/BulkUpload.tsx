import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';
import { uploadDocument } from '../services/uploadService';

interface UploadStatus {
  filename: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function BulkUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const initialUploads: UploadStatus[] = files.map(file => ({
      filename: file.name,
      status: 'pending',
    }));

    setUploads(initialUploads);
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setUploads(prev => prev.map((upload, idx) =>
        idx === i ? { ...upload, status: 'uploading' } : upload
      ));

      try {
        await uploadDocument(file);
        setUploads(prev => prev.map((upload, idx) =>
          idx === i ? { ...upload, status: 'success' } : upload
        ));
      } catch (error) {
        setUploads(prev => prev.map((upload, idx) =>
          idx === i ? {
            ...upload,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : upload
        ));
      }
    }

    setIsUploading(false);
    onUploadComplete();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'uploading':
        return <Loader className="w-5 h-5 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return 'Processing...';
      case 'success':
        return 'Complete';
      case 'error':
        return 'Failed';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Bulk Document Upload</h3>
          <p className="text-sm text-gray-400 mt-1">
            Upload multiple PDF files at once
          </p>
        </div>
        <label className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-accent/30 hover:ring-2 hover:ring-accent/50 transition-all duration-300 flex items-center gap-2 cursor-pointer transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
          <Upload className="w-4 h-4" />
          Select Files
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {uploads.length > 0 && (
        <div className="bg-dark-card rounded-2xl border border-white/10 p-4 space-y-2 max-h-96 overflow-y-auto">
          {uploads.map((upload, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-dark/50 rounded-xl border border-white/5"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(upload.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{upload.filename}</p>
                  {upload.error && (
                    <p className="text-xs text-red-400 mt-0.5">{upload.error}</p>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                upload.status === 'success' ? 'bg-green-500/10 text-green-400' :
                upload.status === 'error' ? 'bg-red-500/10 text-red-400' :
                upload.status === 'uploading' ? 'bg-primary/10 text-primary' :
                'bg-gray-500/10 text-gray-400'
              }`}>
                {getStatusText(upload.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-2 rounded-lg h-fit">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• You can select multiple PDF files at once</p>
            <p>• Files will be processed sequentially</p>
            <p>• Once uploaded, documents are permanently stored</p>
            <p>• Maximum recommended size: 50MB per file</p>
          </div>
        </div>
      </div>
    </div>
  );
}
