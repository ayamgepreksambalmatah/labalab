/**
 * Database types for Supabase — hand-authored to match the schema in
 * supabase/migrations/0001_initial_schema.sql (spec §3).
 *
 * When the schema stabilises you can regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type Plan = "free" | "pro" | "max";
export type Platform = "shopee" | "tokopedia" | "tiktok";
export type SubscriptionStatus = "pending" | "paid" | "failed" | "expired";
export type TonePreference = "santai" | "profesional" | "genz";

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
          nomor_wa: string | null;
          tone_preference: TonePreference;
          notif_kuota_habis: boolean;
          notif_laporan_mingguan: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          store_name?: string | null;
          plan?: Plan;
          plan_expires_at?: string | null;
          nomor_wa?: string | null;
          tone_preference?: TonePreference;
          notif_kuota_habis?: boolean;
          notif_laporan_mingguan?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      active_sessions: {
        Row: {
          user_id: string;
          session_token: string;
          device_info: string | null;
          ip_address: string | null;
          location: string | null;
          last_active: string;
        };
        Insert: {
          user_id: string;
          session_token: string;
          device_info?: string | null;
          ip_address?: string | null;
          location?: string | null;
          last_active?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["active_sessions"]["Insert"]
        >;
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
          stok: number | null;
          ukuran_tersedia: string[] | null;
          faq: Json | null;
          garansi: string | null;
          cara_perawatan: string | null;
          bahan: string | null;
          deskripsi: string | null;
          masa_berlaku: string | null;
          sertifikasi: string | null;
          kondisi_pengiriman: string | null;
          catatan_tambahan: string | null;
          atribut_khusus: Json | null;
          harga_supplier: number | null;
          link_supplier: string | null;
          kontak_supplier: string | null;
          status_stok_supplier: string | null;
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
          stok?: number | null;
          ukuran_tersedia?: string[] | null;
          faq?: Json | null;
          garansi?: string | null;
          cara_perawatan?: string | null;
          bahan?: string | null;
          deskripsi?: string | null;
          masa_berlaku?: string | null;
          sertifikasi?: string | null;
          kondisi_pengiriman?: string | null;
          catatan_tambahan?: string | null;
          atribut_khusus?: Json | null;
          harga_supplier?: number | null;
          link_supplier?: string | null;
          kontak_supplier?: string | null;
          status_stok_supplier?: string | null;
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
          auto_renew: boolean;
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
          auto_renew?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
      product_audits: {
        Row: {
          id: string;
          user_id: string;
          judul: string | null;
          kategori: string | null;
          score: number | null;
          ai_result: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          judul?: string | null;
          kategori?: string | null;
          score?: number | null;
          ai_result?: Json | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_audits"]["Insert"]
        >;
        Relationships: [];
      };
      product_sales_history: {
        Row: {
          id: string;
          product_id: string;
          sales_report_id: string;
          periode_label: string | null;
          unit_terjual: number;
          omzet: number;
          biaya: number;
          modal: number;
          profit: number;
          margin: number;
          refund_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sales_report_id: string;
          periode_label?: string | null;
          unit_terjual?: number;
          omzet?: number;
          biaya?: number;
          modal?: number;
          profit?: number;
          margin?: number;
          refund_count?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_sales_history"]["Insert"]
        >;
        Relationships: [];
      };
      product_chat_stats: {
        Row: {
          id: string;
          product_id: string;
          periode: string;
          jumlah_chat: number | null;
          jumlah_checkout_setelah_chat: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          periode: string;
          jumlah_chat?: number | null;
          jumlah_checkout_setelah_chat?: number | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_chat_stats"]["Insert"]
        >;
        Relationships: [];
      };
      plan_limits: {
        Row: {
          plan: string;
          sales_analyzer_per_month: number;
          product_doctor_per_month: number;
          cs_reply_per_month: number;
          listing_generator_per_month: number;
          updated_at: string;
        };
        Insert: {
          plan: string;
          sales_analyzer_per_month: number;
          product_doctor_per_month: number;
          cs_reply_per_month: number;
          listing_generator_per_month?: number;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["plan_limits"]["Insert"]
        >;
        Relationships: [];
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          periode_bulan: string;
          jumlah_pemakaian: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          feature: string;
          periode_bulan: string;
          jumlah_pemakaian?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_logs"]["Insert"]>;
        Relationships: [];
      };
      sales_transactions: {
        Row: {
          id: string;
          user_id: string;
          product_id: string | null;
          sales_report_id: string | null;
          tanggal: string;
          nama_produk: string;
          platform: string;
          qty: number;
          harga_satuan: number;
          omzet: number;
          biaya_platform: number;
          modal: number;
          profit: number;
          status: string | null;
          sumber: string;
          catatan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id?: string | null;
          sales_report_id?: string | null;
          tanggal: string;
          nama_produk: string;
          platform: string;
          qty?: number;
          harga_satuan?: number;
          omzet?: number;
          biaya_platform?: number;
          modal?: number;
          profit?: number;
          status?: string | null;
          sumber?: string;
          catatan?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["sales_transactions"]["Insert"]
        >;
        Relationships: [];
      };
      stock_purchases: {
        Row: {
          id: string;
          user_id: string;
          product_id: string | null;
          nama_produk: string;
          tanggal: string;
          qty_dibeli: number;
          total_bayar: number;
          harga_per_unit: number;
          added_to_stock: boolean;
          updated_supplier_price: boolean;
          catatan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id?: string | null;
          nama_produk: string;
          tanggal: string;
          qty_dibeli?: number;
          total_bayar?: number;
          harga_per_unit?: number;
          added_to_stock?: boolean;
          updated_supplier_price?: boolean;
          catatan?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_purchases"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      increment_usage_if_allowed: {
        Args: {
          p_user_id: string;
          p_feature: string;
          p_period: string;
          p_max: number;
        };
        Returns: number;
      };
      decrement_usage: {
        Args: { p_user_id: string; p_feature: string; p_period: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
  };
}
