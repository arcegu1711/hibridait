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
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-gray-700">
                    Não foram identificados serviços com crescimento rápido no período analisado.
                  </p>
                </div>
              )}
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
        
        {activeTab === 'comparison' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Comparação entre Períodos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium mb-4">Comparação de Custos</h4>
                <ComparisonChart 
                  currentPeriod={periodComparison.currentPeriod}
                  previousPeriod={periodComparison.previousPeriod}
                  percentChange={periodComparison.totalChange.percentage}
                  height={300}
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium mb-4">Detalhes da Comparação</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-800 mb-1">Período Atual</h5>
                      <p className="text-xl font-bold text-blue-900">
                        R$ {periodComparison.currentPeriod.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {periodComparison.currentPeriod.months.join(', ')}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-800 mb-1">Período Anterior</h5>
                      <p className="text-xl font-bold text-gray-900">
                        R$ {periodComparison.previousPeriod.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-700 mt-1">
                        {periodComparison.previousPeriod.months.join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${
                    periodComparison.totalChange.percentage > 0 
                      ? 'bg-red-50 text-red-800' 
                      : periodComparison.totalChange.percentage < 0 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-gray-50 text-gray-800'
                  }`}>
                    <h5 className="font-medium mb-1">Variação Total</h5>
                    <p className="text-lg font-bold">
                      {periodComparison.totalChange.percentage > 0 ? '+' : ''}
                      {periodComparison.totalChange.percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm mt-1">
                      Diferença absoluta: R$ {periodComparison.totalChange.absolute.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Maiores Variações</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h5 className="text-md font-medium text-red-800 mb-2">Maiores Aumentos</h5>
                  {periodComparison.topIncreases.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Serviço
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variação
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Custo Atual
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {periodComparison.topIncreases.map((service, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {service.name}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                                +{service.percentageChange.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                R$ {service.currentPeriodCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                      Não foram identificados aumentos significativos.
                    </p>
                  )}
                </div>
                
                <div>
                  <h5 className="text-md font-medium text-green-800 mb-2">Maiores Reduções</h5>
                  {periodComparison.topDecreases.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Serviço
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variação
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Custo Atual
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {periodComparison.topDecreases.map((service, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {service.name}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">
                                {service.percentageChange.toFixed(1)}%
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                R$ {service.currentPeriodCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
                      Não foram identificadas reduções significativas.
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
            <h3 className="text-xl font-semibold mb-4">Detecção de Anomalias</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <TrendChart 
                trends={analysis.trends} 
                height={300}
                showAnomalies={true}
                anomalies={anomalies}
                title="Tendência de Custos com Anomalias Destacadas"
              />
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Anomalias Detectadas</h4>
              
              {anomalies.length > 0 ? (
                <div className="space-y-4">
                  {anomalies.map((anomaly, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      anomaly.severity === 'high' 
                        ? 'bg-red-50 border-red-500 text-red-800' 
                        : anomaly.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                          : 'bg-orange-50 border-orange-500 text-orange-800'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium mb-1">
                            {anomaly.service} - {anomaly.month}
                          </h5>
                          <p className="text-sm mb-2">{anomaly.message}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Custo Esperado:</span> R$ {anomaly.expectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div>
                              <span className="font-medium">Custo Real:</span> R$ {anomaly.actualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          anomaly.severity === 'high' 
                            ? 'bg-red-200 text-red-800' 
                            : anomaly.severity === 'medium'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-orange-200 text-orange-800'
                        }`}>
                          {anomaly.severity === 'high' 
                            ? 'Alta' 
                            : anomaly.severity === 'medium'
                              ? 'Média'
                              : 'Baixa'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    Não foram detectadas anomalias significativas nos dados de custos analisados.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Serviços com Crescimento Rápido</h4>
              
              {growthTrends.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <GrowthRateChart 
                      services={growthTrends.map(trend => ({
                        name: trend.service,
                        growthRate: trend.averageGrowth
                      }))}
                      height={300}
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800 mb-2 font-medium">
                      Serviços com crescimento acelerado requerem atenção
                    </p>
                    <p className="text-yellow-700 text-sm">
                      Os serviços listados acima apresentaram crescimento significativo no período analisado.
                      Recomendamos revisar o uso destes serviços para identificar possíveis otimizações ou
                      verificar se o aumento está alinhado com as necessidades do negócio.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    Não foram identificados serviços com crescimento rápido no período analisado.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Insights e Recomendações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-medium mb-4">Insights Gerais</h4>
                <div className="space-y-4">
                  {analysis.insights.map((insight, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-4">Insights de Comparação</h4>
                <div className="space-y-4">
                  {periodComparison.insights.map((insight, index) => (
                    <div key={index} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="text-green-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-4">Alertas de Anomalias</h4>
              
              {anomalies.length > 0 ? (
                <div className="space-y-4">
                  {anomalies.filter(a => a.severity === 'high').map((anomaly, index) => (
                    <div key={index} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <p className="text-red-800">{anomaly.message}</p>
                    </div>
                  ))}
                  
                  {anomalies.filter(a => a.severity === 'medium').map((anomaly, index) => (
                    <div key={index} className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <p className="text-yellow-800">{anomaly.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    Não foram detectadas anomalias significativas nos dados de custos analisados.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8 bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
              <h4 className="text-lg font-medium text-indigo-800 mb-4">Recomendações para Otimização de Custos</h4>
              <div className="space-y-3 text-indigo-700">
                <p>
                  <span className="font-medium">1. Recursos não utilizados:</span> Identifique e remova recursos que não estão sendo utilizados, como instâncias paradas, volumes não anexados e snapshots antigos.
                </p>
                <p>
                  <span className="font-medium">2. Dimensionamento adequado:</span> Verifique se os recursos estão corretamente dimensionados para suas necessidades. Considere reduzir o tamanho de instâncias subutilizadas.
                </p>
                <p>
                  <span className="font-medium">3. Instâncias reservadas:</span> Para cargas de trabalho previsíveis e de longo prazo, considere a compra de instâncias reservadas para obter descontos significativos.
                </p>
                <p>
                  <span className="font-medium">4. Auto Scaling:</span> Implemente políticas de Auto Scaling para ajustar automaticamente a capacidade com base na demanda.
                </p>
                <p>
                  <span className="font-medium">5. Políticas de ciclo de vida:</span> Configure políticas de ciclo de vida para dados de armazenamento, movendo dados acessados com menos frequência para níveis de armazenamento mais baratos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
