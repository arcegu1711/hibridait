import { NextRequest, NextResponse } from 'next/server';
import { parseCloudCostCsv } from '@/lib/csv/parser';

export async function POST(request: Request)  {
  try {
    // Código existente para processar o upload
    
    // Certifique-se de que a resposta sempre seja um JSON válido
    return Response.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    // Sempre retorne um JSON válido, mesmo em caso de erro
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
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
