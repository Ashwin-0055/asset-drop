'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  Upload,
  Type,
  Link2,
  Image,
  Video,
  Code,
  Heading,
} from 'lucide-react';
import { FieldType } from '@/types/builder';
import { cn } from '@/lib/utils';

interface ToolboxItemData {
  type: FieldType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const toolboxItems: ToolboxItemData[] = [
  {
    type: 'file-upload',
    label: 'File Upload',
    icon: Upload,
    description: 'Upload any file type',
  },
  {
    type: 'text-input',
    label: 'Text Input',
    icon: Type,
    description: 'Single or multi-line text',
  },
  {
    type: 'url-field',
    label: 'URL Field',
    icon: Link2,
    description: 'Link or URL input',
  },
  {
    type: 'image-gallery',
    label: 'Image Gallery',
    icon: Image,
    description: 'Multiple image uploads',
  },
  {
    type: 'audio-video',
    label: 'Audio/Video',
    icon: Video,
    description: 'Media file upload',
  },
  {
    type: 'code-snippet',
    label: 'Code Snippet',
    icon: Code,
    description: 'Code or text block',
  },
  {
    type: 'section-header',
    label: 'Section Header',
    icon: Heading,
    description: 'Organize with headers',
  },
];

function DraggableToolboxItem({ item }: { item: ToolboxItemData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `toolbox-${item.type}`,
    data: { type: item.type },
  });

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border bg-background cursor-grab active:cursor-grabbing hover:border-primary hover:bg-accent transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{item.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
      </div>
    </div>
  );
}

export function Toolbox() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Components</h2>
        <p className="text-sm text-muted-foreground">
          Drag components to the canvas
        </p>
      </div>
      <div className="space-y-2">
        {toolboxItems.map((item) => (
          <DraggableToolboxItem key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}
