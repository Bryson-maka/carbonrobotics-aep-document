"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InteractiveViewerProps {
  data: Record<string, unknown>;
}

export function InteractiveViewer({ data }: InteractiveViewerProps) {
  const type = data.type as string;

  const renderPoll = (pollData: any) => {
    const { question, options, totalVotes } = pollData;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{question}</h3>
        
        <div className="space-y-2">
          {options?.map((option: any, index: number) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            
            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{option.text}</span>
                  <span className="text-sm text-gray-500">
                    {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-sm text-gray-500 pt-2 border-t">
          Total votes: {totalVotes || 0}
        </div>
      </div>
    );
  };

  const renderDecisionMatrix = (matrixData: any) => {
    const { title, options, criteria } = matrixData;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{title}</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Criteria</th>
                <th className="text-center p-2 font-medium">Weight</th>
                {options?.map((option: string, index: number) => (
                  <th key={index} className="text-center p-2 font-medium">
                    {option}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria?.map((criterion: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    <div className="font-medium">{criterion.name}</div>
                    {criterion.description && (
                      <div className="text-xs text-gray-500">{criterion.description}</div>
                    )}
                  </td>
                  <td className="text-center p-2">
                    <Badge variant="secondary">{criterion.weight}</Badge>
                  </td>
                  {options?.map((_: string, optionIndex: number) => (
                    <td key={optionIndex} className="text-center p-2">
                      <div className="w-8 h-8 border rounded flex items-center justify-center text-sm">
                        {/* Placeholder for scores */}
                        {Math.floor(Math.random() * 5) + 1}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="text-sm text-gray-500">
          Decision matrix for evaluating options against weighted criteria
        </div>
      </div>
    );
  };

  const renderSurvey = (surveyData: any) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Survey</h3>
        <div className="p-4 bg-gray-50 rounded text-center">
          <div className="text-4xl mb-2">📋</div>
          <div className="font-medium">Advanced Survey</div>
          <div className="text-sm text-gray-600 mt-1">
            Multi-question surveys with branching logic coming soon
          </div>
        </div>
      </div>
    );
  };

  const renderApproval = (approvalData: any) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Approval Workflow</h3>
        <div className="p-4 bg-gray-50 rounded text-center">
          <div className="text-4xl mb-2">✅</div>
          <div className="font-medium">Stakeholder Approval</div>
          <div className="text-sm text-gray-600 mt-1">
            Multi-step approval processes with notifications coming soon
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'poll':
        return renderPoll(data);
      case 'decision_matrix':
        return renderDecisionMatrix(data);
      case 'survey':
        return renderSurvey(data);
      case 'approval':
        return renderApproval(data);
      default:
        return (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <div>Unknown interactive content type</div>
            <div className="text-sm text-gray-500 mt-1">Type: {type}</div>
          </div>
        );
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'poll': return 'Poll';
      case 'decision_matrix': return 'Decision Matrix';
      case 'survey': return 'Survey';
      case 'approval': return 'Approval';
      default: return 'Interactive';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Interactive Content</CardTitle>
            <CardDescription>Collaborative decision-making tool</CardDescription>
          </div>
          <Badge variant="secondary">
            {getTypeLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
        
        {/* Debug info */}
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer font-medium">View Raw Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}