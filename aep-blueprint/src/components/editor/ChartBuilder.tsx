"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface ChartBuilderProps {
  questionId: string;
  onSave?: () => void;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }>;
}

export function ChartBuilder({ questionId, onSave }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<string>("pie");
  const [chartTitle, setChartTitle] = useState("");
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ label: "Dataset 1", data: [] }]
  });
  const [rawData, setRawData] = useState("");
  const [saving, setSaving] = useState(false);

  const chartTypes = [
    { id: "pie", label: "Pie Chart", icon: "🥧", description: "Show proportional data" },
    { id: "bar", label: "Bar Chart", icon: "📊", description: "Compare categories" },
    { id: "line", label: "Line Chart", icon: "📈", description: "Show trends over time" },
    { id: "doughnut", label: "Doughnut Chart", icon: "🍩", description: "Pie chart with center hole" }
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

  const parseCSVData = useCallback((csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim());
    const labels = headers.slice(1); // Skip first column (category names)
    const datasets: any[] = [];

    lines.slice(1).forEach((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const label = values[0];
      const data = values.slice(1).map(v => parseFloat(v) || 0);
      
      if (datasets.length === 0) {
        datasets.push({
          label: label,
          data: data,
          backgroundColor: selectedColorScheme.colors.slice(0, data.length),
          borderColor: selectedColorScheme.colors.slice(0, data.length),
        });
      }
    });

    setChartData({ labels, datasets });
  }, [selectedColorScheme]);

  const handleDataChange = useCallback((value: string) => {
    setRawData(value);
    parseCSVData(value);
  }, [parseCSVData]);

  const handleSaveChart = useCallback(async () => {
    setSaving(true);
    try {
      const chartConfig = {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: !!chartTitle,
              text: chartTitle
            },
            legend: {
              position: chartType === 'pie' || chartType === 'doughnut' ? 'bottom' : 'top'
            }
          }
        }
      };

      const { error } = await supabase
        .from("answers")
        .upsert({
          question_id: questionId,
          content: { chart: chartConfig },
          content_type: "chart",
          chart_config: chartConfig,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      onSave?.();
    } catch (error) {
      console.error("Error saving chart:", error);
    } finally {
      setSaving(false);
    }
  }, [questionId, chartType, chartData, chartTitle, onSave]);

  // Sample data for demonstration
  const sampleData = {
    pie: "Category,Value\nSuccess,85\nIn Progress,12\nBlocked,3",
    bar: "Month,Sales,Expenses\nJan,12000,8000\nFeb,15000,9000\nMar,13000,7500\nApr,18000,10000",
    line: "Month,Performance,Target\nJan,85,90\nFeb,88,90\nMar,92,90\nApr,89,90\nMay,94,90",
    doughnut: "Status,Count\nCompleted,45\nActive,32\nPending,18\nCancelled,5"
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
                {chartTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
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
          <TabsList>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
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
                    {type.icon} {type.label} Example
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
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">CSV Upload (Coming Soon)</h4>
              <p className="text-sm text-gray-600">
                Upload CSV files directly from your computer. For now, copy and paste your CSV data into the manual entry tab.
              </p>
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
              Preview functionality will be enhanced with Chart.js integration
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setChartData({ labels: [], datasets: [{ label: "Dataset 1", data: [] }] });
            setRawData("");
            setChartTitle("");
          }}>
            Clear
          </Button>
          <Button onClick={handleSaveChart} disabled={saving || chartData.labels.length === 0}>
            {saving ? "Saving..." : "Save Chart"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}