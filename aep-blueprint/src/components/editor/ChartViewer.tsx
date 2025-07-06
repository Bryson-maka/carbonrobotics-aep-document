"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PieController,
  DoughnutController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PieController,
  DoughnutController
);

// Configure Chart.js defaults for better performance
ChartJS.defaults.animation = false;

interface ChartViewerProps {
  config: Record<string, unknown>;
  questionId?: string;
  showActions?: boolean;
}

export function ChartViewer({ config, questionId, showActions = false }: ChartViewerProps) {
  const chartRef = useRef<ChartJS>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure Chart.js only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const validateChartConfig = (config: any) => {
    if (!config || typeof config !== 'object') {
      return 'Invalid chart configuration';
    }
    if (!config.type) {
      return 'Chart type is required';
    }
    if (!config.data || !config.data.labels || !config.data.datasets) {
      return 'Chart data is incomplete';
    }
    if (config.data.labels.length === 0) {
      return 'Chart has no data points';
    }
    return null;
  };

  useEffect(() => {
    const validationError = validateChartConfig(config);
    setError(validationError);
  }, [config]);

  const downloadChart = () => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = `chart-${questionId || 'untitled'}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const refreshChart = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.update();
    }
  };

  const chartTitle = (config.options as any)?.plugins?.title?.text || 'Chart';
  const chartType = (config.type as string) || 'chart';
  
  // Prepare chart data for Chart.js
  const chartData = (config.data as { labels?: string[]; datasets?: any[] }) || { labels: [], datasets: [] };
  
  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Chart Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">Unable to render chart. Please check the chart configuration.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{chartTitle}</CardTitle>
            <CardDescription>
              {chartData.labels?.length || 0} data points • {chartData.datasets?.length || 0} series
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
            </Badge>
            {showActions && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={refreshChart}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadChart}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative bg-white rounded-lg p-4">
          {isClient && chartData.labels && chartData.labels.length > 0 ? (
            <div style={{ height: '400px' }}>
              <Chart
                ref={chartRef}
                type={chartType as any}
                data={{
                  labels: chartData.labels || [],
                  datasets: chartData.datasets || []
                }}
                options={{
                  ...(config.options as any || {}),
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-500">Chart will appear here</p>
                <p className="text-sm text-gray-400">Add data to see visualization</p>
              </div>
            </div>
          )}
        </div>
        
        {config.data && showActions ? (
          <div className="mt-4 text-xs">
            <details className="cursor-pointer">
              <summary className="font-medium text-gray-700 hover:text-gray-900">View Raw Data</summary>
              <div className="mt-2 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-40">
                <pre className="text-gray-600">
                  {JSON.stringify(config.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}