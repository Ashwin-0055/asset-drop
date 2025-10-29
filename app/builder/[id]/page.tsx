'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Save, Eye, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toolbox } from '@/components/builder/toolbox';
import { Canvas } from '@/components/builder/canvas';
import { PropertiesPanel } from '@/components/builder/properties-panel';
import { PreviewModal } from '@/components/builder/preview-modal';
import { FormField, FieldType } from '@/types/builder';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database.types';

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    params.then(p => {
      // Load project - will set correct UUID in loadProject
      loadProject(p.id);
    });
  }, []);

  async function loadProject(id: string) {
    try {
      // Load project - handle both UUID and shareable_link_id
      // Try UUID first
      let projectData, projectError;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUUID) {
        const result = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        projectData = result.data;
        projectError = result.error;
      } else {
        // If not a UUID, try shareable_link_id
        const result = await supabase
          .from('projects')
          .select('*')
          .eq('shareable_link_id', id)
          .single();
        projectData = result.data;
        projectError = result.error;
      }

      if (projectError) throw projectError;

      setProject(projectData);
      // IMPORTANT: Always use the actual UUID from the database, not the URL param
      setProjectId(projectData.id);
      setProjectName(projectData.name);
      setClientName(projectData.client_name || '');
      setDescription(projectData.description || '');

      // Load form fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('project_id', id)
        .order('field_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Convert database fields to FormField format
      const formFields: FormField[] = (fieldsData || []).map((field) => ({
        id: field.id,
        type: mapFieldTypeToBuilder(field.field_type),
        label: field.label,
        required: field.is_required,
        helpText: field.help_text || undefined,
      }));

      setFields(formFields);
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function mapFieldTypeToBuilder(dbType: string): FieldType {
    const mapping: Record<string, FieldType> = {
      file_upload: 'file-upload',
      text_input: 'text-input',
      url_field: 'url-field',
      image_gallery: 'image-gallery',
      audio_video: 'audio-video',
      code_snippet: 'code-snippet',
      section_header: 'section-header',
    };
    return mapping[dbType] || 'text-input';
  }

  function mapFieldTypeToDatabase(builderType: FieldType): string {
    const mapping: Record<FieldType, string> = {
      'file-upload': 'file_upload',
      'text-input': 'text_input',
      'url-field': 'url_field',
      'image-gallery': 'image_gallery',
      'audio-video': 'audio_video',
      'code-snippet': 'code_snippet',
      'section-header': 'section_header',
    };
    return mapping[builderType];
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from toolbox
    if (active.id.toString().startsWith('toolbox-')) {
      const fieldType = active.id.toString().replace('toolbox-', '') as FieldType;
      const newField: FormField = {
        id: nanoid(),
        type: fieldType,
        label: getDefaultLabel(fieldType),
        required: false,
      };

      if (over.id === 'canvas-dropzone') {
        setFields([...fields, newField]);
      } else {
        // Insert at specific position
        const overIndex = fields.findIndex((f) => f.id === over.id);
        if (overIndex !== -1) {
          const newFields = [...fields];
          newFields.splice(overIndex + 1, 0, newField);
          setFields(newFields);
        }
      }
    } else {
      // Reordering existing fields
      const activeIndex = fields.findIndex((f) => f.id === active.id);
      const overIndex = fields.findIndex((f) => f.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newFields = [...fields];
        const [removed] = newFields.splice(activeIndex, 1);
        newFields.splice(overIndex, 0, removed);
        setFields(newFields);
      }
    }
  };

  const getDefaultLabel = (type: FieldType): string => {
    const labels: Record<FieldType, string> = {
      'file-upload': 'File Upload',
      'text-input': 'Text Input',
      'url-field': 'URL Field',
      'image-gallery': 'Image Gallery',
      'audio-video': 'Audio/Video',
      'code-snippet': 'Code Snippet',
      'section-header': 'Section Header',
    };
    return labels[type];
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  const handleFieldDelete = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleSaveDraft = async () => {
    await saveFormFields();
  };

  async function saveFormFields() {
    try {
      setSaving(true);

      // Update project details
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          name: projectName,
          client_name: clientName,
          description: description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Delete existing form fields
      const { error: deleteError } = await supabase
        .from('form_fields')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Insert new form fields
      if (fields.length > 0) {
        const formFieldsToInsert = fields.map((field, index) => {
          const fieldData: any = {
            project_id: projectId,
            field_type: mapFieldTypeToDatabase(field.type),
            label: field.label,
            help_text: field.helpText || null,
            is_required: field.required,
            field_order: index,
          };

          // Only include ID if it's already a valid UUID (from database)
          // Otherwise let database auto-generate UUID
          if (field.id && !field.id.startsWith('toolbox-') && field.id.includes('-')) {
            fieldData.id = field.id;
          }

          return fieldData;
        });

        const { error: insertError } = await supabase
          .from('form_fields')
          .insert(formFieldsToInsert);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      toast({
        title: 'Saved',
        description: 'Your form has been saved successfully.',
      });

      // Reload to get fresh data
      await loadProject(projectId);
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save form',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  const handlePublish = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide a project name.',
        variant: 'destructive',
      });
      return;
    }

    if (fields.length === 0) {
      toast({
        title: 'No fields',
        description: 'Please add at least one field to your form.',
        variant: 'destructive',
      });
      return;
    }

    // Save the form first
    await saveFormFields();

    // Show success with shareable link
    toast({
      title: 'Form published',
      description: 'Your form is ready to share with clients.',
    });

    // Redirect to project page
    router.push(`/project/${projectId}`);
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const shareableLink = project ? `${typeof window !== 'undefined' ? window.location.origin : ''}/collect/${project.shareable_link_id}` : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Action Bar */}
      <div className="sticky top-0 z-40 border-b bg-background">
        <div className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/project/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="max-w-xs font-semibold"
              placeholder="Project name"
            />
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="max-w-xs"
              placeholder="Client name"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handlePublish} disabled={saving}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
        {shareableLink && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <span className="text-sm font-medium text-green-800">Shareable link:</span>
              <code className="text-sm flex-1 bg-white px-2 py-1 rounded border">
                {shareableLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareableLink);
                  toast({ title: 'Link copied', description: 'Shareable link copied to clipboard.' });
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Three-panel layout */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Toolbox */}
          <div className="w-64 border-r bg-muted/20 overflow-y-auto">
            <Toolbox />
          </div>

          {/* Center Panel - Canvas */}
          <div className="flex-1 overflow-y-auto">
            <Canvas
              fields={fields}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              onFieldDelete={handleFieldDelete}
            />
          </div>

          {/* Right Panel - Properties */}
          <div className="w-80 border-l bg-muted/20 overflow-y-auto">
            <PropertiesPanel
              field={selectedField}
              onFieldUpdate={handleFieldUpdate}
            />
          </div>
        </div>

        <DragOverlay>
          {activeId && (
            <div className="bg-background border-2 border-primary rounded-md p-4 shadow-lg">
              <p className="font-medium">
                {activeId.startsWith('toolbox-')
                  ? getDefaultLabel(activeId.replace('toolbox-', '') as FieldType)
                  : fields.find((f) => f.id === activeId)?.label}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Preview Modal */}
      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        projectName={projectName}
        clientName={clientName}
        fields={fields}
      />
    </div>
  );
}
