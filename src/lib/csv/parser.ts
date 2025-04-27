/**
 * Biblioteca para processamento de arquivos CSV de custos em nuvem
 */

export interface CsvData {
  rows: any[];
  headers: string[];
}

export interface CloudCostData {
  services: ServiceCost[];
  months: string[];
  totalsByMonth: Record<string, number>;
}

export interface ServiceCost {
  name: string;
  subServices?: ServiceCost[];
  costs: Record<string, number>;
  usages?: Record<string, string>;
}

/**
 * Processa o conteúdo CSV de custos em nuvem
 */
export async function parseCloudCostCsv(csvContent: string): Promise<CloudCostData> {
  // Dividir o conteúdo em linhas
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Extrair cabeçalhos
  const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
  
  // Identificar colunas de meses (formato: "Custo: Mês/Ano" ou "Uso: Mês/Ano")
  const monthColumns: string[] = [];
  const monthIndices: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    if (header.startsWith('Custo:')) {
      const month = header.replace('Custo:', '').trim();
      if (!monthColumns.includes(month)) {
        monthColumns.push(month);
      }
      monthIndices[`custo_${month}`] = index;
    } else if (header.startsWith('Uso:')) {
      const month = header.replace('Uso:', '').trim();
      monthIndices[`uso_${month}`] = index;
    }
  });
  
  // Ordenar meses cronologicamente
  monthColumns.sort((a, b) => {
    const [monthA, yearA] = a.split('/').reverse();
    const [monthB, yearB] = b.split('/').reverse();
    
    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }
    
    const monthMap: Record<string, number> = {
      'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
      'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
      'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
    };
    
    return monthMap[monthA.split('/')[0]] - monthMap[monthB.split('/')[0]];
  });
  
  // Processar linhas de dados
  const services: ServiceCost[] = [];
  const serviceMap: Record<string, ServiceCost> = {};
  const totalsByMonth: Record<string, number> = {};
  
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    
    if (columns.length < 3) continue;
    
    const serviceName = columns[1].replace(/"/g, '').trim();
    const subServiceName = columns[2].replace(/"/g, '').trim();
    
    if (serviceName === '') continue;
    
    // Criar objeto de serviço se não existir
    if (!serviceMap[serviceName]) {
      const newService: ServiceCost = {
        name: serviceName,
        subServices: [],
        costs: {}
      };
      
      services.push(newService);
      serviceMap[serviceName] = newService;
    }
    
    // Processar custos e usos para cada mês
    const costs: Record<string, number> = {};
    const usages: Record<string, string> = {};
    
    monthColumns.forEach(month => {
      const costIndex = monthIndices[`custo_${month}`];
      const usageIndex = monthIndices[`uso_${month}`];
      
      if (costIndex !== undefined && columns[costIndex]) {
        const costValue = parseFloat(columns[costIndex].replace(/"/g, '').replace(',', '.')) || 0;
        costs[month] = costValue;
        
        // Atualizar totais por mês
        totalsByMonth[month] = (totalsByMonth[month] || 0) + costValue;
      }
      
      if (usageIndex !== undefined && columns[usageIndex]) {
        usages[month] = columns[usageIndex].replace(/"/g, '').trim();
      }
    });
    
    // Se for um subserviço, adicionar ao serviço principal
    if (subServiceName !== '') {
      const subService: ServiceCost = {
        name: subServiceName,
        costs,
        usages
      };
      
      serviceMap[serviceName].subServices?.push(subService);
    } else {
      // Atualizar custos do serviço principal
      Object.keys(costs).forEach(month => {
        serviceMap[serviceName].costs[month] = costs[month];
      });
      
      serviceMap[serviceName].usages = usages;
    }
  }
  
  return {
    services,
    months: monthColumns,
    totalsByMonth
  };
}

/**
 * Função auxiliar para analisar uma linha CSV respeitando aspas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}
