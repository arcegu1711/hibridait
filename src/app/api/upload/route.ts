import { NextRequest, NextResponse } from 'next/server';
import { parseCloudCostCsv } from '@/lib/csv/parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }
    
    // Verificar se é um arquivo CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'O arquivo deve estar no formato CSV' },
        { status: 400 }
      );
    }
    
    try {
      // Ler o conteúdo do arquivo
      const fileContent = await file.text();
      
      if (!fileContent || fileContent.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'O arquivo CSV está vazio' },
          { status: 400 }
        );
      }
      
      // Processar o CSV
      const parsedData = await parseCloudCostCsv(fileContent);
      
      if (!parsedData || !parsedData.services || parsedData.services.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Não foi possível extrair dados do arquivo CSV' },
          { status: 400 }
        );
      }
      
      // Aqui você pode salvar os dados no banco de dados
      // Implementação do banco de dados será feita posteriormente
      
      return NextResponse.json({
        success: true,
        data: parsedData
      });
    } catch (parseError) {
      console.error('Erro ao processar o conteúdo do arquivo:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao processar o conteúdo do arquivo CSV. Verifique se o formato está correto.',
          details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao processar o arquivo CSV',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
