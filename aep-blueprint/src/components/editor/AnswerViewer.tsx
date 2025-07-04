"use client";

import Image from "next/image";

interface AnswerViewerProps {
  content?: Record<string, unknown>;
  status?: "draft" | "final";
}

export function AnswerViewer({ content, status }: AnswerViewerProps) {
  if (!content) {
    return (
      <div className="text-gray-500 italic p-4 border rounded-lg">
        No answer provided yet.
      </div>
    );
  }

  const renderContent = (node: unknown): React.ReactNode => {
    if (!node || typeof node !== 'object' || !node || !('type' in node)) return null;

    const nodeObj = node as Record<string, unknown>;

    switch (nodeObj.type) {
      case "doc":
        return (
          <div className="prose max-w-none">
            {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
              <div key={index}>{renderContent(child)}</div>
            ))}
          </div>
        );
      case "paragraph":
        return (
          <p>
            {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
              <span key={index}>{renderContent(child)}</span>
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
          <ul>
            {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
              <li key={index}>{renderContent(child)}</li>
            ))}
          </ul>
        );
      case "orderedList":
        return (
          <ol>
            {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
              <li key={index}>{renderContent(child)}</li>
            ))}
          </ol>
        );
      case "listItem":
        return (
          <>
            {Array.isArray(nodeObj.content) && nodeObj.content.map((child: unknown, index: number) => (
              <span key={index}>{renderContent(child)}</span>
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
            className="max-w-full h-auto"
          />
        );
      case "hardBreak":
        return <br />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      {renderContent(content)}
      {status && (
        <div className="mt-4 pt-2 border-t">
          <span
            className={`text-xs px-2 py-1 rounded ${
              status === "final"
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {status}
          </span>
        </div>
      )}
    </div>
  );
}