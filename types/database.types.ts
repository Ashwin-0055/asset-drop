export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          token_expiry?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          client_name: string | null
          description: string | null
          status: string
          shareable_link_id: string
          link_password: string | null
          link_expiry: string | null
          link_disabled: boolean
          google_drive_folder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          client_name?: string | null
          description?: string | null
          status?: string
          shareable_link_id: string
          link_password?: string | null
          link_expiry?: string | null
          link_disabled?: boolean
          google_drive_folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          client_name?: string | null
          description?: string | null
          status?: string
          shareable_link_id?: string
          link_password?: string | null
          link_expiry?: string | null
          link_disabled?: boolean
          google_drive_folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      form_fields: {
        Row: {
          id: string
          project_id: string
          field_type: string
          label: string
          help_text: string | null
          internal_note: string | null
          is_required: boolean
          field_order: number
          storage_subfolder: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          field_type: string
          label: string
          help_text?: string | null
          internal_note?: string | null
          is_required?: boolean
          field_order: number
          storage_subfolder?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          field_type?: string
          label?: string
          help_text?: string | null
          internal_note?: string | null
          is_required?: boolean
          field_order?: number
          storage_subfolder?: string | null
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          project_id: string
          form_field_id: string | null
          file_name: string
          file_type: string | null
          file_size: number | null
          google_drive_file_id: string
          status: string
          uploaded_by: string
          metadata: Json | null
          rejection_reason: string | null
          approval_remark: string | null
          client_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          form_field_id?: string | null
          file_name: string
          file_type?: string | null
          file_size?: number | null
          google_drive_file_id: string
          status?: string
          uploaded_by?: string
          metadata?: Json | null
          rejection_reason?: string | null
          approval_remark?: string | null
          client_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          form_field_id?: string | null
          file_name?: string
          file_type?: string | null
          file_size?: number | null
          google_drive_file_id?: string
          status?: string
          uploaded_by?: string
          metadata?: Json | null
          rejection_reason?: string | null
          approval_remark?: string | null
          client_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          action_type: string
          action_details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          action_type: string
          action_details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          action_type?: string
          action_details?: Json | null
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type FormField = Database['public']['Tables']['form_fields']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']

export type FormFieldType =
  | 'file_upload'
  | 'text_input'
  | 'url_field'
  | 'image_gallery'
  | 'audio_video'
  | 'code_snippet'
  | 'section_header'

export type ProjectStatus = 'pending' | 'in_review' | 'complete'
export type AssetStatus = 'pending' | 'approved' | 'rejected'
