"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChartViewerProps {
  config: Record<string, unknown>;
}

export function ChartViewer({ config }: ChartViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // For now, we'll show a placeholder since Chart.js isn't installed yet
    // In production, this would render the actual chart using Chart.js
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a simple placeholder chart
    const chartType = (config.type as string) || 'pie';
    const data = config.data as any;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder based on chart type
    if (chartType === 'pie') {
      drawPiePlaceholder(ctx, canvas.width, canvas.height, data);
    } else if (chartType === 'bar') {
      drawBarPlaceholder(ctx, canvas.width, canvas.height, data);
    } else {
      drawLinePlaceholder(ctx, canvas.width, canvas.height, data);
    }
  }, [config]);

  const drawPiePlaceholder = (ctx: CanvasRenderingContext2D, width: number, height: number, data: any) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    const total = data?.datasets?.[0]?.data?.reduce((sum: number, val: number) => sum + val, 0) || 100;
    let currentAngle = 0;
    
    data?.datasets?.[0]?.data?.forEach((value: number, index: number) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      currentAngle += sliceAngle;
    });
  };

  const drawBarPlaceholder = (ctx: CanvasRenderingContext2D, width: number, height: number, data: any) => {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barCount = data?.labels?.length || 4;
    const barWidth = chartWidth / barCount * 0.8;
    const maxValue = Math.max(...(data?.datasets?.[0]?.data || [100, 80, 60, 90]));
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
    
    data?.datasets?.[0]?.data?.forEach((value: number, index: number) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + (index * chartWidth / barCount) + (chartWidth / barCount - barWidth) / 2;
      const y = height - padding - barHeight;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  };

  const drawLinePlaceholder = (ctx: CanvasRenderingContext2D, width: number, height: number, data: any) => {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const points = data?.datasets?.[0]?.data || [30, 50, 40, 70, 60, 80];
    const maxValue = Math.max(...points);
    
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    points.forEach((value: number, index: number) => {
      const x = padding + (index / (points.length - 1)) * chartWidth;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };

  const chartTitle = (config.options as any)?.plugins?.title?.text || 'Chart';
  const chartType = (config.type as string) || 'chart';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{chartTitle}</CardTitle>
            <CardDescription>Data visualization</CardDescription>
          </div>
          <Badge variant="secondary">
            {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="w-full max-w-md mx-auto border rounded"
            style={{ backgroundColor: 'white' }}
          />
          <div className="mt-3 text-center text-sm text-gray-500">
            Chart placeholder - Chart.js integration coming soon
          </div>
        </div>
        
        {config.data ? (
          <div className="mt-4 text-xs">
            <details className="cursor-pointer">
              <summary className="font-medium">View Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(config.data, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}