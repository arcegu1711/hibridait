import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv/parser';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição é multipart/form-data
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Formato de requisição inválido. Esperado multipart/form-data.' },
        { status: 400 }
      );
    }

    // Obter o arquivo do formulário
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Verificar se o arquivo foi enviado
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado.' },
        { status: 400 }
      );
    }

    // Verificar se é um arquivo CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Apenas arquivos CSV são aceitos.' },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (limite de 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'O arquivo excede o tamanho máximo permitido (10MB).' },
        { status: 400 }
      );
    }

    // Ler o conteúdo do arquivo
    const fileContent = await file.text();
    
    // Verificar se o arquivo está vazio
    if (!fileContent.trim()) {
      return NextResponse.json(
        { error: 'O arquivo CSV está vazio.' },
        { status: 400 }
      );
    }

    try {
      // Processar o CSV
      const parsedData = parseCSV(fileContent);
      
      // Verificar se os dados foram processados corretamente
      if (!parsedData || !parsedData.services || parsedData.services.length === 0) {
        return NextResponse.json(
          { error: 'Não foi possível processar os dados do arquivo CSV. Verifique o formato.' },
          { status: 400 }
        );
      }

      // Salvar o arquivo temporariamente (opcional)
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      // Criar diretório de uploads se não existir
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      } catch (err) {
        console.error('Erro ao criar diretório de uploads:', err);
        // Continuar mesmo se não conseguir criar o diretório
      }

      // Gerar nome de arquivo único
      const fileName = `${uuidv4()}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);

      try {
        // Salvar o arquivo
        fs.writeFileSync(filePath, fileContent);
      } catch (err) {
        console.error('Erro ao salvar arquivo:', err);
        // Continuar mesmo se não conseguir salvar o arquivo
      }

      // Retornar os dados processados
      return NextResponse.json({
        success: true,
        fileName: file.name,
        data: parsedData
      });
    } catch (parseError) {
      console.error('Erro ao processar CSV:', parseError);
      return NextResponse.json(
        { error: 'Erro ao processar o arquivo CSV. Verifique se o formato está correto.' },
        { status: 400 }
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
