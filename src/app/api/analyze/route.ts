import { NextRequest, NextResponse } from 'next/server';
import { CloudCostData } from '@/lib/csv/parser';
import { analyzeCloudCosts } from '@/lib/analysis/costAnalysis';

export async function POST(request: NextRequest) {
  try {
    console.log("API de análise: Iniciando processamento da requisição");
    
    // Verificar se o corpo da requisição é válido
    let data: CloudCostData;
    
    try {
      const requestText = await request.text();
      console.log(`Corpo da requisição recebido: ${requestText.substring(0, 100)}...`);
      
      try {
        data = JSON.parse(requestText);
      } catch (jsonError) {
        console.error('Erro ao fazer parse do JSON:', jsonError);
        return NextResponse.json(
          { error: 'Formato de dados inválido. Esperado JSON válido.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Erro ao ler corpo da requisição:', error);
      return NextResponse.json(
        { error: 'Erro ao ler corpo da requisição.' },
        { status: 400 }
      );
    }
    
    // Validar a estrutura dos dados
    console.log("Validando estrutura dos dados...");
    
    if (!data) {
      console.error('Dados ausentes na requisição');
      return NextResponse.json(
        { error: 'Dados ausentes na requisição.' },
        { status: 400 }
      );
    }
    
    if (!data.services) {
      console.error('Propriedade services ausente nos dados');
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Propriedade services ausente.' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data.services)) {
      console.error('Propriedade services não é um array');
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Propriedade services deve ser um array.' },
        { status: 400 }
      );
    }
    
    if (!data.months) {
      console.error('Propriedade months ausente nos dados');
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Propriedade months ausente.' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data.months)) {
      console.error('Propriedade months não é um array');
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Propriedade months deve ser um array.' },
        { status: 400 }
      );
    }
    
    if (!data.totalsByMonth) {
      console.error('Propriedade totalsByMonth ausente nos dados');
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Propriedade totalsByMonth ausente.' },
        { status: 400 }
      );
    }
    
    if (typeof data.totalsByMonth !== 'object' || data.totalsByMonth === null) {
      console.error('Propriedade totalsByMonth não é um objeto');
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Propriedade totalsByMonth deve ser um objeto.' },
        { status: 400 }
      );
    }
    
    console.log({
      servicesLength: data.services.length,
      monthsLength: data.months.length,
      totalsByMonthKeys: Object.keys(data.totalsByMonth).length
    });
    
    // Verificar se há dados suficientes para análise
    if (data.services.length === 0) {
      console.error('Array de serviços vazio');
      return NextResponse.json(
        { error: 'Dados insuficientes para análise. Nenhum serviço encontrado.' },
        { status: 400 }
      );
    }
    
    if (data.months.length === 0) {
      console.error('Array de meses vazio');
      return NextResponse.json(
        { error: 'Dados insuficientes para análise. Nenhum mês encontrado.' },
        { status: 400 }
      );
    }
    
    if (Object.keys(data.totalsByMonth).length === 0) {
      console.error('Objeto totalsByMonth vazio');
      return NextResponse.json(
        { error: 'Dados insuficientes para análise. Nenhum total por mês encontrado.' },
        { status: 400 }
      );
    }
    
    // Verificar se os serviços têm a estrutura correta
    for (let i = 0; i < data.services.length; i++) {
      const service = data.services[i];
      
      if (!service.name) {
        console.error(`Serviço na posição ${i} não tem nome`);
        return NextResponse.json(
          { error: `Estrutura de dados inválida. Serviço na posição ${i} não tem nome.` },
          { status: 400 }
        );
      }
      
      if (!service.costs || typeof service.costs !== 'object') {
        console.error(`Serviço ${service.name} não tem custos ou custos não é um objeto`);
        return NextResponse.json(
          { error: `Estrutura de dados inválida. Serviço ${service.name} não tem custos válidos.` },
          { status: 400 }
        );
      }
      
      // Verificar se o serviço tem custos para todos os meses
      for (const month of data.months) {
        if (service.costs[month] === undefined) {
          console.error(`Serviço ${service.name} não tem custo para o mês ${month}`);
          // Adicionar custo zero para o mês ausente em vez de retornar erro
          service.costs[month] = 0;
        }
      }
      
      // Verificar subserviços, se existirem
      if (service.subServices) {
        if (!Array.isArray(service.subServices)) {
          console.error(`Serviço ${service.name} tem subServices que não é um array`);
          return NextResponse.json(
            { error: `Estrutura de dados inválida. Serviço ${service.name} tem subServices que não é um array.` },
            { status: 400 }
          );
        }
        
        for (let j = 0; j < service.subServices.length; j++) {
          const subService = service.subServices[j];
          
          if (!subService.name) {
            console.error(`Subserviço na posição ${j} do serviço ${service.name} não tem nome`);
            return NextResponse.json(
              { error: `Estrutura de dados inválida. Subserviço na posição ${j} do serviço ${service.name} não tem nome.` },
              { status: 400 }
            );
          }
          
          if (!subService.costs || typeof subService.costs !== 'object') {
            console.error(`Subserviço ${subService.name} do serviço ${service.name} não tem custos ou custos não é um objeto`);
            return NextResponse.json(
              { error: `Estrutura de dados inválida. Subserviço ${subService.name} do serviço ${service.name} não tem custos válidos.` },
              { status: 400 }
            );
          }
          
          // Verificar se o subserviço tem custos para todos os meses
          for (const month of data.months) {
            if (subService.costs[month] === undefined) {
              console.error(`Subserviço ${subService.name} do serviço ${service.name} não tem custo para o mês ${month}`);
              // Adicionar custo zero para o mês ausente em vez de retornar erro
              subService.costs[month] = 0;
            }
          }
        }
      }
    }
    
    // Verificar se totalsByMonth tem valores para todos os meses
    for (const month of data.months) {
      if (data.totalsByMonth[month] === undefined) {
        console.error(`totalsByMonth não tem valor para o mês ${month}`);
        // Calcular o total para o mês ausente em vez de retornar erro
        data.totalsByMonth[month] = data.services.reduce((total, service) => total + (service.costs[month] || 0), 0);
      }
    }
    
    console.log("Validação concluída com sucesso. Iniciando análise...");
    
    try {
      // Realizar análise dos dados
      const analysis = analyzeCloudCosts(data);
      
      console.log("Análise concluída com sucesso");
      
      // Retornar os resultados da análise
      return NextResponse.json({
        success: true,
        analysis
      });
    } catch (analysisError) {
      console.error('Erro ao analisar dados:', analysisError);
      return NextResponse.json(
        { error: `Erro ao analisar os dados: ${analysisError instanceof Error ? analysisError.message : 'Erro desconhecido'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: `Ocorreu um erro ao processar a requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}
