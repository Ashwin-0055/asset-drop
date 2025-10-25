'use client';

import { memo } from 'react';
import { FormField } from '@/types/builder';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Link2, Image, Video, Code as CodeIcon, Heading } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldRendererProps {
  field: FormField;
  mode: 'builder' | 'preview' | 'submission';
  onChange?: (value: any) => void;
  value?: any;
}

export const FieldRenderer = memo(function FieldRenderer({ field, mode, onChange, value }: FieldRendererProps) {
  const isInteractive = mode === 'submission';
  const showLabels = mode !== 'builder';

  const renderLabel = () => {
    if (field.type === 'section-header') return null;

    return (
      <div className="mb-2">
        <Label className="text-base">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.helpText && (
          <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
        )}
      </div>
    );
  };

  const renderField = () => {
    switch (field.type) {
      case 'file-upload':
        return (
          <div>
            {renderLabel()}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isInteractive
                  ? 'hover:border-primary hover:bg-accent cursor-pointer'
                  : 'bg-muted/50'
              )}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isInteractive ? 'Click to upload or drag and drop' : 'File upload area'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isInteractive ? 'Any file type supported' : 'Users will upload files here'}
              </p>
            </div>
          </div>
        );

      case 'text-input':
        return (
          <div>
            {renderLabel()}
            <Textarea
              placeholder={field.placeholder || 'Enter text...'}
              className="min-h-[100px]"
              disabled={!isInteractive}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
            />
          </div>
        );

      case 'url-field':
        return (
          <div>
            {renderLabel()}
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder={field.placeholder || 'https://example.com'}
                className="pl-10"
                disabled={!isInteractive}
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
              />
            </div>
          </div>
        );

      case 'image-gallery':
        return (
          <div>
            {renderLabel()}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isInteractive
                  ? 'hover:border-primary hover:bg-accent cursor-pointer'
                  : 'bg-muted/50'
              )}
            >
              <Image className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isInteractive ? 'Upload multiple images' : 'Image gallery upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isInteractive ? 'JPG, PNG, GIF supported' : 'Users will upload images here'}
              </p>
            </div>
          </div>
        );

      case 'audio-video':
        return (
          <div>
            {renderLabel()}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isInteractive
                  ? 'hover:border-primary hover:bg-accent cursor-pointer'
                  : 'bg-muted/50'
              )}
            >
              <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {isInteractive ? 'Upload audio or video' : 'Media upload area'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isInteractive ? 'MP4, MP3, WAV, MOV supported' : 'Users will upload media files here'}
              </p>
            </div>
          </div>
        );

      case 'code-snippet':
        return (
          <div>
            {renderLabel()}
            <div className="relative">
              <CodeIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder={field.placeholder || 'Paste your code here...'}
                className="min-h-[150px] pl-10 font-mono text-sm"
                disabled={!isInteractive}
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
              />
            </div>
          </div>
        );

      case 'section-header':
        return (
          <div className="py-4">
            <div className="flex items-center gap-3">
              <Heading className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-xl font-semibold">{field.label}</h3>
            </div>
            {field.helpText && (
              <p className="text-sm text-muted-foreground mt-2 ml-8">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Unknown field type: {field.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderField()}
    </div>
  );
})
