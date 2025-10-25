'use client';

import { FormField } from '@/types/builder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldRenderer } from './field-renderer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  clientName: string;
  fields: FormField[];
}

export function PreviewModal({
  open,
  onOpenChange,
  projectName,
  clientName,
  fields,
}: PreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <DialogHeader className="flex-1">
              <DialogTitle className="text-2xl">{projectName}</DialogTitle>
              {clientName && (
                <p className="text-sm text-muted-foreground mt-1">Client: {clientName}</p>
              )}
            </DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          {fields.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">No fields added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add fields to your form to see them here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              {fields.map((field) => (
                <div key={field.id} className="animate-in fade-in-50 duration-200">
                  <FieldRenderer field={field} mode="preview" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {fields.length} {fields.length === 1 ? 'field' : 'fields'} in form
            </p>
            <Button onClick={() => onOpenChange(false)}>Close Preview</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
