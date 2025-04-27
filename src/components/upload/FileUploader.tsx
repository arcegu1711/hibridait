'use client';

import { useState } from 'react';
import { CloudCostData } from '@/lib/csv/parser';
import { useRouter } from 'next/navigation';

interface FileUploaderProps {
  onDataUploaded?: (data: CloudCostData) => void;
}

export default function FileUploader({ onDataUploaded }: FileUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [data, setData] = useState<CloudCostData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('Por favor, selecione um arquivo CSV para upload');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setUploadError('O arquivo deve estar no formato CSV');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Erro ao processar resposta JSON:', jsonError);
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload do arquivo');
      }
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Dados inválidos retornados pelo servidor');
      }

      setData(result.data);
      setUploadSuccess(true);
      
      // Se tiver uma função de callback para dados carregados, use-a
      if (onDataUploaded && result.data) {
        onDataUploaded(result.data);
      } else {
        // Caso contrário, redirecione para o dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500); // Pequeno atraso para mostrar a mensagem de sucesso
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro desconhecido ao processar o arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload de Custos em Nuvem</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="hidden"
            accept=".csv"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <span className="text-gray-600 font-medium">
              {file ? file.name : 'Clique para selecionar um arquivo CSV'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Apenas arquivos CSV são aceitos
            </span>
          </label>
        </div>

        {file && (
          <div className="text-sm text-gray-600 mt-2">
            <p>Nome: {file.name}</p>
            <p>Tamanho: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {uploadError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            Arquivo processado com sucesso! Redirecionando para análise...
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !file || isUploading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Processando...' : 'Enviar Arquivo'}
        </button>
      </form>
    </div>
  );
}
