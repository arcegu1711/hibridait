import { NextRequest, NextResponse } from 'next/server';
import { parseCloudCostCsv } from '@/lib/csv/parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }
    
    // Verificar se é um arquivo CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'O arquivo deve estar no formato CSV' },
        { status: 400 }
      );
    }
    
    // Ler o conteúdo do arquivo
    const fileContent = await file.text();
    
    // Processar o CSV
    const parsedData = await parseCloudCostCsv(fileContent);
    
    // Aqui você pode salvar os dados no banco de dados
    // Implementação do banco de dados será feita posteriormente
    
    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o arquivo CSV' },
      { status: 500 }
    );
  }
}
