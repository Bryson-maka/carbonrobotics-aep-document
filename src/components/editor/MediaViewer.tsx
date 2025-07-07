"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MediaViewerProps {
  urls: string[];
}

export function MediaViewer({ urls }: MediaViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!urls || urls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-2">🖼️</div>
          <div>No media files</div>
        </CardContent>
      </Card>
    );
  }

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) return 'video';
    if (['pdf', 'doc', 'docx'].includes(extension || '')) return 'document';
    return 'unknown';
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || url;
  };

  const currentFile = urls[selectedIndex];
  const currentType = getFileType(currentFile);

  const renderMediaItem = (url: string, type: string) => {
    switch (type) {
      case 'image':
        return (
          <img
            src={url}
            alt="Media content"
            className="w-full h-auto max-h-96 object-contain rounded cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          />
        );
      case 'video':
        return (
          <video
            src={url}
            controls
            className="w-full h-auto max-h-96 rounded"
          />
        );
      case 'document':
        return (
          <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <div className="font-medium">{getFileName(url)}</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(url, '_blank')}
              >
                Open Document
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-48 bg-gray-100 rounded">
            <div className="text-center">
              <div className="text-4xl mb-2">📎</div>
              <div className="font-medium">{getFileName(url)}</div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(url, '_blank')}
              >
                Open File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Media Gallery</CardTitle>
              <CardDescription>
                {urls.length} file{urls.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main media display */}
          <div className="relative">
            {renderMediaItem(currentFile, currentType)}
            
            {/* Navigation arrows for multiple files */}
            {urls.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setSelectedIndex((prev) => (prev - 1 + urls.length) % urls.length)}
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setSelectedIndex((prev) => (prev + 1) % urls.length)}
                >
                  →
                </Button>
              </>
            )}
          </div>

          {/* File info */}
          <div className="text-sm text-gray-600">
            <div className="font-medium">{getFileName(currentFile)}</div>
            {urls.length > 1 && (
              <div className="text-xs">
                {selectedIndex + 1} of {urls.length}
              </div>
            )}
          </div>

          {/* Thumbnail grid for multiple files */}
          {urls.length > 1 && (
            <div className="grid grid-cols-6 gap-2 max-h-24 overflow-y-auto">
              {urls.map((url, index) => {
                const type = getFileType(url);
                return (
                  <div
                    key={index}
                    className={`relative cursor-pointer border-2 rounded ${
                      index === selectedIndex ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    {type === 'image' ? (
                      <img
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                        {type === 'video' ? '🎬' : '📄'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox for images */}
      {lightboxOpen && currentType === 'image' && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={currentFile}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
}