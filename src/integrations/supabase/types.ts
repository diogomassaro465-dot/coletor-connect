export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      catadores: {
        Row: {
          area_atuacao: string | null
          autodeclaracao_racial: string
          cadastro_gov_br: boolean
          comprovante_residencia_url: string | null
          conta_bancaria_digital: string | null
          contribui_inss: boolean
          cpf: string
          cpf_foto_url: string | null
          created_by: string | null
          ctps: string | null
          ctps_foto_url: string | null
          data_cadastro: string
          email: string | null
          endereco_completo: string
          escolaridade: string
          genero: Database["public"]["Enums"]["catador_genero"]
          id: string
          inscrito_cadunico: boolean
          materiais_coletados: string[]
          nis: string | null
          nis_foto_url: string | null
          nivel_cadastro_gov_br: string | null
          nome_completo: string
          nome_cooperativa: string | null
          possui_bolsa_familia: boolean
          possui_carroca: boolean
          renda_media_mensal: number
          rg_cin: string
          rg_cin_foto_url: string | null
          status: Database["public"]["Enums"]["catador_status"]
          telefone: string | null
          tipo_carroca: string | null
          titulo_eleitor: string | null
          titulo_eleitor_foto_url: string | null
          updated_at: string
        }
        Insert: {
          area_atuacao?: string | null
          autodeclaracao_racial: string
          cadastro_gov_br?: boolean
          comprovante_residencia_url?: string | null
          conta_bancaria_digital?: string | null
          contribui_inss?: boolean
          cpf: string
          cpf_foto_url?: string | null
          created_by?: string | null
          ctps?: string | null
          ctps_foto_url?: string | null
          data_cadastro?: string
          email?: string | null
          endereco_completo: string
          escolaridade: string
          genero: Database["public"]["Enums"]["catador_genero"]
          id?: string
          inscrito_cadunico?: boolean
          materiais_coletados?: string[]
          nis?: string | null
          nis_foto_url?: string | null
          nivel_cadastro_gov_br?: string | null
          nome_completo: string
          nome_cooperativa?: string | null
          possui_bolsa_familia?: boolean
          possui_carroca?: boolean
          renda_media_mensal?: number
          rg_cin: string
          rg_cin_foto_url?: string | null
          status?: Database["public"]["Enums"]["catador_status"]
          telefone?: string | null
          tipo_carroca?: string | null
          titulo_eleitor?: string | null
          titulo_eleitor_foto_url?: string | null
          updated_at?: string
        }
        Update: {
          area_atuacao?: string | null
          autodeclaracao_racial?: string
          cadastro_gov_br?: boolean
          comprovante_residencia_url?: string | null
          conta_bancaria_digital?: string | null
          contribui_inss?: boolean
          cpf?: string
          cpf_foto_url?: string | null
          created_by?: string | null
          ctps?: string | null
          ctps_foto_url?: string | null
          data_cadastro?: string
          email?: string | null
          endereco_completo?: string
          escolaridade?: string
          genero?: Database["public"]["Enums"]["catador_genero"]
          id?: string
          inscrito_cadunico?: boolean
          materiais_coletados?: string[]
          nis?: string | null
          nis_foto_url?: string | null
          nivel_cadastro_gov_br?: string | null
          nome_completo?: string
          nome_cooperativa?: string | null
          possui_bolsa_familia?: boolean
          possui_carroca?: boolean
          renda_media_mensal?: number
          rg_cin?: string
          rg_cin_foto_url?: string | null
          status?: Database["public"]["Enums"]["catador_status"]
          telefone?: string | null
          tipo_carroca?: string | null
          titulo_eleitor?: string | null
          titulo_eleitor_foto_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendente"
      catador_genero: "feminino" | "masculino" | "lgbtqia" | "nao_responder"
      catador_status: "pendente" | "ativo" | "inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "atendente"],
      catador_genero: ["feminino", "masculino", "lgbtqia", "nao_responder"],
      catador_status: ["pendente", "ativo", "inativo"],
    },
  },
} as const
