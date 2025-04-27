'use client';

import { useState } from 'react';
import { CloudCostData } from '@/lib/csv/parser';
import { CostAnalysis } from '@/lib/analysis/costAnalysis';
import FileUploader from '@/components/upload/FileUploader';
import AnalysisResults from '@/components/analysis/AnalysisResults';

export default function Dashboard() {
  const [cloudCostData, setCloudCostData] = useState<CloudCostData | null>(null);
  const [analysis, setAnalysis] = useState<CostAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDataUploaded = async (data: CloudCostData) => {
    setCloudCostData(data);
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cloudCostData: data }),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Erro ao processar resposta JSON:', jsonError);
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.');
      }
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao analisar os dados');
      }
      
      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'Dados de análise inválidos retornados pelo servidor');
      }
      
      setAnalysis(result.analysis);
    } catch (err) {
      console.error('Erro na análise:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao analisar os dados');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Análise de Custos em Nuvem
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Faça upload do seu arquivo CSV de custos em nuvem para visualizar análises detalhadas e tendências de gastos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Upload de Dados</h2>
              <FileUploader onDataUploaded={handleDataUploaded} />
            </div>
          </div>
          
          <div className="lg:col-span-8">
            {isAnalyzing ? (
              <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Analisando dados de custos em nuvem...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Erro na análise</h3>
                  <p>{error}</p>
                </div>
              </div>
            ) : cloudCostData && analysis ? (
              <AnalysisResults cloudCostData={cloudCostData} analysis={analysis} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[400px]">
                <svg
                  className="w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <p className="text-gray-600 text-lg mb-2">Nenhum dado para análise</p>
                <p className="text-gray-500">
                  Faça upload de um arquivo CSV de custos em nuvem para visualizar análises detalhadas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
