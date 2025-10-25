export type FieldType =
  | 'file-upload'
  | 'text-input'
  | 'url-field'
  | 'image-gallery'
  | 'audio-video'
  | 'code-snippet'
  | 'section-header';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  helpText?: string;
  internalNote?: string;
  required: boolean;
  subfolderName?: string;
  placeholder?: string;
}

export interface FormBuilderState {
  projectName: string;
  clientName: string;
  fields: FormField[];
  selectedFieldId: string | null;
  shareableLink?: string;
}

export interface ToolboxItem {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}
