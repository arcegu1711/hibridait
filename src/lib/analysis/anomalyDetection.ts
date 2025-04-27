/**
 * Biblioteca para detecção de anomalias em dados de custos em nuvem
 */

import { CloudCostData, ServiceCost } from '@/lib/csv/parser';

export interface CostAnomaly {
  month: string;
  service: string;
  expectedCost: number;
  actualCost: number;
  percentDeviation: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * Detecta anomalias nos dados de custos em nuvem
 * @param data Dados de custos em nuvem
 * @param sensitivityThreshold Limiar de sensibilidade para detecção (padrão: 25%)
 * @returns Lista de anomalias detectadas
 */
export function detectCostAnomalies(data: CloudCostData, sensitivityThreshold: number = 25): CostAnomaly[] {
  const anomalies: CostAnomaly[] = [];
  const { services, months } = data;
  
  // Precisamos de pelo menos 3 meses de dados para detectar anomalias
  if (months.length < 3) {
    return anomalies;
  }
  
  // Analisar cada serviço
  services.forEach(service => {
    // Detectar anomalias no serviço principal
    detectServiceAnomalies(service, months, anomalies, sensitivityThreshold);
    
    // Detectar anomalias nos subserviços, se existirem
    if (service.subServices && service.subServices.length > 0) {
      service.subServices.forEach(subService => {
        detectServiceAnomalies(subService, months, anomalies, sensitivityThreshold, service.name);
      });
    }
  });
  
  // Ordenar anomalias por severidade (alta para baixa) e depois por percentual de desvio
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    return Math.abs(b.percentDeviation) - Math.abs(a.percentDeviation);
  });
}

/**
 * Detecta anomalias em um serviço específico
 */
function detectServiceAnomalies(
  service: ServiceCost, 
  months: string[], 
  anomalies: CostAnomaly[], 
  sensitivityThreshold: number,
  parentServiceName?: string
): void {
  // Ignorar serviços com menos de 3 meses de dados
  const serviceCosts = months.map(month => service.costs[month] || 0);
  if (serviceCosts.filter(cost => cost > 0).length < 3) {
    return;
  }
  
  // Analisar os últimos 3 meses
  const recentMonths = months.slice(-3);
  
  // Para cada mês recente, verificar se há anomalias
  recentMonths.forEach((month, index) => {
    // Ignorar o primeiro mês, pois precisamos de histórico para comparação
    if (index === 0 && months.length <= 3) {
      return;
    }
    
    const currentCost = service.costs[month] || 0;
    
    // Ignorar custos zero ou muito baixos
    if (currentCost < 10) {
      return;
    }
    
    // Calcular o custo esperado com base na média dos meses anteriores
    let expectedCost: number;
    let previousMonths: string[];
    
    if (months.length > 3) {
      // Se tivermos mais de 3 meses de dados, usar os 3 meses anteriores ao mês atual
      const monthIndex = months.indexOf(month);
      previousMonths = months.slice(Math.max(0, monthIndex - 3), monthIndex);
      
      // Calcular a média dos meses anteriores
      const previousCosts = previousMonths.map(m => service.costs[m] || 0);
      expectedCost = previousCosts.reduce((sum, cost) => sum + cost, 0) / previousCosts.length;
    } else {
      // Se tivermos apenas 3 meses, usar os meses anteriores ao atual
      previousMonths = months.slice(0, months.indexOf(month));
      
      // Calcular a média dos meses anteriores
      const previousCosts = previousMonths.map(m => service.costs[m] || 0);
      expectedCost = previousCosts.reduce((sum, cost) => sum + cost, 0) / previousCosts.length;
    }
    
    // Calcular o desvio percentual
    const percentDeviation = ((currentCost - expectedCost) / expectedCost) * 100;
    
    // Verificar se o desvio ultrapassa o limiar de sensibilidade
    if (Math.abs(percentDeviation) >= sensitivityThreshold) {
      // Determinar a severidade com base no desvio
      let severity: 'low' | 'medium' | 'high';
      if (Math.abs(percentDeviation) >= 100) {
        severity = 'high';
      } else if (Math.abs(percentDeviation) >= 50) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
      
      // Criar mensagem descritiva
      const direction = percentDeviation > 0 ? 'aumento' : 'redução';
      const serviceName = parentServiceName 
        ? `${parentServiceName} > ${service.name}` 
        : service.name;
      
      const message = `${direction === 'aumento' ? 'Aumento' : 'Redução'} anômalo de ${Math.abs(percentDeviation).toFixed(1)}% nos custos de ${serviceName} em ${month} em relação à média dos meses anteriores.`;
      
      // Adicionar à lista de anomalias
      anomalies.push({
        month,
        service: serviceName,
        expectedCost,
        actualCost: currentCost,
        percentDeviation,
        severity,
        message
      });
    }
  });
}

