import { NextRequest, NextResponse } from 'next/server';
import { CloudCostData } from '@/lib/csv/parser';
import { analyzeCloudCosts } from '@/lib/analysis/costAnalysis';

export async function POST(request: NextRequest) {
  try {
    // Verificar se o corpo da requisição é válido
    let data: CloudCostData;
    
    try {
      data = await request.json();
    } catch (error) {
      console.error('Erro ao processar JSON da requisição:', error);
      return NextResponse.json(
        { error: 'Formato de dados inválido. Esperado JSON válido.' },
        { status: 400 }
      );
    }
    
    // Validar a estrutura dos dados
    if (!data || !data.services || !data.months || !data.totalsByMonth) {
      console.error('Estrutura de dados inválida:', {
        hasData: !!data,
        hasServices: data ? !!data.services : false,
        servicesLength: data && data.services ? data.services.length : 0,
        hasMonths: data ? !!data.months : false,
        monthsLength: data && data.months ? data.months.length : 0,
        hasTotalsByMonth: data ? !!data.totalsByMonth : false,
        totalsByMonthKeys: data && data.totalsByMonth ? Object.keys(data.totalsByMonth).length : 0
      });
      
      return NextResponse.json(
        { error: 'Estrutura de dados inválida. Verifique os campos obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Verificar se há dados suficientes para análise
    if (data.services.length === 0 || data.months.length === 0) {
      console.error('Dados insuficientes para análise:', {
        servicesLength: data.services.length,
        monthsLength: data.months.length
      });
      
      return NextResponse.json(
        { error: 'Dados insuficientes para análise. Verifique o arquivo CSV.' },
        { status: 400 }
      );
    }
    
    try {
      // Realizar análise dos dados
      const analysis = analyzeCloudCosts(data);
      
      // Retornar os resultados da análise
      return NextResponse.json({
        success: true,
        analysis
      });
    } catch (analysisError) {
      console.error('Erro ao analisar dados:', analysisError);
      return NextResponse.json(
        { error: 'Erro ao analisar os dados. Verifique o formato do arquivo CSV.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a requisição.' },
      { status: 500 }
    );
  }
}
