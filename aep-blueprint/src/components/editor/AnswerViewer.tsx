"use client";

import Image from "next/image";
import { ChartViewer } from "./ChartViewer";
import { MediaViewer } from "./MediaViewer";
import { InteractiveViewer } from "./InteractiveViewer";
import type { Answer } from "@/types/database";

interface AnswerViewerProps {
  answer?: Answer;
  // Legacy props for backwards compatibility
  content?: Record<string, unknown>;
  status?: "draft" | "final";
}

export function AnswerViewer({ answer, content, status }: AnswerViewerProps) {
  // Handle both new answer object and legacy props
  const answerData = answer || { content, status, content_type: 'text' };
  
  if (!answerData.content && !('chart_config' in answerData && answerData.chart_config) && !('media_urls' in answerData && answerData.media_urls) && !('interactive_data' in answerData && answerData.interactive_data)) {
    return (
      <div 
        className="text-center py-8 border-2 border-dashed rounded-lg" 
        style={{ 
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border-custom)',
          backgroundColor: 'var(--color-bg-primary)'
        }}
      >
        <div className="text-4xl mb-3">💭</div>
        <div className="text-lg mb-2 font-medium">No answer provided yet</div>
        <div className="text-sm">Click the &quot;Add Answer&quot; button above to get started</div>
      </div>
    );
  }

  const contentType = answerData.content_type || 'text';
  
  // Render based on content type
  const renderContentByType = () => {
    switch (contentType) {
      case 'chart':
        return ('chart_config' in answerData && answerData.chart_config) ? (
          <ChartViewer config={answerData.chart_config} />
        ) : null;
        
      case 'media':
        return ('media_urls' in answerData && answerData.media_urls) ? (
          <MediaViewer urls={answerData.media_urls} />
        ) : null;
        
      case 'interactive':
        return ('interactive_data' in answerData && answerData.interactive_data) ? (
          <InteractiveViewer data={answerData.interactive_data} />
        ) : null;
        
      case 'text':
      default:
        return answerData.content ? renderTextContent(answerData.content) : null;
    }
  };

  // Text content rendering for TipTap JSON
  const renderTextContent = (content: Record<string, unknown>) => {
    const renderNode = (node: unknown): React.ReactNode => {
      if (!node || typeof node !== 'object' || !('type' in node)) return null;

      const nodeObj = node as Record<string, unknown>;

      switch (nodeObj.type) {
        case "doc":
          return (
            <div className="prose max-w-none" style={{ color: 'var(--color-text-primary)' }}>
              {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
                <div key={index}>{renderNode(child)}</div>
              ))}
            </div>
          );
        case "paragraph":
          return (
            <p className="mb-2">
              {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
                <span key={index}>{renderNode(child)}</span>
              ))}
            </p>
          );
        case "text":
          let text: React.ReactNode = nodeObj.text as string;
          if (Array.isArray(nodeObj.marks)) {
            for (const mark of nodeObj.marks as Array<{ type: string }>) {
              if (mark.type === "bold") {
                text = <strong>{text}</strong>;
              } else if (mark.type === "italic") {
                text = <em>{text}</em>;
              }
            }
          }
          return text;
        case "bulletList":
          return (
            <ul className="list-disc list-inside mb-2">
              {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
                <li key={index}>{renderNode(child)}</li>
              ))}
            </ul>
          );
        case "orderedList":
          return (
            <ol className="list-decimal list-inside mb-2">
              {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
                <li key={index}>{renderNode(child)}</li>
              ))}
            </ol>
          );
        case "listItem":
          return (
            <>
              {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
                <span key={index}>{renderNode(child)}</span>
              ))}
            </>
          );
        case "image":
          const attrs = nodeObj.attrs as Record<string, unknown>;
          return (
            <Image
              src={attrs?.src as string}
              alt={(attrs?.alt as string) || ""}
              width={500}
              height={300}
              className="max-w-full h-auto rounded"
            />
          );
        case "hardBreak":
          return <br />;
        default:
          return null;
      }
    };

    return renderNode(content);
  };

  return (
    <div className="rounded-lg p-4" style={{ 
      backgroundColor: 'var(--color-bg-primary)', 
      border: '1px solid var(--color-border-custom)' 
    }}>
      {renderContentByType()}
      
      {/* Status badge */}
      {answerData.status && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border-custom)' }}>
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              answerData.status === "final"
                ? "bg-green-600 text-white"
                : "bg-orange-600 text-white"
            }`}
          >
            {answerData.status.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}