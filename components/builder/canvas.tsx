'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { FormField } from '@/types/builder';
import { FieldRenderer } from './field-renderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
}

function DraggableField({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: field.id,
    data: { field },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border-2 bg-background transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50',
        isDragging && 'opacity-50'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>

      {/* Field Content */}
      <div className="p-4 pl-12 pr-12">
        <FieldRenderer field={field} mode="builder" />
      </div>
    </div>
  );
}

function DroppableField({ fieldId, children }: { fieldId: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: fieldId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn('relative', isOver && 'ring-2 ring-primary rounded-lg')}
    >
      {children}
    </div>
  );
}

export function Canvas({ fields, selectedFieldId, onFieldSelect, onFieldDelete }: CanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-dropzone',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-full p-8',
        isOver && 'bg-accent/50'
      )}
      onClick={() => onFieldSelect('')}
    >
      {fields.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <GripVertical className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Start building your form</h3>
            <p className="text-muted-foreground max-w-sm">
              Drag components from the left panel to begin creating your form
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {fields.map((field) => (
            <DroppableField key={field.id} fieldId={field.id}>
              <DraggableField
                field={field}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onFieldSelect(field.id)}
                onDelete={() => onFieldDelete(field.id)}
              />
            </DroppableField>
          ))}
        </div>
      )}
    </div>
  );
}
