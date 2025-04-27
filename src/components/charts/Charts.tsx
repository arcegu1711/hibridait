'use client';

import { useEffect, useRef } from 'react';
import { CostTrend, ServiceAnalysis } from '@/lib/analysis/costAnalysis';
import Chart from 'chart.js/auto';

interface TrendChartProps {
  trends: CostTrend[];
  title?: string;
  height?: number;
}

export function TrendChart({ trends, title = 'Tendência de Custos', height = 300 }: TrendChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !trends.length) return;

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Preparar dados para o gráfico
    const labels = trends.map(trend => trend.month);
    const data = trends.map(trend => trend.cost);

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Custo (R$)',
            data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              }
            }
          }
        }
      },
    });

    // Limpar ao desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [trends, title]);

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={chartRef} />
    </div>
  );
}

interface PieChartProps {
  services: { name: string; cost: number; percentage: number }[];
  title?: string;
  height?: number;
}

export function PieChart({ services, title = 'Distribuição de Custos', height = 300 }: PieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !services.length) return;

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Preparar dados para o gráfico
    const labels = services.slice(0, 7).map(service => service.name);
    const data = services.slice(0, 7).map(service => service.cost);
    
    // Se houver mais de 7 serviços, agrupar o restante como "Outros"
    if (services.length > 7) {
      const othersCost = services.slice(7).reduce((sum, service) => sum + service.cost, 0);
      labels.push('Outros');
      data.push(othersCost);
    }

    // Cores para o gráfico
    const backgroundColors = [
      'rgba(59, 130, 246, 0.8)',   // Azul
      'rgba(16, 185, 129, 0.8)',   // Verde
      'rgba(245, 158, 11, 0.8)',   // Amarelo
      'rgba(239, 68, 68, 0.8)',    // Vermelho
      'rgba(139, 92, 246, 0.8)',   // Roxo
      'rgba(236, 72, 153, 0.8)',   // Rosa
      'rgba(14, 165, 233, 0.8)',   // Azul claro
      'rgba(107, 114, 128, 0.8)',  // Cinza (para "Outros")
    ];

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderColor: 'white',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title,
            font: {
              size: 16,
              weight: 'bold',
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                const label = context.label || '';
                const percentage = (value / services.reduce((sum, service) => sum + service.cost, 0)) * 100;
                return `${label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage.toFixed(1)}%)`;
              }
            }
          },
          legend: {
            position: 'right',
          }
        },
      },
    });

    // Limpar ao desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [services, title]);

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={chartRef} />
    </div>
  );
}

interface ServiceTrendChartProps {
  service: ServiceAnalysis;
  height?: number;
}

export function ServiceTrendChart({ service, height = 200 }: ServiceTrendChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !service.trend.length) return;

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Preparar dados para o gráfico
    const labels = service.trend.map(trend => trend.month);
    const data = service.trend.map(trend => trend.cost);

    // Criar novo gráfico
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: service.name,
            data,
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value) {
                return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              }
            }
          }
        }
      },
    });

    // Limpar ao desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [service]);

  return (
    <div style={{ height: `${height}px` }}>
      <canvas ref={chartRef} />
    </div>
  );
}
