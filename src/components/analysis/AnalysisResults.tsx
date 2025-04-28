'use client';

import { useState } from 'react';
import { CloudCostData } from '@/lib/csv/parser';
import { CostAnalysis } from '@/lib/analysis/costAnalysis';
import { CostAnomaly, detectCostAnomalies, detectRapidGrowthTrends } from '@/lib/analysis/anomalyDetection';
import { comparePeriods, projectFutureCosts, PeriodComparisonResult } from '@/lib/analysis/periodComparison';
import { TrendChart, PieChart, ServiceTrendChart, ComparisonChart, HeatmapChart, GrowthRateChart } from '@/components/charts/Charts';

interface AnalysisResultsProps {
  cloudCostData: CloudCostData;
  analysis: CostAnalysis;
}

export default function AnalysisResults({ cloudCostData, analysis }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Detectar anomalias nos dados
  const anomalies = detectCostAnomalies(cloudCostData);
  
  // Detectar tendências de crescimento rápido
  const growthTrends = detectRapidGrowthTrends(cloudCostData);
  
  // Comparar períodos
  const periodComparison = comparePeriods(cloudCostData);
  
  // Projetar custos futuros
  const costProjections = projectFutureCosts(cloudCostData);
  
  // Preparar dados para o mapa de calor
  const topServices = analysis.topServices.slice(0, 5).map(service => service.name);
  const heatmapData = analysis.topServices.slice(0, 5).map(service => 
    cloudCostData.months.map(month => service.trend.find(t => t.month === month)?.cost || 0)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Resultados da Análise</h2>
      
      {/* Tabs de navegação */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tendências
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Serviços
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comparação
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'anomalies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Anomalias
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                  <TrendChart 
                    trends={analysis.trends} 
                    height={250} 
                    showAnomalies={true}
                    anomalies={anomalies}
                  />
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
                
                {anomalies.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                    <p className="text-red-800">
                      Detectadas {anomalies.length} anomalias de custo. Acesse a aba "Anomalias" para mais detalhes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Tendências de Custo</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <TrendChart 
                trends={analysis.trends} 
                height={300}
                showAnomalies={true}
                anomalies={anomalies}
              />
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Projeção de Custos Futuros</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  {costProjections.length > 0 ? (
                    <div>
                      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                        <p className="text-yellow-800">
                          Projeção para os próximos {costProjections.length} meses com base nas tendências atuais.
                          Os valores podem variar dependendo de mudanças no uso dos serviços.
                        </p>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mês
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Custo Projetado
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Limite Inferior
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Limite Superior
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {costProjections.map((projection, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {projection.month}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  R$ {projection.projectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  R$ {projection.lowerBound.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  R$ {projection.upperBound.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 p-4">
                      Não há dados suficientes para gerar projeções de custos futuros.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">Mapa de Calor de Custos</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  {topServices.length > 0 ? (
                    <HeatmapChart 
                      services={topServices}
                      months={cloudCostData.months}
                      data={heatmapData}
                      height={300}
                    />
                  ) : (
                    <p className="text-gray-500 p-4">
                      Não há dados suficientes para gerar o mapa de calor.
                    </p>
                  )}
                </div>
              </div>
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
              <h3 className="text-xl font-semibold mb-4">Serviços com Crescimento Rápido</h3>
              {growthTrends.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <GrowthRateChart 
                    services={growthTrends.map(trend => ({
                      name: trend.service,
                      growthRate: trend.averageGrowth
                    }))}
                    height={300}
                  />
                </div>
              ) : (
                <p className="text-gray-500 p-4">
                  Não há dados suficientes para identificar serviços com crescimento rápido.
                </p>
              )}
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Detalhes dos Serviços</h3>
              <div className="space-y-8">
                {analysis.topServices.map((service, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{service.name}</h4>
                        <p className="text-gray-500">
                          {service.percentOfTotal.toFixed(1)}% do custo total
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          R$ {service.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    
                    <ServiceTrendChart service={service} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'comparison' && (
          <div>
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-4">Comparação de Custos</h4>
              <ComparisonChart 
                currentPeriod={{
                  months: periodComparison.currentPeriod.months,
                  cost: periodComparison.currentPeriod.totalCost
                }}
                previousPeriod={{
                  months: periodComparison.previousPeriod.months,
                  cost: periodComparison.previousPeriod.totalCost
                }}
                percentChange={periodComparison.totalChange.percentage}
                height={300}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-medium mb-4">Maiores Aumentos</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {periodComparison.topIncreases.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Serviço
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variação
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Custo Atual
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {periodComparison.topIncreases.map((service, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {service.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                +{service.percentageChange.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                R$ {service.currentPeriodCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 p-4">
                      Não há dados suficientes para identificar aumentos significativos.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4">Maiores Reduções</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {periodComparison.topDecreases.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Serviço
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variação
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Custo Atual
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {periodComparison.topDecreases.map((service, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {service.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {service.percentageChange.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                R$ {service.currentPeriodCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 p-4">
                      Não há dados suficientes para identificar reduções significativas.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Insights da Comparação</h4>
              <div className="space-y-4">
                {periodComparison.insights.map((insight, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'anomalies' && (
          <div>
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-4">Detecção de Anomalias</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <TrendChart 
                  trends={analysis.trends} 
                  height={300}
                  showAnomalies={true}
                  anomalies={anomalies}
                  title="Tendência de Custos com Anomalias Destacadas"
                />
              </div>
              
              {anomalies.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800">
                      Foram detectadas {anomalies.length} anomalias nos dados de custo. 
                      Anomalias são desvios significativos do padrão esperado com base no histórico.
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mês
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Serviço
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Severidade
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Desvio
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Custo Atual
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Custo Esperado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {anomalies.map((anomaly, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {anomaly.month}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {anomaly.service}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                anomaly.severity === 'high' 
                                  ? 'bg-red-100 text-red-800' 
                                  : anomaly.severity === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {anomaly.severity === 'high' 
                                  ? 'Alta' 
                                  : anomaly.severity === 'medium'
                                    ? 'Média'
                                    : 'Baixa'
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={anomaly.percentDeviation > 0 ? 'text-red-600' : 'text-green-600'}>
                                {anomaly.percentDeviation > 0 ? '+' : ''}
                                {anomaly.percentDeviation.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              R$ {anomaly.actualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              R$ {anomaly.expectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    Não foram detectadas anomalias significativas nos dados de custo.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Serviços com Crescimento Rápido</h4>
              {growthTrends.length > 0 ? (
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                    <GrowthRateChart 
                      services={growthTrends.map(trend => ({
                        name: trend.service,
                        growthRate: trend.averageGrowth
                      }))}
                      height={300}
                      title="Taxa de Crescimento Médio por Serviço"
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Serviço
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Crescimento Médio
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Período Analisado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {growthTrends.map((trend, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {trend.service}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              +{trend.averageGrowth.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trend.months.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 p-4">
                  Não há dados suficientes para identificar serviços com crescimento rápido.
                </p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Insights e Recomendações</h3>
            <div className="space-y-6">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-blue-800">{insight}</p>
                </div>
              ))}
              
              {periodComparison.insights.map((insight, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="text-purple-800">{insight}</p>
                </div>
              ))}
              
              {anomalies.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-medium text-red-800 mb-2">Anomalias Detectadas</h4>
                  <p className="text-red-800">
                    Foram detectadas {anomalies.length} anomalias nos dados de custo. 
                    Recomendamos investigar especialmente as anomalias de severidade alta.
                  </p>
                </div>
              )}
              
              {growthTrends.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-medium text-yellow-800 mb-2">Serviços com Crescimento Rápido</h4>
                  <p className="text-yellow-800">
                    Identificamos {growthTrends.length} serviços com crescimento acelerado.
                    Recomendamos revisar o uso destes serviços para evitar aumentos inesperados de custo.
                  </p>
                </div>
              )}
              
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-medium text-green-800 mb-2">Recomendações Gerais</h4>
                <ul className="list-disc pl-5 text-green-800 space-y-2">
                  <li>Revise regularmente os serviços com maior custo para identificar oportunidades de otimização.</li>
                  <li>Configure alertas de orçamento para serviços com crescimento rápido.</li>
                  <li>Considere reservas de instâncias para serviços com uso previsível e constante.</li>
                  <li>Implemente políticas de governança para evitar recursos ociosos ou superdimensionados.</li>
                  <li>Analise mensalmente as tendências de custo para identificar desvios do esperado.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
