'use client';

import { useState } from 'react';
import FileUploader from '@/components/upload/FileUploader';
import { CloudCostData } from '@/lib/csv/parser';

export default function Home() {
  const [cloudCostData, setCloudCostData] = useState<CloudCostData | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Análise de Custos em Nuvem
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Faça upload do seu arquivo CSV de custos em nuvem para visualizar análises detalhadas e tendências de gastos.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <FileUploader />
        </div>
      </div>
    </main>
  );
}
