/**
 * Atualiza a função de análise de custos para incluir detecção de anomalias
 */

import { CloudCostData, ServiceCost } from '@/lib/csv/parser';
import { CostAnomaly, detectCostAnomalies } from './anomalyDetection';
import { comparePeriods, PeriodComparisonResult } from './periodComparison';

export interface CostTrend {
  month: string;
  cost: number;
  percentChange?: number;
}

export interface ServiceAnalysis {
  name: string;
  totalCost: number;
  percentOfTotal: number;
  trend: CostTrend[];
}

export interface CostComparison {
  currentPeriod: {
    months: string[];
    cost: number;
  };
  previousPeriod: {
    months: string[];
    cost: number;
  };
  percentChange: number;
}

export interface CostAnalysis {
  totalCost: number;
  trends: CostTrend[];
  topServices: ServiceAnalysis[];
  monthlyComparison: CostComparison;
  costBreakdown: {
    services: {
      name: string;
      cost: number;
      percentage: number;
    }[];
  };
  insights: string[];
  anomalies: CostAnomaly[];
  periodComparison: PeriodComparisonResult;
}

/**
 * Analisa os dados de custos em nuvem e gera insights
 */
export function analyzeCloudCosts(data: CloudCostData): CostAnalysis {
  const { services, months, totalsByMonth } = data;
  
  // Calcular custo total
  const totalCost = Object.values(totalsByMonth).reduce((sum, cost) => sum + cost, 0);
  
  // Calcular tendências de custo
  const trends = calculateCostTrends(months, totalsByMonth);
  
  // Identificar os serviços com maior custo
  const topServices = identifyTopServices(services, months, totalCost);
  
  // Comparar períodos (últimos 3 meses vs 3 meses anteriores)
  const monthlyComparison = compareTimePeriods(months, totalsByMonth);
  
  // Calcular distribuição de custos por serviço
  const costBreakdown = calculateCostBreakdown(services, months);
  
  // Detectar anomalias nos dados
  const anomalies = detectCostAnomalies(data);
  
  // Comparação avançada entre períodos
  const periodComparison = comparePeriods(data);
  
  // Gerar insights baseados nos dados
  const insights = generateInsights(trends, topServices, monthlyComparison, costBreakdown, anomalies);
  
  return {
    totalCost,
    trends,
    topServices,
    monthlyComparison,
    costBreakdown,
    insights,
    anomalies,
    periodComparison
  };
}

/**
 * Calcula tendências de custo ao longo do tempo
 */
function calculateCostTrends(months: string[], totalsByMonth: Record<string, number>): CostTrend[] {
  const trends: CostTrend[] = [];
  
  months.forEach((month, index) => {
    const cost = totalsByMonth[month] || 0;
    const trend: CostTrend = { month, cost };
    
    // Calcular variação percentual em relação ao mês anterior
    if (index > 0) {
      const previousMonth = months[index - 1];
      const previousCost = totalsByMonth[previousMonth] || 0;
      
      if (previousCost > 0) {
        trend.percentChange = ((cost - previousCost) / previousCost) * 100;
      }
    }
    
    trends.push(trend);
  });
  
  return trends;
}

/**
 * Identifica os serviços com maior custo
 */
function identifyTopServices(services: ServiceCost[], months: string[], totalCost: number): ServiceAnalysis[] {
  // Calcular custo total por serviço
  const serviceCosts = services.map(service => {
    const totalServiceCost = Object.values(service.costs).reduce((sum, cost) => sum + cost, 0);
    
    // Calcular tendência de custo para este serviço
    const trend = months.map((month, index) => {
      const cost = service.costs[month] || 0;
      const trend: CostTrend = { month, cost };
      
      if (index > 0) {
        const previousMonth = months[index - 1];
        const previousCost = service.costs[previousMonth] || 0;
        
        if (previousCost > 0) {
          trend.percentChange = ((cost - previousCost) / previousCost) * 100;
        }
      }
      
      return trend;
    });
    
    return {
      name: service.name,
      totalCost: totalServiceCost,
      percentOfTotal: (totalServiceCost / totalCost) * 100,
      trend
    };
  });
  
  // Ordenar por custo total (decrescente) e pegar os top 5
  return serviceCosts.sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);
}

/**
 * Compara custos entre períodos de tempo
 */
function compareTimePeriods(months: string[], totalsByMonth: Record<string, number>): CostComparison {
  // Dividir os meses em períodos (últimos 3 meses vs 3 meses anteriores)
  const recentMonths = months.slice(-3);
  const previousMonths = months.slice(-6, -3);
  
  // Calcular custos para cada período
  const recentCost = recentMonths.reduce((sum, month) => sum + (totalsByMonth[month] || 0), 0);
  const previousCost = previousMonths.reduce((sum, month) => sum + (totalsByMonth[month] || 0), 0);
  
  // Calcular variação percentual
  const percentChange = previousCost > 0 
    ? ((recentCost - previousCost) / previousCost) * 100 
    : 0;
  
  return {
    currentPeriod: {
      months: recentMonths,
      cost: recentCost
    },
    previousPeriod: {
      months: previousMonths,
      cost: previousCost
    },
    percentChange
  };
}

