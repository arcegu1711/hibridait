/**
 * Biblioteca para comparação avançada entre períodos de custos em nuvem
 */

import { CloudCostData, ServiceCost } from '@/lib/csv/parser';

export interface PeriodData {
  name: string;
  months: string[];
  totalCost: number;
  serviceBreakdown: {
    name: string;
    cost: number;
    percentage: number;
  }[];
}

export interface ServiceComparisonData {
  name: string;
  currentPeriodCost: number;
  previousPeriodCost: number;
  absoluteChange: number;
  percentageChange: number;
  currentPeriodPercentage: number;
  previousPeriodPercentage: number;
}

export interface PeriodComparisonResult {
  currentPeriod: PeriodData;
  previousPeriod: PeriodData;
  totalChange: {
    absolute: number;
    percentage: number;
  };
  serviceComparison: ServiceComparisonData[];
  topIncreases: ServiceComparisonData[];
  topDecreases: ServiceComparisonData[];
  insights: string[];
}

/**
 * Compara dois períodos de tempo e gera análises detalhadas
 * @param data Dados de custos em nuvem
 * @param currentPeriodMonths Número de meses para o período atual (padrão: 3)
 * @param previousPeriodMonths Número de meses para o período anterior (padrão: 3)
 * @returns Resultado da comparação entre períodos
 */
export function comparePeriods(
  data: CloudCostData,
  currentPeriodMonths: number = 3,
  previousPeriodMonths: number = 3
): PeriodComparisonResult {
  const { services, months } = data;
  
  // Verificar se temos meses suficientes para a comparação
  if (months.length < (currentPeriodMonths + previousPeriodMonths)) {
    // Ajustar os períodos se não tivermos meses suficientes
    const totalMonths = months.length;
    currentPeriodMonths = Math.ceil(totalMonths / 2);
    previousPeriodMonths = totalMonths - currentPeriodMonths;
  }
  
  // Dividir os meses em períodos
  const currentMonths = months.slice(-currentPeriodMonths);
  const previousMonths = months.slice(-currentPeriodMonths - previousPeriodMonths, -currentPeriodMonths);
  
  // Calcular dados para cada período
  const currentPeriod = calculatePeriodData(services, currentMonths, 'Período Atual');
  const previousPeriod = calculatePeriodData(services, previousMonths, 'Período Anterior');
  
  // Calcular mudança total
  const totalChange = {
    absolute: currentPeriod.totalCost - previousPeriod.totalCost,
    percentage: previousPeriod.totalCost > 0 
      ? ((currentPeriod.totalCost - previousPeriod.totalCost) / previousPeriod.totalCost) * 100 
      : 0
  };
  
  // Comparar serviços entre períodos
  const serviceComparison = compareServices(services, currentMonths, previousMonths, currentPeriod.totalCost, previousPeriod.totalCost);
  
  // Identificar os maiores aumentos e reduções
  const topIncreases = [...serviceComparison]
    .filter(service => service.percentageChange > 0)
    .sort((a, b) => b.percentageChange - a.percentageChange)
    .slice(0, 5);
    
  const topDecreases = [...serviceComparison]
    .filter(service => service.percentageChange < 0)
    .sort((a, b) => a.percentageChange - b.percentageChange)
    .slice(0, 5);
  
  // Gerar insights baseados na comparação
  const insights = generateComparisonInsights(totalChange, serviceComparison, topIncreases, topDecreases);
  
  return {
    currentPeriod,
    previousPeriod,
    totalChange,
    serviceComparison,
    topIncreases,
    topDecreases,
    insights
  };
}

/**
 * Calcula dados para um período específico
 */
function calculatePeriodData(services: ServiceCost[], months: string[], periodName: string): PeriodData {
  // Calcular custo total para o período
  let totalCost = 0;
  const serviceBreakdown: { name: string; cost: number; percentage: number }[] = [];
  
  // Calcular custo por serviço
  services.forEach(service => {
    const serviceCost = months.reduce((sum, month) => sum + (service.costs[month] || 0), 0);
    totalCost += serviceCost;
    
    if (serviceCost > 0) {
      serviceBreakdown.push({
        name: service.name,
        cost: serviceCost,
        percentage: 0 // Será calculado depois que tivermos o custo total
      });
    }
    
    // Incluir subserviços, se existirem
    if (service.subServices && service.subServices.length > 0) {
      service.subServices.forEach(subService => {
        const subServiceCost = months.reduce((sum, month) => sum + (subService.costs[month] || 0), 0);
        
        if (subServiceCost > 0) {
          serviceBreakdown.push({
            name: `${service.name} > ${subService.name}`,
            cost: subServiceCost,
            percentage: 0 // Será calculado depois
          });
        }
      });
    }
  });
  
  // Calcular percentuais
  serviceBreakdown.forEach(service => {
    service.percentage = totalCost > 0 ? (service.cost / totalCost) * 100 : 0;
  });
  
  // Ordenar por custo (decrescente)
  serviceBreakdown.sort((a, b) => b.cost - a.cost);
  
  return {
    name: periodName,
    months,
    totalCost,
    serviceBreakdown
  };
}

