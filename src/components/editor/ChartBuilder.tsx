"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpsertAnswer } from "@/hooks/answers";
import Papa from 'papaparse';
import { Upload, Download, BarChart3, PieChart, TrendingUp, CircleDot } from 'lucide-react';
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

// Register Chart.js components to ensure they're available
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

interface ChartBuilderProps {
  questionId: string;
  initialConfig?: ChartConfig;
  onSave?: () => void;
}

interface ChartConfig {
  type: string;
  data: ChartData;
  options: Record<string, unknown>;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

interface CSVRow {
  [key: string]: string | number;
}

export function ChartBuilder({ questionId, initialConfig, onSave }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<string>(initialConfig?.type || "pie");
  const [chartTitle, setChartTitle] = useState(
    (initialConfig?.options as any)?.plugins?.title?.text || ""
  );
  const [chartData, setChartData] = useState<ChartData>(
    initialConfig?.data || {
      labels: [],
      datasets: [{ label: "Dataset 1", data: [] }]
    }
  );
  const [rawData, setRawData] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const upsertAnswerMutation = useUpsertAnswer();

  const chartTypes = [
    { 
      id: "pie", 
      label: "Pie Chart", 
      icon: PieChart, 
      description: "Show proportional data",
      useCases: "Market share, budget allocation, survey results"
    },
    { 
      id: "bar", 
      label: "Bar Chart", 
      icon: BarChart3, 
      description: "Compare categories",
      useCases: "Feature usage, revenue comparison, performance metrics"
    },
    { 
      id: "line", 
      label: "Line Chart", 
      icon: TrendingUp, 
      description: "Show trends over time",
      useCases: "User growth, performance trends, timeline data"
    },
    { 
      id: "doughnut", 
      label: "Doughnut Chart", 
      icon: CircleDot, 
      description: "Pie chart with center space",
      useCases: "Status distribution, progress tracking"
    }
  ];

  const colorSchemes = [
    { 
      name: "Default", 
      colors: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"] 
    },
    { 
      name: "Corporate", 
      colors: ["#1F2937", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6", "#F9FAFB"] 
    },
    { 
      name: "Warm", 
      colors: ["#DC2626", "#EA580C", "#D97706", "#CA8A04", "#65A30D", "#16A34A", "#059669", "#0D9488"] 
    },
    { 
      name: "Cool", 
      colors: ["#1E40AF", "#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#DBEAFE", "#EFF6FF"] 
    }
  ];

  const [selectedColorScheme, setSelectedColorScheme] = useState(colorSchemes[0]);

  const parseCSVData = useCallback((csvText: string, fileName?: string) => {
    try {
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }

      const rows = result.data as CSVRow[];
      if (rows.length === 0) return;

      // Auto-detect chart structure
      const firstRow = rows[0];
      const columns = Object.keys(firstRow);
      
      if (columns.length < 2) {
        console.error('CSV must have at least 2 columns');
        return;
      }

      // First column as labels, remaining as data series
      const labelColumn = columns[0];
      const dataColumns = columns.slice(1);
      
      const labels = rows.map(row => String(row[labelColumn]));
      
      const datasets = dataColumns.map((column, index) => {
        const data = rows.map(row => {
          const value = row[column];
          return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        });
        
        const baseColor = selectedColorScheme.colors[index % selectedColorScheme.colors.length];
        
        return {
          label: column,
          data,
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? 
            selectedColorScheme.colors.slice(0, data.length) : 
            baseColor,
          borderColor: chartType === 'line' ? baseColor : 
            chartType === 'pie' || chartType === 'doughnut' ? '#fff' : baseColor,
          borderWidth: chartType === 'pie' || chartType === 'doughnut' ? 2 : 1,
          fill: chartType === 'line' ? false : undefined,
          tension: chartType === 'line' ? 0.4 : undefined,
        };
      });

      setChartData({ labels, datasets });
      
      // Auto-set title if from file
      if (fileName && !chartTitle) {
        const title = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setChartTitle(title.charAt(0).toUpperCase() + title.slice(1));
      }
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  }, [selectedColorScheme, chartType, chartTitle]);

  const handleDataChange = useCallback((value: string) => {
    setRawData(value);
    parseCSVData(value);
  }, [parseCSVData]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size too large. Please select a file under 5MB.');
      return;
    }
    
    setCsvFile(file);
    setProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      setRawData(csvText);
      parseCSVData(csvText, file.name);
      setProcessing(false);
    };
    reader.onerror = () => {
      console.error('Error reading file');
      setProcessing(false);
    };
    reader.readAsText(file);
  }, [parseCSVData]);

  const downloadTemplate = useCallback(() => {
    const templates = {
      pie: "Category,Value\nFeature A,45\nFeature B,30\nFeature C,25",
      bar: "Month,Revenue,Expenses\nJan,12000,8000\nFeb,15000,9000\nMar,13000,7500\nApr,18000,10000",
      line: "Month,Performance,Target\nJan,85,90\nFeb,88,90\nMar,92,90\nApr,89,90\nMay,94,90",
      doughnut: "Status,Count\nCompleted,45\nActive,32\nPending,18\nCancelled,5"
    };
    
    const csvContent = templates[chartType as keyof typeof templates] || templates.pie;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chartType}-template.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [chartType]);

  const handleSaveChart = useCallback(async () => {
    try {
      const chartConfig: ChartConfig = {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!chartTitle,
              text: chartTitle,
              font: { size: 16, weight: 'bold' as const }
            },
            legend: {
              position: (chartType === 'pie' || chartType === 'doughnut') ? 'bottom' as const : 'top' as const,
              labels: { usePointStyle: true, padding: 20 }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#fff',
              borderWidth: 1
            }
          },
          scales: chartType === 'line' || chartType === 'bar' ? {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: { color: '#666' }
            },
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: { color: '#666' }
            }
          } : undefined
        }
      };

      await upsertAnswerMutation.mutateAsync({
        questionId,
        input: {
          content: { chart: chartConfig },
          content_type: "chart",
          chart_config: chartConfig as unknown as Record<string, unknown>,
          status: "draft"
        },
      });

      onSave?.();
    } catch (error) {
      console.error("Error saving chart:", error);
    }
  }, [questionId, chartType, chartData, chartTitle, onSave, upsertAnswerMutation]);

  // Enhanced sample data with realistic PRD examples
  const sampleData = {
    pie: "Feature Priority,Effort Points\nUser Authentication,85\nDashboard,45\nReporting,30\nNotifications,15",
    bar: "Quarter,Active Users,Feature Adoption\nQ1 2024,12000,8000\nQ2 2024,15000,11000\nQ3 2024,18000,14000\nQ4 2024,22000,17000",
    line: "Sprint,Velocity,Capacity\nSprint 1,23,30\nSprint 2,27,30\nSprint 3,31,30\nSprint 4,28,30\nSprint 5,34,30",
    doughnut: "Development Status,Story Points\nCompleted,89\nIn Progress,34\nTo Do,45\nBlocked,12"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chart Builder</CardTitle>
        <CardDescription>Create interactive data visualizations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chartType">Chart Type</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                          <div className="text-xs text-gray-400">{type.useCases}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="chartTitle">Chart Title</Label>
            <Input
              id="chartTitle"
              placeholder="Enter chart title..."
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="template">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div>
              <Label>Sample Data</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {chartTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDataChange(sampleData[type.id as keyof typeof sampleData])}
                  >
                    <type.icon className="w-4 h-4 mr-2" />
                    {type.label} Example
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="rawData">Data (CSV Format)</Label>
              <Textarea
                id="rawData"
                placeholder="Enter CSV data&#10;Format: Category,Value1,Value2&#10;Example:&#10;Q1,100,80&#10;Q2,150,120"
                value={rawData}
                onChange={(e) => handleDataChange(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {processing ? 'Processing...' : 'Upload CSV File'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {csvFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">File uploaded:</span>
                    <span>{csvFile.name}</span>
                    <span className="text-sm">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">CSV Format Requirements:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• First row must contain column headers</li>
                  <li>• First column will be used as chart labels</li>
                  <li>• Remaining columns will be data series</li>
                  <li>• Numeric values only (except first column)</li>
                  <li>• Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chartTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div key={type.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <IconComponent className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium">{type.label}</h4>
                        <p className="text-sm text-gray-600 mb-2">{type.useCases}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setChartType(type.id);
                            handleDataChange(sampleData[type.id as keyof typeof sampleData]);
                          }}
                          className="w-full"
                        >
                          Use {type.label} Template
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <Label>Color Scheme</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {colorSchemes.map((scheme) => (
              <Button
                key={scheme.name}
                variant={selectedColorScheme.name === scheme.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedColorScheme(scheme)}
                className="justify-start"
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {scheme.colors.slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {scheme.name}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {chartData.labels.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Chart Preview</h4>
            <div className="text-sm text-gray-600">
              <p>Type: <Badge variant="secondary">{chartType}</Badge></p>
              <p>Data points: {chartData.labels.length}</p>
              <p>Datasets: {chartData.datasets.length}</p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Live preview available after saving
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {chartData.labels.length > 0 && (
              <span>
                {chartData.labels.length} data points • {chartData.datasets.length} series
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setChartData({ labels: [], datasets: [{ label: "Dataset 1", data: [] }] });
                setRawData("");
                setChartTitle("");
                setCsvFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Clear
            </Button>
            <Button 
              onClick={handleSaveChart} 
              disabled={upsertAnswerMutation.isPending || chartData.labels.length === 0}
            >
              {upsertAnswerMutation.isPending ? "Saving..." : "Save Chart"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}