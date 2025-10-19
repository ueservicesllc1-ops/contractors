'use client';

import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { uploadFile } from '@/lib/backblaze';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onFileUploaded: (url: string, fileName: string) => void;
  onFileRemoved?: (fileName: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  folder?: string;
  multiple?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export default function FileUpload({
  onFileUploaded,
  onFileRemoved,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxSize = 10,
  folder = 'uploads',
  multiple = false,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate file size
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        const url = await uploadFile(file, folder);
        
        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url,
          size: file.size,
          type: file.type,
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        onFileUploaded(url, file.name);
      }

      toast.success('Archivos subidos exitosamente');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error al subir archivos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (fileId: string, fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (onFileRemoved) {
      onFileRemoved(fileName);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type === 'application/pdf') {
      return '📄';
    } else if (type.includes('word') || type.includes('document')) {
      return '📝';
    } else {
      return '📁';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
          isUploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Subiendo archivos...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Haz clic para subir
                </span>
                {' '}o arrastra archivos aquí
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tipos permitidos: {acceptedTypes.join(', ')}
              </p>
              <p className="text-xs text-gray-500">
                Tamaño máximo: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Archivos subidos:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver
                  </a>
                  <button
                    onClick={() => handleRemoveFile(file.id, file.name)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