/**
 * Compara serviços entre dois períodos
 */
function compareServices(
  services: ServiceCost[],
  currentMonths: string[],
  previousMonths: string[],
  currentTotalCost: number,
  previousTotalCost: number
): ServiceComparisonData[] {
  const serviceComparison: ServiceComparisonData[] = [];
  const processedServices = new Set<string>();
  
  // Processar serviços principais
  services.forEach(service => {
    const currentCost = currentMonths.reduce((sum, month) => sum + (service.costs[month] || 0), 0);
    const previousCost = previousMonths.reduce((sum, month) => sum + (service.costs[month] || 0), 0);
    
    // Adicionar à comparação se o serviço tiver custo em algum dos períodos
    if (currentCost > 0 || previousCost > 0) {
      serviceComparison.push({
        name: service.name,
        currentPeriodCost: currentCost,
        previousPeriodCost: previousCost,
        absoluteChange: currentCost - previousCost,
        percentageChange: previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : (currentCost > 0 ? 100 : 0),
        currentPeriodPercentage: currentTotalCost > 0 ? (currentCost / currentTotalCost) * 100 : 0,
        previousPeriodPercentage: previousTotalCost > 0 ? (previousCost / previousTotalCost) * 100 : 0
      });
      
      processedServices.add(service.name);
    }
    
    // Processar subserviços
    if (service.subServices && service.subServices.length > 0) {
      service.subServices.forEach(subService => {
        const subCurrentCost = currentMonths.reduce((sum, month) => sum + (subService.costs[month] || 0), 0);
        const subPreviousCost = previousMonths.reduce((sum, month) => sum + (subService.costs[month] || 0), 0);
        
        // Adicionar à comparação se o subserviço tiver custo em algum dos períodos
        if (subCurrentCost > 0 || subPreviousCost > 0) {
          const fullName = `${service.name} > ${subService.name}`;
          
          serviceComparison.push({
            name: fullName,
            currentPeriodCost: subCurrentCost,
            previousPeriodCost: subPreviousCost,
            absoluteChange: subCurrentCost - subPreviousCost,
            percentageChange: subPreviousCost > 0 ? ((subCurrentCost - subPreviousCost) / subPreviousCost) * 100 : (subCurrentCost > 0 ? 100 : 0),
            currentPeriodPercentage: currentTotalCost > 0 ? (subCurrentCost / currentTotalCost) * 100 : 0,
            previousPeriodPercentage: previousTotalCost > 0 ? (subPreviousCost / previousTotalCost) * 100 : 0
          });
          
          processedServices.add(fullName);
        }
      });
    }
  });
  
  // Ordenar por mudança absoluta (decrescente)
  return serviceComparison.sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange));
}

/**
 * Gera insights baseados na comparação entre períodos
 */
function generateComparisonInsights(
  totalChange: { absolute: number; percentage: number },
  serviceComparison: ServiceComparisonData[],
  topIncreases: ServiceComparisonData[],
  topDecreases: ServiceComparisonData[]
): string[] {
  const insights: string[] = [];
  
  // Insight sobre mudança total
  if (totalChange.percentage > 10) {
    insights.push(`Os custos aumentaram ${totalChange.percentage.toFixed(1)}% em relação ao período anterior. Recomendamos analisar os serviços com maior crescimento.`);
  } else if (totalChange.percentage < -10) {
    insights.push(`Os custos diminuíram ${Math.abs(totalChange.percentage).toFixed(1)}% em relação ao período anterior. Suas otimizações estão funcionando bem.`);
  } else {
    insights.push(`Os custos se mantiveram relativamente estáveis entre os períodos (variação de ${totalChange.percentage.toFixed(1)}%).`);
  }
  
  // Insight sobre maiores aumentos
  if (topIncreases.length > 0) {
    const significantIncreases = topIncreases.filter(service => service.percentageChange > 20 && service.absoluteChange > 100);
    
    if (significantIncreases.length > 0) {
      const serviceNames = significantIncreases.slice(0, 3).map(s => s.name).join(', ');
      insights.push(`Os serviços com maior aumento percentual foram: ${serviceNames}. Recomendamos revisar o uso destes serviços.`);
    }
  }
  
  // Insight sobre maiores reduções
  if (topDecreases.length > 0) {
    const significantDecreases = topDecreases.filter(service => service.percentageChange < -20 && Math.abs(service.absoluteChange) > 100);
    
    if (significantDecreases.length > 0) {
      const serviceNames = significantDecreases.slice(0, 3).map(s => s.name).join(', ');
      insights.push(`Os serviços com maior redução percentual foram: ${serviceNames}. Continue aplicando as mesmas estratégias de otimização.`);
    }
  }
  
  // Insight sobre mudanças na distribuição de custos
  const distributionChanges = serviceComparison
    .filter(service => Math.abs(service.currentPeriodPercentage - service.previousPeriodPercentage) > 5)
    .sort((a, b) => Math.abs(b.currentPeriodPercentage - b.previousPeriodPercentage) - Math.abs(a.currentPeriodPercentage - a.previousPeriodPercentage))
    .slice(0, 3);
  
  if (distributionChanges.length > 0) {
    const service = distributionChanges[0];
    const direction = service.currentPeriodPercentage > service.previousPeriodPercentage ? 'aumentou' : 'diminuiu';
    const change = Math.abs(service.currentPeriodPercentage - service.previousPeriodPercentage).toFixed(1);
    
    insights.push(`A participação do serviço ${service.name} no custo total ${direction} ${change} pontos percentuais (de ${service.previousPeriodPercentage.toFixed(1)}% para ${service.currentPeriodPercentage.toFixed(1)}%).`);
  }
  
  // Insight sobre novos serviços
  const newServices = serviceComparison.filter(service => service.previousPeriodCost === 0 && service.currentPeriodCost > 0);
  
  if (newServices.length > 0) {
    const significantNewServices = newServices.filter(service => service.currentPeriodPercentage > 1);
    
    if (significantNewServices.length > 0) {
      const count = significantNewServices.length;
      insights.push(`Foram identificados ${count} novos serviços com custo significativo no período atual. Verifique se estes serviços estão alinhados com suas necessidades de negócio.`);
    }
  }
  
  // Insight sobre serviços descontinuados
  const discontinuedServices = serviceComparison.filter(service => service.currentPeriodCost === 0 && service.previousPeriodCost > 0);
  
  if (discontinuedServices.length > 0) {
    const significantDiscontinued = discontinuedServices.filter(service => service.previousPeriodPercentage > 1);
    
    if (significantDiscontinued.length > 0) {
      const count = significantDiscontinued.length;
      insights.push(`${count} serviços com custo significativo no período anterior não apresentaram custos no período atual. Verifique se isto foi intencional.`);
    }
  }
  
  return insights;
}

