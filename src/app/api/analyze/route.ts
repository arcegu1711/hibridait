interface AnalyzeRequest {
  cloudCostData: any; // ou defina um tipo mais específico se souber a estrutura exata
}
import { CloudCostData } from '@/lib/csv/parser';
import { CostAnalysis, analyzeCloudCosts } from '@/lib/analysis/costAnalysis';

export async function POST(request: Request) {
  try {
    // Código existente para analisar os dados
    
    // Certifique-se de que a resposta sempre seja um JSON válido
    return Response.json({ success: true, analysis: analysisResults });
  } catch (error) {
    console.error('Erro na análise:', error);
    // Sempre retorne um JSON válido, mesmo em caso de erro
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
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
