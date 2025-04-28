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
  try {
    console.log("Iniciando processamento do CSV...");
    
    // Dividir o conteúdo em linhas
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      throw new Error('O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados');
    }
    
    console.log(`Número de linhas no CSV: ${lines.length}`);
    
    // Extrair cabeçalhos
    const headers = parseCSVLine(lines[0]);
    console.log(`Cabeçalhos encontrados: ${headers.length}`);
    
    // Identificar colunas de meses (formato: "Custo: Mês/Ano" ou "Uso: Mês/Ano" ou "Estimativa: Mês/Ano")
    const monthColumns: string[] = [];
    const monthIndices: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      const cleanHeader = header.replace(/"/g, '').trim();
      
      if (cleanHeader.startsWith('Custo:')) {
        const month = cleanHeader.replace('Custo:', '').trim();
        if (!monthColumns.includes(month)) {
          monthColumns.push(month);
        }
        monthIndices[`custo_${month}`] = index;
      } else if (cleanHeader.startsWith('Uso:')) {
        const month = cleanHeader.replace('Uso:', '').trim();
        monthIndices[`uso_${month}`] = index;
      } else if (cleanHeader.startsWith('Estimativa:')) {
        // Ignorar colunas de estimativa, mas registrar para debug
        console.log(`Ignorando coluna de estimativa: ${cleanHeader}`);
      }
    });
    
    console.log(`Meses encontrados: ${monthColumns.length}`);
    console.log(`Meses: ${monthColumns.join(', ')}`);
    
    if (monthColumns.length === 0) {
      throw new Error('Nenhuma coluna de custo encontrada no arquivo CSV. Os cabeçalhos devem começar com "Custo:"');
    }
    
    // Normalizar nomes de meses para ordenação correta
    const normalizeMonth = (month: string): string => {
      // Corrigir abreviações e acentuação
      return month
        .replace(/Marco/i, 'Março')
        .replace(/Fev/i, 'Fevereiro')
        .replace(/Jan/i, 'Janeiro')
        .replace(/Abr/i, 'Abril')
        .replace(/Mai/i, 'Maio')
        .replace(/Jun/i, 'Junho')
        .replace(/Jul/i, 'Julho')
        .replace(/Ago/i, 'Agosto')
        .replace(/Set/i, 'Setembro')
        .replace(/Out/i, 'Outubro')
        .replace(/Nov/i, 'Novembro')
        .replace(/Dez/i, 'Dezembro');
    };
    
    // Ordenar meses cronologicamente
    monthColumns.sort((a, b) => {
      // Extrair mês e ano
      const partsA = a.split('/');
      const partsB = b.split('/');
      
      if (partsA.length !== 2 || partsB.length !== 2) {
        // Se o formato não for Mês/Ano, manter a ordem original
        return 0;
      }
      
      const monthA = normalizeMonth(partsA[0]);
      const yearA = partsA[1];
      const monthB = normalizeMonth(partsB[0]);
      const yearB = partsB[1];
      
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      
      const monthMap: Record<string, number> = {
        'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
        'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
        'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
      };
      
      return (monthMap[monthA] || 0) - (monthMap[monthB] || 0);
    });
    
    console.log(`Meses ordenados: ${monthColumns.join(', ')}`);
    
    // Processar linhas de dados
    const services: ServiceCost[] = [];
    const serviceMap: Record<string, ServiceCost> = {};
    const totalsByMonth: Record<string, number> = {};
    
    // Inicializar totalsByMonth com zeros para todos os meses
    monthColumns.forEach(month => {
      totalsByMonth[month] = 0;
    });
    
    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);
      
      // Verificar se a linha tem colunas suficientes
      if (columns.length < 3) {
        console.log(`Ignorando linha ${i+1}: número insuficiente de colunas`);
        continue;
      }
      
      // Extrair nome do serviço e subserviço
      let serviceName = '';
      let subServiceName = '';
      
      // Tentar diferentes índices para encontrar o nome do serviço
      if (columns[1] && columns[1].replace(/"/g, '').trim() !== '') {
        serviceName = columns[1].replace(/"/g, '').trim();
      } else if (columns[0] && columns[0].replace(/"/g, '').trim() !== '') {
        serviceName = columns[0].replace(/"/g, '').trim();
      }
      
      // Se não encontrou nome de serviço, pular linha
      if (serviceName === '') {
        console.log(`Ignorando linha ${i+1}: nome de serviço não encontrado`);
        continue;
      }
      
      // Tentar encontrar nome do subserviço
      if (columns[2]) {
        subServiceName = columns[2].replace(/"/g, '').trim();
      }
      
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
          // Limpar o valor e converter para número
          let costValue = columns[costIndex].replace(/"/g, '').trim();
          
          // Substituir vírgula por ponto para conversão correta
          costValue = costValue.replace(',', '.');
          
          // Converter para número, com fallback para zero
          const numericCost = parseFloat(costValue) || 0;
          costs[month] = numericCost;
          
          // Atualizar totais por mês
          totalsByMonth[month] += numericCost;
        } else {
          // Se não houver custo para este mês, definir como zero
          costs[month] = 0;
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
    
    console.log(`Serviços encontrados: ${services.length}`);
    console.log(`Meses com totais: ${Object.keys(totalsByMonth).length}`);
    
    // Verificar se temos dados válidos
    if (services.length === 0) {
      throw new Error('Nenhum serviço encontrado no arquivo CSV');
    }
    
    if (Object.keys(totalsByMonth).length === 0) {
      throw new Error('Nenhum custo encontrado no arquivo CSV');
    }
    
    // Garantir que todos os serviços tenham custos para todos os meses
    services.forEach(service => {
      monthColumns.forEach(month => {
        if (!service.costs[month]) {
          service.costs[month] = 0;
        }
        
        // Garantir que subserviços também tenham custos para todos os meses
        if (service.subServices) {
          service.subServices.forEach(subService => {
            if (!subService.costs[month]) {
              subService.costs[month] = 0;
            }
          });
        }
      });
    });
    
    const result: CloudCostData = {
      services,
      months: monthColumns,
      totalsByMonth
    };
    
    console.log("Processamento do CSV concluído com sucesso");
    console.log(`Resultado: ${services.length} serviços, ${monthColumns.length} meses`);
    
    return result;
  } catch (error) {
    console.error('Erro ao processar arquivo CSV:', error);
    throw new Error(`Erro ao processar arquivo CSV: ${error instanceof Error ? error.message : 'Formato inválido'}`);
  }
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