/**
 * Calcula a projeção de custos para os próximos meses com base nos dados históricos
 * @param data Dados de custos em nuvem
 * @param monthsToProject Número de meses para projetar (padrão: 3)
 * @returns Projeção de custos para os próximos meses
 */
export function projectFutureCosts(
  data: CloudCostData,
  monthsToProject: number = 3
): { month: string; projectedCost: number; lowerBound: number; upperBound: number }[] {
  const { months, totalsByMonth } = data;
  
  // Precisamos de pelo menos 3 meses de dados para fazer projeções
  if (months.length < 3) {
    return [];
  }
  
  // Calcular a taxa média de crescimento mensal
  const recentMonths = months.slice(-6); // Usar até 6 meses recentes para a projeção
  const growthRates: number[] = [];
  
  for (let i = 1; i < recentMonths.length; i++) {
    const currentMonth = recentMonths[i];
    const previousMonth = recentMonths[i - 1];
    
    const currentCost = totalsByMonth[currentMonth] || 0;
    const previousCost = totalsByMonth[previousMonth] || 0;
    
    if (previousCost > 0) {
      const growthRate = (currentCost - previousCost) / previousCost;
      growthRates.push(growthRate);
    }
  }
  
  // Calcular a taxa média de crescimento
  const averageGrowthRate = growthRates.length > 0
    ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
    : 0;
  
  // Calcular o desvio padrão para os intervalos de confiança
  const stdDev = calculateStandardDeviation(growthRates);
  
  // Gerar projeções para os próximos meses
  const projections: { month: string; projectedCost: number; lowerBound: number; upperBound: number }[] = [];
  
  // Último mês conhecido e seu custo
  const lastMonth = months[months.length - 1];
  let lastCost = totalsByMonth[lastMonth] || 0;
  
  // Gerar nomes para os próximos meses
  const nextMonths = generateNextMonths(lastMonth, monthsToProject);
  
  // Calcular projeções
  for (let i = 0; i < monthsToProject; i++) {
    const projectedCost = lastCost * (1 + averageGrowthRate);
    const lowerBound = lastCost * (1 + averageGrowthRate - stdDev);
    const upperBound = lastCost * (1 + averageGrowthRate + stdDev);
    
    projections.push({
      month: nextMonths[i],
      projectedCost,
      lowerBound: Math.max(0, lowerBound), // Garantir que o limite inferior não seja negativo
      upperBound
    });
    
    // Atualizar o último custo para a próxima iteração
    lastCost = projectedCost;
  }
  
  return projections;
}

/**
 * Calcula o desvio padrão de um array de números
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Gera nomes para os próximos meses com base no último mês conhecido
 */
function generateNextMonths(lastMonth: string, count: number): string[] {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Extrair mês e ano do último mês conhecido
  const parts = lastMonth.split('/');
  let monthName = parts[0].trim();
  let year = parseInt(parts[1].trim());
  
  // Encontrar o índice do mês
  let monthIndex = months.findIndex(m => m === monthName);
  if (monthIndex === -1) monthIndex = 0; // Fallback para Janeiro se não encontrar
  
  const nextMonths: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Avançar para o próximo mês
    monthIndex = (monthIndex + 1) % 12;
    
    // Se voltamos para Janeiro, incrementar o ano
    if (monthIndex === 0) {
      year++;
    }
    
    nextMonths.push(`${months[monthIndex]}/${year}`);
  }
  
  return nextMonths;
}
