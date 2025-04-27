'use client';

import { useState } from 'react';
import { CloudCostData } from '@/lib/csv/parser';
import { CostAnalysis } from '@/lib/analysis/costAnalysis';
import { TrendChart, PieChart, ServiceTrendChart } from '@/components/charts/Charts';

interface AnalysisResultsProps {
  cloudCostData: CloudCostData;
  analysis: CostAnalysis;
}

export default function AnalysisResults({ cloudCostData, analysis }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Resultados da Análise</h2>
      
      {/* Tabs de navegação */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tendências
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Serviços
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insights
          </button>
        </nav>
      </div>
      
      {/* Conteúdo da tab selecionada */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Custo Total</h3>
                <p className="text-3xl font-bold text-blue-900">
                  R$ {analysis.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Período: {cloudCostData.months[0]} - {cloudCostData.months[cloudCostData.months.length - 1]}
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-2">Comparação de Períodos</h3>
                <p className="text-3xl font-bold text-green-900">
                  {analysis.monthlyComparison.percentChange > 0 ? '+' : ''}
                  {analysis.monthlyComparison.percentChange.toFixed(1)}%
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Últimos 3 meses vs 3 meses anteriores
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Principal Serviço</h3>
                <p className="text-3xl font-bold text-purple-900">
                  {analysis.topServices[0]?.name || 'N/A'}
                </p>
                <p className="text-sm text-purple-700 mt-2">
                  {analysis.topServices[0]?.percentOfTotal.toFixed(1)}% do custo total
                </p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Tendência de Custos</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <TrendChart trends={analysis.trends} height={250} />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Distribuição de Custos</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <PieChart services={analysis.costBreakdown.services} height={250} />
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Principais Insights</h3>
              <div className="space-y-4">
                {analysis.insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Tendências de Custo</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <TrendChart trends={analysis.trends} height={300} />
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Dados de Tendência</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mês
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Custo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysis.trends.map((trend, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {trend.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trend.percentChange !== undefined ? (
                            <span className={trend.percentChange > 0 ? 'text-red-600' : trend.percentChange < 0 ? 'text-green-600' : 'text-gray-500'}>
                              {trend.percentChange > 0 ? '+' : ''}
                              {trend.percentChange.toFixed(1)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'services' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Principais Serviços</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <PieChart services={analysis.costBreakdown.services} height={300} />
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Análise de Serviços</h3>
              <div className="space-y-6">
                {analysis.topServices.map((service, index) => (
                  <div key={index} className="bg-white p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-lg font-medium mb-2">{service.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Custo Total</p>
                        <p className="text-lg font-semibold">
                          R$ {service.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">% do Total</p>
                        <p className="text-lg font-semibold">{service.percentOfTotal.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tendência</p>
                        <p className="text-lg font-semibold">
                          {service.trend[service.trend.length - 1]?.percentChange !== undefined ? (
                            <span className={service.trend[service.trend.length - 1].percentChange! > 0 ? 'text-red-600' : 'text-green-600'}>
                              {service.trend[service.trend.length - 1].percentChange! > 0 ? '+' : ''}
                              {service.trend[service.trend.length - 1].percentChange!.toFixed(1)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </p>
                      </div>
                    </div>
                    <ServiceTrendChart service={service} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Insights e Recomendações</h3>
            <div className="space-y-4">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <h4 className="text-lg font-medium text-yellow-800 mb-2">Comparação de Períodos</h4>
              <p className="text-yellow-700 mb-4">
                Últimos 3 meses: R$ {analysis.monthlyComparison.currentPeriod.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <br />
                3 meses anteriores: R$ {analysis.monthlyComparison.previousPeriod.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-yellow-800 font-medium">
                Variação: {analysis.monthlyComparison.percentChange > 0 ? '+' : ''}
                {analysis.monthlyComparison.percentChange.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