/**
 * Detecta tendências de crescimento rápido nos custos
 * @param data Dados de custos em nuvem
 * @param monthsToAnalyze Número de meses para analisar (padrão: 3)
 * @param growthThreshold Limiar de crescimento para alerta (padrão: 15%)
 * @returns Lista de serviços com crescimento rápido
 */
export function detectRapidGrowthTrends(
  data: CloudCostData, 
  monthsToAnalyze: number = 3,
  growthThreshold: number = 15
): { service: string; averageGrowth: number; months: string[] }[] {
  const { services, months } = data;
  const growthTrends: { service: string; averageGrowth: number; months: string[] }[] = [];
  
  // Precisamos de pelo menos 2 meses de dados para detectar tendências
  if (months.length < 2) {
    return growthTrends;
  }
  
  // Limitar a análise aos últimos N meses
  const recentMonths = months.slice(-Math.min(monthsToAnalyze, months.length));
  
  // Analisar cada serviço
  services.forEach(service => {
    // Calcular o crescimento médio nos últimos meses
    let totalGrowth = 0;
    let growthCount = 0;
    
    for (let i = 1; i < recentMonths.length; i++) {
      const currentMonth = recentMonths[i];
      const previousMonth = recentMonths[i - 1];
      
      const currentCost = service.costs[currentMonth] || 0;
      const previousCost = service.costs[previousMonth] || 0;
      
      // Ignorar se o custo anterior for zero ou muito baixo
      if (previousCost < 10) {
        continue;
      }
      
      const growthRate = ((currentCost - previousCost) / previousCost) * 100;
      totalGrowth += growthRate;
      growthCount++;
    }
    
    // Calcular crescimento médio
    const averageGrowth = growthCount > 0 ? totalGrowth / growthCount : 0;
    
    // Verificar se o crescimento médio ultrapassa o limiar
    if (averageGrowth >= growthThreshold) {
      growthTrends.push({
        service: service.name,
        averageGrowth,
        months: recentMonths
      });
    }
    
    // Analisar subserviços, se existirem
    if (service.subServices && service.subServices.length > 0) {
      service.subServices.forEach(subService => {
        let subTotalGrowth = 0;
        let subGrowthCount = 0;
        
        for (let i = 1; i < recentMonths.length; i++) {
          const currentMonth = recentMonths[i];
          const previousMonth = recentMonths[i - 1];
          
          const currentCost = subService.costs[currentMonth] || 0;
          const previousCost = subService.costs[previousMonth] || 0;
          
          // Ignorar se o custo anterior for zero ou muito baixo
          if (previousCost < 10) {
            continue;
          }
          
          const growthRate = ((currentCost - previousCost) / previousCost) * 100;
          subTotalGrowth += growthRate;
          subGrowthCount++;
        }
        
        // Calcular crescimento médio
        const subAverageGrowth = subGrowthCount > 0 ? subTotalGrowth / subGrowthCount : 0;
        
        // Verificar se o crescimento médio ultrapassa o limiar
        if (subAverageGrowth >= growthThreshold) {
          growthTrends.push({
            service: `${service.name} > ${subService.name}`,
            averageGrowth: subAverageGrowth,
            months: recentMonths
          });
        }
      });
    }
  });
  
  // Ordenar por taxa de crescimento (decrescente)
  return growthTrends.sort((a, b) => b.averageGrowth - a.averageGrowth);
}

/**
 * Calcula o limite superior para detecção de outliers usando o método IQR (Intervalo Interquartil)
 * @param values Array de valores numéricos
 * @param factor Fator multiplicador para o IQR (padrão: 1.5)
 * @returns Limite superior para detecção de outliers
 */
export function calculateOutlierThreshold(values: number[], factor: number = 1.5): number {
  // Ordenar os valores
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calcular quartis
  const q1Index = Math.floor(sortedValues.length * 0.25);
  const q3Index = Math.floor(sortedValues.length * 0.75);
  
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  
  // Calcular IQR (Intervalo Interquartil)
  const iqr = q3 - q1;
  
  // Calcular limite superior
  return q3 + (iqr * factor);
}