/**
 * Calcula a distribuição de custos por serviço
 */
function calculateCostBreakdown(services: ServiceCost[], months: string[]) {
  // Considerar apenas os últimos 3 meses para a análise
  const recentMonths = months.slice(-3);
  
  // Calcular custo total por serviço nos últimos 3 meses
  const serviceCosts = services.map(service => {
    const cost = recentMonths.reduce((sum, month) => sum + (service.costs[month] || 0), 0);
    
    return {
      name: service.name,
      cost
    };
  });
  
  // Calcular custo total para determinar percentuais
  const totalCost = serviceCosts.reduce((sum, service) => sum + service.cost, 0);
  
  // Adicionar percentual a cada serviço
  const servicesWithPercentage = serviceCosts.map(service => ({
    ...service,
    percentage: (service.cost / totalCost) * 100
  }));
  
  // Ordenar por custo (decrescente)
  return {
    services: servicesWithPercentage.sort((a, b) => b.cost - a.cost)
  };
}

/**
 * Gera insights baseados nos dados analisados
 */
function generateInsights(
  trends: CostTrend[],
  topServices: ServiceAnalysis[],
  comparison: CostComparison,
  costBreakdown: { services: { name: string; cost: number; percentage: number }[] },
  anomalies: CostAnomaly[]
): string[] {
  const insights: string[] = [];
  
  // Insight sobre tendência geral
  const lastTrend = trends[trends.length - 1];
  if (lastTrend && lastTrend.percentChange !== undefined) {
    if (lastTrend.percentChange > 5) {
      insights.push(`Os custos aumentaram ${lastTrend.percentChange.toFixed(1)}% no último mês. Recomendamos uma análise detalhada para identificar as causas.`);
    } else if (lastTrend.percentChange < -5) {
      insights.push(`Os custos diminuíram ${Math.abs(lastTrend.percentChange).toFixed(1)}% no último mês. Continue monitorando para manter esta tendência positiva.`);
    } else {
      insights.push(`Os custos se mantiveram estáveis no último mês (variação de ${lastTrend.percentChange.toFixed(1)}%).`);
    }
  }
  
  // Insight sobre comparação de períodos
  if (comparison.percentChange > 10) {
    insights.push(`Os custos nos últimos 3 meses aumentaram ${comparison.percentChange.toFixed(1)}% em relação ao período anterior. Considere revisar sua estratégia de uso de recursos.`);
  } else if (comparison.percentChange < -10) {
    insights.push(`Os custos nos últimos 3 meses diminuíram ${Math.abs(comparison.percentChange).toFixed(1)}% em relação ao período anterior. Suas otimizações estão funcionando bem.`);
  }
  
  // Insight sobre serviços de maior custo
  if (topServices.length > 0) {
    const topService = topServices[0];
    insights.push(`${topService.name} representa ${topService.percentOfTotal.toFixed(1)}% dos seus custos totais. ${
      topService.percentOfTotal > 30 
        ? 'Considere otimizar este serviço para reduzir custos significativamente.' 
        : 'Continue monitorando este serviço.'
    }`);
    
    // Verificar serviços com crescimento rápido
    const growingServices = topServices.filter(service => {
      const lastTrend = service.trend[service.trend.length - 1];
      return lastTrend && lastTrend.percentChange !== undefined && lastTrend.percentChange > 15;
    });
    
    if (growingServices.length > 0) {
      const serviceNames = growingServices.map(s => s.name).join(', ');
      insights.push(`Os seguintes serviços apresentaram crescimento significativo no último mês: ${serviceNames}. Recomendamos uma análise detalhada.`);
    }
  }
  
  // Insight sobre distribuição de custos
  const topThreeServices = costBreakdown.services.slice(0, 3);
  const topThreePercentage = topThreeServices.reduce((sum, service) => sum + service.percentage, 0);
  
  if (topThreePercentage > 70) {
    insights.push(`Os três principais serviços (${topThreeServices.map(s => s.name).join(', ')}) representam ${topThreePercentage.toFixed(1)}% dos seus custos. Sua infraestrutura está concentrada em poucos serviços.`);
  }
  
  // Insights sobre anomalias detectadas
  if (anomalies.length > 0) {
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    
    if (highSeverityAnomalies.length > 0) {
      insights.push(`Detectamos ${highSeverityAnomalies.length} anomalias de alta severidade nos custos. Recomendamos verificar imediatamente os serviços afetados.`);
    }
    
    // Destacar a anomalia mais significativa
    const mostSignificantAnomaly = anomalies.sort((a, b) => Math.abs(b.percentDeviation) - Math.abs(a.percentDeviation))[0];
    if (mostSignificantAnomaly) {
      const direction = mostSignificantAnomaly.percentDeviation > 0 ? 'aumento' : 'redução';
      insights.push(`A anomalia mais significativa foi um ${direction} de ${Math.abs(mostSignificantAnomaly.percentDeviation).toFixed(1)}% em ${mostSignificantAnomaly.service} durante ${mostSignificantAnomaly.month}.`);
    }
  }
  
  // Adicionar recomendação geral
  insights.push('Recomendamos revisar regularmente seus recursos não utilizados e considerar reservas para recursos de uso constante para otimizar custos.');
  
  return insights;
}
