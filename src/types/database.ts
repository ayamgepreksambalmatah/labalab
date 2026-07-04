/**
 * Database types for Supabase — hand-authored to match the schema in
 * supabase/migrations/0001_initial_schema.sql (spec §3).
 *
 * When the schema stabilises you can regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type Plan = "free" | "pro";
export type Platform = "shopee" | "tokopedia" | "tiktok";
export type SubscriptionStatus = "pending" | "paid" | "failed" | "expired";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          store_name: string | null;
          plan: Plan;
          plan_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          store_name?: string | null;
          plan?: Plan;
          plan_expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          nama: string;
          platform: Platform;
          kategori: string;
          harga: number;
          modal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nama: string;
          platform: Platform;
          kategori: string;
          harga?: number;
          modal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      sales_reports: {
        Row: {
          id: string;
          user_id: string;
          source_label: string | null;
          total_omzet: number | null;
          total_profit: number | null;
          total_margin: number | null;
          total_lost_profit: number | null;
          ai_summary: Json | null;
          raw_products: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_label?: string | null;
          total_omzet?: number | null;
          total_profit?: number | null;
          total_margin?: number | null;
          total_lost_profit?: number | null;
          ai_summary?: Json | null;
          raw_products?: Json | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["sales_reports"]["Insert"]
        >;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          midtrans_order_id: string;
          plan: Plan;
          amount: number;
          status: SubscriptionStatus;
          paid_at: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          midtrans_order_id: string;
          plan: Plan;
          amount: number;
          status?: SubscriptionStatus;
          paid_at?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
}
