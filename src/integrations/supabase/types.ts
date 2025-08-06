export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assuntos_atendimento: {
        Row: {
          created_at: string
          id: string
          mensagem_padrao: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem_padrao: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem_padrao?: string
          nome?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json
          entity_id: string
          id: string
          table_name: string
          user_email: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details: Json
          entity_id: string
          id?: string
          table_name: string
          user_email: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json
          entity_id?: string
          id?: string
          table_name?: string
          user_email?: string
        }
        Relationships: []
      }
      cnpjs: {
        Row: {
          cnpj: string
          created_at: string
          empresa_id: string
          id: string
          razao_social: string
          status: Database["public"]["Enums"]["cnpj_status"]
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          empresa_id: string
          id?: string
          razao_social: string
          status?: Database["public"]["Enums"]["cnpj_status"]
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          empresa_id?: string
          id?: string
          razao_social?: string
          status?: Database["public"]["Enums"]["cnpj_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cnpjs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          corretora_id: string | null
          created_at: string
          empresa_id: string | null
          id: string
          protocolo: string | null
        }
        Insert: {
          corretora_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          protocolo?: string | null
        }
        Update: {
          corretora_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          protocolo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      corretora_branding: {
        Row: {
          cor_primaria: string | null
          corretora_id: string
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          cor_primaria?: string | null
          corretora_id: string
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          cor_primaria?: string | null
          corretora_id?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corretora_branding_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_planos: {
        Row: {
          cnpj_id: string
          cobertura_auxilio_funeral: number
          cobertura_invalidez_acidente: number
          cobertura_morte: number
          cobertura_morte_acidental: number
          created_at: string
          id: string
          seguradora: string
          tipo_seguro: Database["public"]["Enums"]["tipo_seguro"]
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          cnpj_id: string
          cobertura_auxilio_funeral: number
          cobertura_invalidez_acidente: number
          cobertura_morte: number
          cobertura_morte_acidental: number
          created_at?: string
          id?: string
          seguradora: string
          tipo_seguro?: Database["public"]["Enums"]["tipo_seguro"]
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          cnpj_id?: string
          cobertura_auxilio_funeral?: number
          cobertura_invalidez_acidente?: number
          cobertura_morte?: number
          cobertura_morte_acidental?: number
          created_at?: string
          id?: string
          seguradora?: string
          tipo_seguro?: Database["public"]["Enums"]["tipo_seguro"]
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "dados_planos_cnpj_id_fkey"
            columns: ["cnpj_id"]
            isOneToOne: true
            referencedRelation: "cnpjs"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_branding: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_branding_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          corretora_id: string
          created_at: string
          email: string
          id: string
          nome: string
          primeiro_acesso: boolean
          responsavel: string
          telefone: string
          updated_at: string
        }
        Insert: {
          corretora_id: string
          created_at?: string
          email: string
          id?: string
          nome: string
          primeiro_acesso?: boolean
          responsavel: string
          telefone: string
          updated_at?: string
        }
        Update: {
          corretora_id?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string
          primeiro_acesso?: boolean
          responsavel?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          cargo: string
          cnpj_id: string
          cpf: string
          created_at: string
          dados_pendentes: Json | null
          data_exclusao: string | null
          data_nascimento: string
          data_solicitacao_exclusao: string | null
          email: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null
          id: string
          idade: number
          motivo_exclusao: string | null
          nome: string
          salario: number
          status: Database["public"]["Enums"]["funcionario_status"]
          updated_at: string
          usuario_executor: string | null
          usuario_solicitante: string | null
        }
        Insert: {
          cargo: string
          cnpj_id: string
          cpf: string
          created_at?: string
          dados_pendentes?: Json | null
          data_exclusao?: string | null
          data_nascimento: string
          data_solicitacao_exclusao?: string | null
          email?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          id?: string
          idade: number
          motivo_exclusao?: string | null
          nome: string
          salario: number
          status?: Database["public"]["Enums"]["funcionario_status"]
          updated_at?: string
          usuario_executor?: string | null
          usuario_solicitante?: string | null
        }
        Update: {
          cargo?: string
          cnpj_id?: string
          cpf?: string
          created_at?: string
          dados_pendentes?: Json | null
          data_exclusao?: string | null
          data_nascimento?: string
          data_solicitacao_exclusao?: string | null
          email?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          id?: string
          idade?: number
          motivo_exclusao?: string | null
          nome?: string
          salario?: number
          status?: Database["public"]["Enums"]["funcionario_status"]
          updated_at?: string
          usuario_executor?: string | null
          usuario_solicitante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_cnpj_id_fkey"
            columns: ["cnpj_id"]
            isOneToOne: false
            referencedRelation: "cnpjs"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_funcionarios: {
        Row: {
          cargo: string
          cnpj_id: string | null
          cpf: string
          created_at: string
          data_nascimento: string
          data_saida: string
          email: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil"]
          funcionario_id: string | null
          id: string
          idade: number
          motivo_saida: string
          nome: string
          observacoes: string | null
          salario: number
        }
        Insert: {
          cargo: string
          cnpj_id?: string | null
          cpf: string
          created_at?: string
          data_nascimento: string
          data_saida?: string
          email?: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil"]
          funcionario_id?: string | null
          id?: string
          idade: number
          motivo_saida: string
          nome: string
          observacoes?: string | null
          salario: number
        }
        Update: {
          cargo?: string
          cnpj_id?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string
          data_saida?: string
          email?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"]
          funcionario_id?: string | null
          id?: string
          idade?: number
          motivo_saida?: string
          nome?: string
          observacoes?: string | null
          salario?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_funcionarios_cnpj_id_fkey"
            columns: ["cnpj_id"]
            isOneToOne: false
            referencedRelation: "cnpjs"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          created_at: string
          id: number
          lida: boolean
          lida_em: string | null
          metadata: Json | null
          remetente_id: string
          tipo: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          created_at?: string
          id?: never
          lida?: boolean
          lida_em?: string | null
          metadata?: Json | null
          remetente_id: string
          tipo?: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          created_at?: string
          id?: never
          lida?: boolean
          lida_em?: string | null
          metadata?: Json | null
          remetente_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          link_url: string | null
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          link_url?: string | null
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          link_url?: string | null
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nome: string
          notificacoes_email: boolean | null
          notificacoes_sistema: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id?: string | null
          id: string
          nome: string
          notificacoes_email?: boolean | null
          notificacoes_sistema?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          notificacoes_email?: boolean | null
          notificacoes_sistema?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users_view: {
        Row: {
          email: string | null
          empresa_id: string | null
          id: string | null
          nome: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      contar_total_mensagens_nao_lidas: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_plano: {
        Args: {
          p_cnpj_id: string
          p_seguradora: string
          p_valor_mensal: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_auxilio_funeral: number
        }
        Returns: Json
      }
      create_plano_v2: {
        Args: {
          p_cnpj_id: string
          p_seguradora: string
          p_valor_mensal: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_auxilio_funeral: number
          p_tipo_seguro?: Database["public"]["Enums"]["tipo_seguro"]
        }
        Returns: Json
      }
      deletar_conversa: {
        Args: { p_conversa_id: string }
        Returns: undefined
      }
      delete_cnpj_with_cleanup: {
        Args: { cnpj_id_param: string }
        Returns: boolean
      }
      delete_empresa_with_cleanup: {
        Args: { empresa_id_param: string }
        Returns: boolean
      }
      delete_plano: {
        Args: { p_plano_id: string }
        Returns: Json
      }
      email_exists: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      executar_exclusao_funcionario: {
        Args: { p_funcionario_id: string }
        Returns: Json
      }
      find_or_create_conversation_corretora: {
        Args: { p_empresa_id: string }
        Returns: Json
      }
      find_or_create_conversation_empresa: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_acoes_necessarias_corretora: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_audit_logs: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_user_email?: string
          p_action_type?: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          id: string
          user_email: string
          action_type: string
          entity_id: string
          table_name: string
          details: Json
          created_at: string
        }[]
      }
      get_conversas_usuario: {
        Args: Record<PropertyKey, never>
        Returns: {
          conversa_id: string
          empresa_nome: string
          created_at: string
          protocolo: string
        }[]
      }
      get_corretora_dashboard_metrics: {
        Args: Record<PropertyKey, never> | { p_corretora_id: string }
        Returns: Json
      }
      get_dashboard_details_corretora: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_distribuicao_status_funcionarios: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          count: number
        }[]
      }
      get_empresa_dashboard_metrics: {
        Args: Record<PropertyKey, never> | { p_empresa_id: string }
        Returns: Json
      }
      get_empresa_distribuicao_cargos: {
        Args: Record<PropertyKey, never>
        Returns: {
          cargo: string
          count: number
        }[]
      }
      get_empresa_evolucao_mensal: {
        Args: Record<PropertyKey, never>
        Returns: {
          mes: string
          novos_funcionarios: number
        }[]
      }
      get_empresa_planos_unificados: {
        Args: { p_empresa_id: string }
        Returns: {
          plano_id: string
          cnpj_id: string
          seguradora: string
          valor_unitario: number
          cobertura_morte: number
          cobertura_morte_acidental: number
          cobertura_invalidez_acidente: number
          cobertura_auxilio_funeral: number
          cnpj_numero: string
          cnpj_razao_social: string
          funcionarios_ativos: number
          funcionarios_pendentes: number
          total_funcionarios: number
          custo_mensal_real: number
        }[]
      }
      get_empresas_com_metricas: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nome: string
          responsavel: string
          email: string
          telefone: string
          corretora_id: string
          created_at: string
          updated_at: string
          primeiro_acesso: boolean
          total_funcionarios: number
          total_pendencias: number
          status_geral: string
        }[]
      }
      get_funcionarios_arquivados: {
        Args: { p_cnpj_id: string }
        Returns: {
          id: string
          nome: string
          cpf: string
          data_nascimento: string
          idade: number
          cargo: string
          salario: number
          estado_civil: Database["public"]["Enums"]["estado_civil"]
          email: string
          cnpj_id: string
          status: Database["public"]["Enums"]["funcionario_status"]
          created_at: string
          updated_at: string
          data_solicitacao_exclusao: string
          data_exclusao: string
          motivo_exclusao: string
          usuario_solicitante: string
          usuario_executor: string
        }[]
      }
      get_funcionarios_ativos: {
        Args: { p_cnpj_id: string }
        Returns: {
          id: string
          nome: string
          cpf: string
          data_nascimento: string
          idade: number
          cargo: string
          salario: number
          estado_civil: Database["public"]["Enums"]["estado_civil"]
          email: string
          cnpj_id: string
          status: Database["public"]["Enums"]["funcionario_status"]
          created_at: string
          updated_at: string
          data_solicitacao_exclusao: string
          data_exclusao: string
          motivo_exclusao: string
          usuario_solicitante: string
          usuario_executor: string
        }[]
      }
      get_funcionarios_ativos_count: {
        Args: { p_cnpj_id: string }
        Returns: number
      }
      get_funcionarios_empresa_completo: {
        Args: {
          p_empresa_id: string
          p_search_term?: string
          p_status_filter?: string
          p_page_size?: number
          p_page_num?: number
        }
        Returns: {
          funcionario_id: string
          nome: string
          cpf: string
          cargo: string
          salario: number
          status: string
          idade: number
          data_nascimento: string
          estado_civil: string
          email: string
          created_at: string
          updated_at: string
          cnpj_id: string
          cnpj_razao_social: string
          cnpj_numero: string
          plano_seguradora: string
          plano_valor_mensal: number
          plano_cobertura_morte: number
          total_count: number
        }[]
      }
      get_my_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_operational_metrics_corretor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pulse_financeiro_corretor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_relatorio_custos_empresa: {
        Args:
          | { p_empresa_id: string }
          | {
              p_empresa_id: string
              p_page_size?: number
              p_page_offset?: number
            }
        Returns: {
          cnpj_razao_social: string
          funcionario_nome: string
          funcionario_cpf: string
          valor_individual: number
          status: string
        }[]
      }
      get_relatorio_financeiro_corretora: {
        Args: { p_corretora_id: string }
        Returns: {
          empresa_id: string
          empresa_nome: string
          total_cnpjs_ativos: number
          total_funcionarios_segurados: number
          custo_total_mensal: number
        }[]
      }
      get_relatorio_funcionarios_empresa: {
        Args:
          | { p_empresa_id: string; p_cnpj_id?: string }
          | {
              p_empresa_id: string
              p_cnpj_id?: string
              p_page_size?: number
              p_page_offset?: number
            }
        Returns: {
          funcionario_id: string
          nome: string
          cpf: string
          cargo: string
          salario: number
          status: string
          cnpj_razao_social: string
          data_contratacao: string
          total_count: number
        }[]
      }
      get_relatorio_geral_funcionarios: {
        Args: {
          p_corretora_id: string
          p_empresa_id?: string
          p_status?: string
        }
        Returns: {
          funcionario_id: string
          funcionario_nome: string
          funcionario_cpf: string
          funcionario_cargo: string
          funcionario_salario: number
          funcionario_status: string
          funcionario_data_contratacao: string
          empresa_nome: string
          cnpj_razao_social: string
          cnpj_numero: string
        }[]
      }
      get_relatorio_movimentacao_corretora: {
        Args: {
          p_corretora_id: string
          p_data_inicio: string
          p_data_fim: string
        }
        Returns: {
          mes: string
          inclusoes: number
          exclusoes: number
          saldo: number
        }[]
      }
      get_relatorio_pendencias_empresa: {
        Args: { p_empresa_id: string }
        Returns: {
          funcionario_nome: string
          cpf: string
          cargo: string
          status: string
          cnpj_razao_social: string
          data_solicitacao: string
          motivo: string
        }[]
      }
      get_smart_actions_corretor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_top_empresas_receita: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: string
      }
      iniciar_conversa_com_protocolo: {
        Args: { p_empresa_id: string; p_assunto_id: string }
        Returns: string
      }
      marcar_mensagens_como_lidas: {
        Args: { p_conversa_id: string }
        Returns: undefined
      }
      mark_all_notifications_as_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_as_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      resolver_exclusao_funcionario: {
        Args:
          | { p_funcionario_id: string; p_acao: string; p_executor_id: string }
          | { p_funcionario_id: string; p_aprovado: boolean }
        Returns: undefined
      }
      solicitar_exclusao_funcionario: {
        Args: { p_funcionario_id: string; p_motivo?: string }
        Returns: Json
      }
      toggle_corretora_status: {
        Args: { target_user_id: string }
        Returns: Json
      }
      update_plano: {
        Args: {
          p_plano_id: string
          p_seguradora: string
          p_valor_mensal: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_auxilio_funeral: number
        }
        Returns: Json
      }
      update_plano_v2: {
        Args: {
          p_plano_id: string
          p_seguradora: string
          p_valor_mensal: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_auxilio_funeral: number
          p_tipo_seguro?: Database["public"]["Enums"]["tipo_seguro"]
        }
        Returns: Json
      }
    }
    Enums: {
      cnpj_status: "configuracao" | "suspenso" | "ativo"
      estado_civil:
        | "solteiro"
        | "casado"
        | "divorciado"
        | "viuvo"
        | "uniao_estavel"
      funcionario_status:
        | "pendente"
        | "ativo"
        | "desativado"
        | "exclusao_solicitada"
        | "pendente_exclusao"
        | "arquivado"
        | "edicao_solicitada"
      tipo_seguro: "vida" | "saude" | "outros"
      user_role: "corretora" | "empresa" | "admin"
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
      cnpj_status: ["configuracao", "suspenso", "ativo"],
      estado_civil: [
        "solteiro",
        "casado",
        "divorciado",
        "viuvo",
        "uniao_estavel",
      ],
      funcionario_status: [
        "pendente",
        "ativo",
        "desativado",
        "exclusao_solicitada",
        "pendente_exclusao",
        "arquivado",
        "edicao_solicitada",
      ],
      tipo_seguro: ["vida", "saude", "outros"],
      user_role: ["corretora", "empresa", "admin"],
    },
  },
} as const
