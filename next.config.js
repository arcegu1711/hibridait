/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Otimizações para reduzir o tamanho dos arquivos
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 24000000, // Manter abaixo de 25MB
    };
    return config;
  },
};

module.exports = nextConfig;
