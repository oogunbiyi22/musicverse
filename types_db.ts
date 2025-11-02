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
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: string | null
          bio: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: string | null
          bio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string
          user_id: string
          audio_url: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content: string
          user_id: string
          audio_url?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string
          user_id?: string
          audio_url?: string | null
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      followers: {
        Row: {
          id: string
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          id?: string
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          is_read: boolean | null
          seen_at: string | null
          file_url: string | null
          file_path: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          is_read?: boolean | null
          seen_at?: string | null
          file_url?: string | null
          file_path?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          is_read?: boolean | null
          seen_at?: string | null
          file_url?: string | null
          file_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ,
      wave_comments: {
        Row: {
          id: string
          file_url: string
          user_id: string
          username: string | null
          comment: string
          timestamp: number
          created_at: string
        }
        Insert: {
          id?: string
          file_url: string
          user_id: string
          username?: string | null
          comment: string
          timestamp: number
          created_at?: string
        }
        Update: {
          id?: string
          file_url?: string
          user_id?: string
          username?: string | null
          comment?: string
          timestamp?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wave_comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ,
      sessions: {
        Row: {
          id: string
          file_url: string
          is_playing: boolean
          current_time: number
          updated_at: string
          created_by: string | null
          voice_open: boolean
        }
        Insert: {
          id?: string
          file_url: string
          is_playing?: boolean
          current_time?: number
          updated_at?: string
          created_by?: string | null
          voice_open?: boolean
        }
        Update: {
          id?: string
          file_url?: string
          is_playing?: boolean
          current_time?: number
          updated_at?: string
          created_by?: string | null
          voice_open?: boolean
        }
        Relationships: []
      }
      ,
      session_members: {
        Row: {
          session_id: string
          user_id: string
          role: 'owner' | 'moderator' | 'speaker' | 'listener'
          can_speak: boolean
          inserted_at: string
        }
        Insert: {
          session_id: string
          user_id: string
          role?: 'owner' | 'moderator' | 'speaker' | 'listener'
          can_speak?: boolean
          inserted_at?: string
        }
        Update: {
          session_id?: string
          user_id?: string
          role?: 'owner' | 'moderator' | 'speaker' | 'listener'
          can_speak?: boolean
          inserted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_members_session_id_fkey",
            columns: ["session_id"],
            referencedRelation: "sessions",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_members_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "users",
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}