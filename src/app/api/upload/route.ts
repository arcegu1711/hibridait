export async function POST(request: Request) {
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
