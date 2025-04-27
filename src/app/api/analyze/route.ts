import { CloudCostData } from '@/lib/csv/parser';
import { CostAnalysis, analyzeCloudCosts } from '@/lib/analysis/costAnalysis';

export async function POST(request: Request) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error('Erro ao processar JSON da requisição:', jsonError);
      return Response.json(
        { 
          success: false, 
          error: 'Formato de requisição inválido',
          details: jsonError instanceof Error ? jsonError.message : 'Erro ao processar JSON'
        },
        { status: 400 }
      );
    }
    
    if (!data) {
      return Response.json(
        { success: false, error: 'Corpo da requisição vazio ou inválido' },
        { status: 400 }
      );
    }
    
    if (!data.cloudCostData) {
      return Response.json(
        { success: false, error: 'Dados de custos em nuvem não fornecidos' },
        { status: 400 }
      );
    }
    
    try {
      const cloudCostData = data.cloudCostData as CloudCostData;
      
      // Validar a estrutura dos dados
      if (!cloudCostData.services || !Array.isArray(cloudCostData.services) || cloudCostData.services.length === 0) {
        return Response.json(
          { success: false, error: 'Estrutura de dados de custos inválida: serviços não encontrados' },
          { status: 400 }
        );
      }
      
      if (!cloudCostData.months || !Array.isArray(cloudCostData.months) || cloudCostData.months.length === 0) {
        return Response.json(
          { success: false, error: 'Estrutura de dados de custos inválida: meses não encontrados' },
          { status: 400 }
        );
      }
      
      // Realizar análise dos dados
      const analysis = analyzeCloudCosts(cloudCostData);
      
      if (!analysis) {
        return Response.json(
          { success: false, error: 'Falha ao gerar análise dos dados' },
          { status: 500 }
        );
      }
      
      return Response.json({
        success: true,
        analysis
      });
    } catch (analysisError) {
      console.error('Erro ao analisar dados:', analysisError);
      return Response.json(
        { 
          success: false, 
          error: 'Erro ao processar a análise de dados',
          details: analysisError instanceof Error ? analysisError.message : 'Erro desconhecido na análise'
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('Erro não tratado na API de análise:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao processar a análise',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
