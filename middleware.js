import { NextResponse } from 'next/server';

export function middleware(request) {
  // Obtém o método da requisição
  const method = request.method;
  
  // Obtém o caminho da URL
  const url = request.nextUrl.clone();
  const path = url.pathname;
  
  // Verifica se é uma requisição OPTIONS para a API (preflight CORS)
  if (method === 'OPTIONS' && path.startsWith('/api/')) {
    // Retorna uma resposta com os cabeçalhos CORS apropriados
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      },
    });
  }
  
  // Para outras requisições, continua normalmente
  return NextResponse.next();
}

// Configuração para aplicar o middleware apenas nas rotas de API
export const config = {
  matcher: '/api/:path*',
};
