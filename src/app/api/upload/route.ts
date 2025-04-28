import { NextRequest, NextResponse } from 'next/server';
import { CloudCostData } from '@/lib/csv/parser';
import { analyzeCloudCosts } from '@/lib/analysis/costAnalysis';

export async function POST(request: NextRequest) {
  try {
    console.log("API de upload: Iniciando processamento da requisição");
    
    // Verificar se a requisição contém um arquivo
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('Nenhum arquivo encontrado na requisição');
      return NextResponse.json(
        { error: 'Nenhum arquivo encontrado na requisição' },
        { status: 400 }
      );
    }
    
    console.log(`Arquivo recebido: ${file.name}, tamanho: ${file.size} bytes`);
    
    // Verificar se o arquivo é um CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      console.error('O arquivo não é um CSV');
      return NextResponse.json(
        { error: 'O arquivo deve ser um CSV' },
        { status: 400 }
      );
    }
    
    // Verificar se o arquivo não está vazio
    if (file.size === 0) {
      console.error('O arquivo está vazio');
      return NextResponse.json(
        { error: 'O arquivo está vazio' },
        { status: 400 }
      );
    }
    
    try {
      // Ler o conteúdo do arquivo
      const fileContent = await file.text();
      console.log(`Conteúdo do arquivo lido: ${fileContent.length} caracteres`);
      
      // Verificar se o conteúdo não está vazio
      if (!fileContent.trim()) {
        console.error('O conteúdo do arquivo está vazio');
        return NextResponse.json(
          { error: 'O conteúdo do arquivo está vazio' },
          { status: 400 }
        );
      }
      
      // Importar o parser de CSV
      const { parseCloudCostCsv } = await import('@/lib/csv/parser');
      
      try {
        // Processar o arquivo CSV
        console.log("Iniciando processamento do CSV...");
        const parsedData = await parseCloudCostCsv(fileContent);
        console.log("CSV processado com sucesso");
        
        // Verificar se os dados foram processados corretamente
        if (!parsedData || !parsedData.services || !parsedData.months || !parsedData.totalsByMonth) {
          console.error('Dados processados inválidos');
          return NextResponse.json(
            { error: 'Erro ao processar o arquivo CSV: estrutura de dados inválida' },
            { status: 400 }
          );
        }
        
        console.log(`Dados processados: ${parsedData.services.length} serviços, ${parsedData.months.length} meses`);
        
        // Retornar os dados processados
        return NextResponse.json({
          success: true,
          data: parsedData
        });
      } catch (parseError) {
        console.error('Erro ao processar o CSV:', parseError);
        return NextResponse.json(
          { error: `Erro ao processar o arquivo CSV: ${parseError instanceof Error ? parseError.message : 'formato inválido'}` },
          { status: 400 }
        );
      }
    } catch (fileError) {
      console.error('Erro ao ler o arquivo:', fileError);
      return NextResponse.json(
        { error: 'Erro ao ler o arquivo' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar a requisição' },
      { status: 500 }
    );
  }
}
