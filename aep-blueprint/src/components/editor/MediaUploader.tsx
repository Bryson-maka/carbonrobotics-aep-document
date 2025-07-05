"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface MediaUploaderProps {
  questionId: string;
  onSave?: () => void;
}

export function MediaUploader({ questionId, onSave }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${questionId}_${Date.now()}_${i}.${fileExt}`;
        
        // For now, we'll store as base64 data URL
        // In production, you'd upload to Supabase Storage
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        uploadedFiles.push({
          id: `temp_${Date.now()}_${i}`,
          fileName: file.name,
          fileType: file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'document',
          fileSize: file.size,
          mimeType: file.type,
          fileUrl: fileData,
          uploadDate: new Date().toISOString()
        });
      }

      setMediaFiles(prev => [...prev, ...uploadedFiles]);
      
      // Save to database
      const { error } = await supabase
        .from("answers")
        .upsert({
          question_id: questionId,
          content: { media: uploadedFiles },
          content_type: "media",
          media_urls: uploadedFiles.map(f => f.fileUrl),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      onSave?.();
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  }, [questionId, onSave]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  const removeFile = useCallback((fileId: string) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Gallery</CardTitle>
        <CardDescription>Upload images, videos, and documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="gallery">Gallery ({mediaFiles.length})</TabsTrigger>
            <TabsTrigger value="embed">Embed Links</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-4xl">📁</div>
                <div>
                  <p className="text-lg font-medium">
                    {dragActive ? 'Drop files here' : 'Drag and drop files here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Support for images, videos, and documents up to 50MB
                  </p>
                </div>
                <div className="flex justify-center">
                  <Label htmlFor="fileInput">
                    <Button variant="outline" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Choose Files'}
                    </Button>
                  </Label>
                  <Input
                    id="fileInput"
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🖼️</div>
                <div className="font-medium">Images</div>
                <div className="text-gray-500">JPG, PNG, GIF, WebP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎬</div>
                <div className="font-medium">Videos</div>
                <div className="text-gray-500">MP4, WebM, MOV</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-medium">Documents</div>
                <div className="text-gray-500">PDF, DOC, DOCX</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            {mediaFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🖼️</div>
                <p>No files uploaded yet</p>
                <p className="text-sm">Use the Upload tab to add files</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.fileName}</div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(file.fileSize)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </Button>
                    </div>
                    
                    <Badge variant="secondary" className="text-xs">
                      {file.fileType}
                    </Badge>
                    
                    {file.fileType === 'image' && (
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {file.fileType === 'video' && (
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                        <video
                          src={file.fileUrl}
                          controls
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    
                    {file.fileType === 'document' && (
                      <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-1">📄</div>
                          <div className="text-sm text-gray-600">Document</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="embedUrl">Embed URL</Label>
                <Input
                  id="embedUrl"
                  placeholder="https://www.youtube.com/watch?v=... or https://figma.com/..."
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium mb-1">Supported platforms:</p>
                <ul className="space-y-1">
                  <li>• YouTube videos</li>
                  <li>• Figma designs</li>
                  <li>• Loom recordings</li>
                  <li>• Google Drive files</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full">
                Add Embed (Coming Soon)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}