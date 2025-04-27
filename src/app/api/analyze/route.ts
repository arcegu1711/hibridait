import { CloudCostData } from '@/lib/csv/parser';
import { CostAnalysis, analyzeCloudCosts } from '@/lib/analysis/costAnalysis';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data || !data.cloudCostData) {
      return Response.json(
        { error: 'Dados de custos em nuvem não fornecidos' },
        { status: 400 }
      );
    }
    
    const cloudCostData = data.cloudCostData as CloudCostData;
    
    // Realizar análise dos dados
    const analysis = analyzeCloudCosts(cloudCostData);
    
    return Response.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Erro ao analisar dados:', error);
    return Response.json(
      { error: 'Erro ao processar a análise de dados' },
      { status: 500 }
    );
  }
}
