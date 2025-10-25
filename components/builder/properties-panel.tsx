'use client';

import { FormField } from '@/types/builder';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FolderOpen } from 'lucide-react';

interface PropertiesPanelProps {
  field?: FormField;
  onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void;
}

export function PropertiesPanel({ field, onFieldUpdate }: PropertiesPanelProps) {
  if (!field) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No field selected</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a field from the canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const updateField = (updates: Partial<FormField>) => {
    onFieldUpdate(field.id, updates);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Properties</h2>
        <p className="text-sm text-muted-foreground capitalize">{field.type.replace('-', ' ')}</p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="storage" className="text-xs">
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>

          {/* Help Text */}
          <div className="space-y-2">
            <Label htmlFor="helpText">Help Text</Label>
            <Textarea
              id="helpText"
              value={field.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value })}
              placeholder="Help text for users (optional)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be shown to users filling out the form
            </p>
          </div>

          {/* Internal Note */}
          <div className="space-y-2">
            <Label htmlFor="internalNote">Internal Note</Label>
            <Textarea
              id="internalNote"
              value={field.internalNote || ''}
              onChange={(e) => updateField({ internalNote: e.target.value })}
              placeholder="Internal note (optional)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Private note only visible to you
            </p>
          </div>

          {/* Placeholder (for text fields) */}
          {(field.type === 'text-input' || field.type === 'url-field') && (
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                value={field.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                placeholder="Placeholder text (optional)"
              />
            </div>
          )}

          {/* Required Toggle */}
          {field.type !== 'section-header' && (
            <div className="flex items-center justify-between space-x-2 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="required">Required Field</Label>
                <p className="text-xs text-muted-foreground">
                  User must fill this field
                </p>
              </div>
              <Switch
                id="required"
                checked={field.required}
                onCheckedChange={(checked) => updateField({ required: checked })}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="storage" className="space-y-4 mt-4">
          {/* Subfolder Name */}
          {field.type !== 'section-header' && field.type !== 'text-input' && (
            <div className="space-y-2">
              <Label htmlFor="subfolderName">Subfolder Name</Label>
              <Input
                id="subfolderName"
                value={field.subfolderName || ''}
                onChange={(e) => updateField({ subfolderName: e.target.value })}
                placeholder="e.g., logos, documents"
              />
              <p className="text-xs text-muted-foreground">
                Uploaded files will be stored in this subfolder
              </p>
            </div>
          )}

          {(field.type === 'section-header' || field.type === 'text-input') && (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Storage settings not available for this field type</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
