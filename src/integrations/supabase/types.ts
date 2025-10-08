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
          cobertura_invalidez_acidade: number | null
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
          cobertura_invalidez_acidade?: number | null
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
          cobertura_invalidez_acidade?: number | null
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
            isOneToOne: false
            referencedRelation: "cnpjs"
            referencedColumns: ["id"]
          },
        ]
      }
      dependentes: {
        Row: {
          created_at: string
          data_nascimento: string
          funcionario_id: string
          id: string
          nome: string
          parentesco: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento: string
          funcionario_id: string
          id?: string
          nome: string
          parentesco: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string
          funcionario_id?: string
          id?: string
          nome?: string
          parentesco?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_funcionarios: {
        Row: {
          created_at: string
          dependente_id: string | null
          funcionario_id: string
          id: string
          nome_arquivo: string
          path_storage: string
          tipo_documento: string
        }
        Insert: {
          created_at?: string
          dependente_id?: string | null
          funcionario_id: string
          id?: string
          nome_arquivo: string
          path_storage: string
          tipo_documento: string
        }
        Update: {
          created_at?: string
          dependente_id?: string | null
          funcionario_id?: string
          id?: string
          nome_arquivo?: string
          path_storage?: string
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_funcionarios_dependente_id_fkey"
            columns: ["dependente_id"]
            isOneToOne: false
            referencedRelation: "dependentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
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
          data_admissao: string | null
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
          data_admissao?: string | null
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
          data_admissao?: string | null
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
      pendencias: {
        Row: {
          cnpj_id: string
          comentarios_count: number
          corretora_id: string
          created_at: string
          data_criacao: string
          data_vencimento: string
          descricao: string
          funcionario_id: string | null
          id: string
          protocolo: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          cnpj_id: string
          comentarios_count?: number
          corretora_id: string
          created_at?: string
          data_criacao?: string
          data_vencimento: string
          descricao: string
          funcionario_id?: string | null
          id?: string
          protocolo: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          cnpj_id?: string
          comentarios_count?: number
          corretora_id?: string
          created_at?: string
          data_criacao?: string
          data_vencimento?: string
          descricao?: string
          funcionario_id?: string | null
          id?: string
          protocolo?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendencias_cnpj_id_fkey"
            columns: ["cnpj_id"]
            isOneToOne: false
            referencedRelation: "cnpjs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_contratos: {
        Row: {
          file_name: string
          id: string
          plano_id: string
          storage_object_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          id?: string
          plano_id: string
          storage_object_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          id?: string
          plano_id?: string
          storage_object_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_contratos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: true
            referencedRelation: "dados_planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_contratos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_demonstrativos: {
        Row: {
          ano: number
          data_vencimento: string | null
          id: string
          mes: number
          path_boleto: string | null
          path_demonstrativo: string | null
          plano_id: string
          status: Database["public"]["Enums"]["boleto_status"] | null
          uploaded_at: string
        }
        Insert: {
          ano: number
          data_vencimento?: string | null
          id?: string
          mes: number
          path_boleto?: string | null
          path_demonstrativo?: string | null
          plano_id: string
          status?: Database["public"]["Enums"]["boleto_status"] | null
          uploaded_at?: string
        }
        Update: {
          ano?: number
          data_vencimento?: string | null
          id?: string
          mes?: number
          path_boleto?: string | null
          path_demonstrativo?: string | null
          plano_id?: string
          status?: Database["public"]["Enums"]["boleto_status"] | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_demonstrativos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "dados_planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_faixas_de_preco: {
        Row: {
          created_at: string | null
          faixa_fim: number
          faixa_inicio: number
          id: string
          plano_id: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          faixa_fim: number
          faixa_inicio: number
          id?: string
          plano_id: string
          valor: number
        }
        Update: {
          created_at?: string | null
          faixa_fim?: number
          faixa_inicio?: number
          id?: string
          plano_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "planos_faixas_de_preco_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "dados_planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_funcionarios: {
        Row: {
          created_at: string
          funcionario_id: string
          id: string
          plano_id: string
          status: Database["public"]["Enums"]["status_matricula"]
        }
        Insert: {
          created_at?: string
          funcionario_id: string
          id?: string
          plano_id: string
          status?: Database["public"]["Enums"]["status_matricula"]
        }
        Update: {
          created_at?: string
          funcionario_id?: string
          id?: string
          plano_id?: string
          status?: Database["public"]["Enums"]["status_matricula"]
        }
        Relationships: [
          {
            foreignKeyName: "planos_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_funcionarios_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "dados_planos"
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
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          last_attempt: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: Json
      }
      calcular_valor_mensal_plano_saude: {
        Args: { plano_uuid: string }
        Returns: number
      }
      contar_total_mensagens_nao_lidas: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_plano: {
        Args: {
          p_cnpj_id: string
          p_cobertura_auxilio_funeral: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_seguradora: string
          p_valor_mensal: number
        }
        Returns: Json
      }
      create_plano_v2: {
        Args: {
          p_cnpj_id: string
          p_cobertura_auxilio_funeral: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_seguradora: string
          p_tipo_seguro?: Database["public"]["Enums"]["tipo_seguro"]
          p_valor_mensal: number
        }
        Returns: Json
      }
      criar_funcionario_com_planos: {
        Args: {
          p_cargo: string
          p_cnpj_id: string
          p_cpf: string
          p_data_nascimento: string
          p_email: string
          p_estado_civil: Database["public"]["Enums"]["estado_civil"]
          p_incluir_saude?: boolean
          p_incluir_vida?: boolean
          p_nome: string
          p_salario: number
        }
        Returns: Json
      }
      debug_dashboard_data: {
        Args: { p_empresa_id?: string }
        Returns: Json
      }
      debug_receita_corretora: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_table_structure: {
        Args: Record<PropertyKey, never>
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
      generate_protocolo: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_acoes_necessarias_corretora: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_audit_logs: {
        Args: {
          p_action_type?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_start_date?: string
          p_user_email?: string
        }
        Returns: {
          action_type: string
          created_at: string
          details: Json
          entity_id: string
          id: string
          table_name: string
          user_email: string
        }[]
      }
      get_conversas_usuario: {
        Args: Record<PropertyKey, never>
        Returns: {
          conversa_id: string
          created_at: string
          empresa_nome: string
          protocolo: string
        }[]
      }
      get_corretora_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_details_corretora: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_metrics_geral: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_detailed_costs_report: {
        Args: { p_empresa_id: string; p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_distribuicao_status_funcionarios: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          status: string
        }[]
      }
      get_empresa_dashboard_metrics: {
        Args: Record<PropertyKey, never> | { p_empresa_id: string }
        Returns: Json
      }
      get_empresa_dashboard_metrics_central: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_empresa_dashboard_metrics_v3: {
        Args: Record<PropertyKey, never>
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
          cnpj_id: string
          cnpj_numero: string
          cnpj_razao_social: string
          cobertura_auxilio_funeral: number
          cobertura_invalidez_acidente: number
          cobertura_morte: number
          cobertura_morte_acidental: number
          custo_mensal_real: number
          funcionarios_ativos: number
          funcionarios_pendentes: number
          plano_id: string
          seguradora: string
          total_funcionarios: number
          valor_unitario: number
        }[]
      }
      get_empresas_com_metricas: {
        Args: Record<PropertyKey, never>
        Returns: {
          corretora_id: string
          created_at: string
          email: string
          id: string
          nome: string
          primeiro_acesso: boolean
          responsavel: string
          status_geral: string
          telefone: string
          total_funcionarios: number
          total_pendencias: number
          updated_at: string
        }[]
      }
      get_empresas_com_planos_por_tipo: {
        Args: { p_corretora_id: string; p_tipo_seguro: string }
        Returns: {
          id: string
          nome: string
          total_planos_ativos: number
        }[]
      }
      get_empresas_unificadas: {
        Args: Record<PropertyKey, never>
        Returns: {
          funcionarios_ativos: number
          funcionarios_pendentes: number
          id: string
          nome: string
          pendencias_criticas: number
          planos_saude: number
          planos_vida: number
          total_funcionarios: number
        }[]
      }
      get_funcionario_by_id: {
        Args: { p_funcionario_id: string }
        Returns: {
          cargo: string
          cnpj_id: string
          cnpj_numero: string
          cnpj_razao_social: string
          cpf: string
          created_at: string
          data_admissao: string
          data_nascimento: string
          email: string
          estado_civil: string
          id: string
          idade: number
          nome: string
          salario: number
          status: string
          updated_at: string
        }[]
      }
      get_funcionarios_arquivados: {
        Args: { p_cnpj_id: string }
        Returns: {
          cargo: string
          cnpj_id: string
          cpf: string
          created_at: string
          data_exclusao: string
          data_nascimento: string
          data_solicitacao_exclusao: string
          email: string
          estado_civil: Database["public"]["Enums"]["estado_civil"]
          id: string
          idade: number
          motivo_exclusao: string
          nome: string
          salario: number
          status: Database["public"]["Enums"]["funcionario_status"]
          updated_at: string
          usuario_executor: string
          usuario_solicitante: string
        }[]
      }
      get_funcionarios_ativos: {
        Args: { p_cnpj_id: string }
        Returns: {
          cargo: string
          cnpj_id: string
          cpf: string
          created_at: string
          data_exclusao: string
          data_nascimento: string
          data_solicitacao_exclusao: string
          email: string
          estado_civil: Database["public"]["Enums"]["estado_civil"]
          id: string
          idade: number
          motivo_exclusao: string
          nome: string
          salario: number
          status: Database["public"]["Enums"]["funcionario_status"]
          updated_at: string
          usuario_executor: string
          usuario_solicitante: string
        }[]
      }
      get_funcionarios_ativos_count: {
        Args: { p_cnpj_id: string }
        Returns: number
      }
      get_funcionarios_empresa_completo: {
        Args: {
          p_empresa_id: string
          p_page_num?: number
          p_page_size?: number
          p_search_term?: string
          p_status_filter?: string
        }
        Returns: {
          cargo: string
          cnpj_id: string
          cnpj_numero: string
          cnpj_razao_social: string
          cpf: string
          created_at: string
          data_nascimento: string
          email: string
          estado_civil: string
          funcionario_id: string
          idade: number
          nome: string
          plano_cobertura_morte: number
          plano_seguradora: string
          plano_valor_mensal: number
          salario: number
          status: string
          total_count: number
          updated_at: string
        }[]
      }
      get_funcionarios_fora_do_plano: {
        Args: { p_cnpj_id: string; p_plano_id: string }
        Returns: {
          cargo: string
          cpf: string
          id: string
          idade: number
          nome: string
          salario: number
          status: string
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
      get_pendencias_empresa: {
        Args: { p_empresa_id: string }
        Returns: {
          cnpj: string
          comentarios_count: number
          corretora_id: string
          data_criacao: string
          data_vencimento: string
          descricao: string
          dias_em_aberto: number
          funcionario_cpf: string
          funcionario_nome: string
          id: string
          prioridade: number
          protocolo: string
          razao_social: string
          status: string
          tipo: string
        }[]
      }
      get_plano_detalhes: {
        Args: { p_plano_id: string }
        Returns: {
          cnpj_id: string
          cnpj_numero: string
          cnpj_razao_social: string
          cobertura_auxilio_funeral: number
          cobertura_invalidez_acidente: number
          cobertura_morte: number
          cobertura_morte_acidental: number
          empresa_nome: string
          id: string
          seguradora: string
          valor_mensal: number
        }[]
      }
      get_planos_por_empresa: {
        Args: { p_empresa_id: string }
        Returns: {
          cnpj_id: string
          cnpj_numero: string
          cnpj_razao_social: string
          cobertura_auxilio_funeral: number
          cobertura_invalidez_acidente: number
          cobertura_morte: number
          cobertura_morte_acidental: number
          id: string
          seguradora: string
          valor_mensal: number
        }[]
      }
      get_pulse_financeiro_corretor: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_relatorio_custos_empresa: {
        Args: {
          p_empresa_id: string
          p_page_offset?: number
          p_page_size?: number
        }
        Returns: {
          cnpj_razao_social: string
          custo_medio_por_cnpj: number
          funcionario_cpf: string
          funcionario_nome: string
          status: string
          total_cnpj: number
          total_cnpjs_com_plano: number
          total_count: number
          total_funcionarios_ativos: number
          total_geral: number
          valor_individual: number
        }[]
      }
      get_relatorio_financeiro_corretora: {
        Args: { p_corretora_id: string }
        Returns: Json
      }
      get_relatorio_funcionarios_empresa: {
        Args:
          | { p_cnpj_id?: string; p_empresa_id: string }
          | {
              p_cnpj_id?: string
              p_empresa_id: string
              p_page_offset?: number
              p_page_size?: number
            }
        Returns: {
          cargo: string
          cnpj_razao_social: string
          cpf: string
          data_contratacao: string
          funcionario_id: string
          nome: string
          salario: number
          status: string
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
          cnpj_numero: string
          cnpj_razao_social: string
          empresa_nome: string
          funcionario_cargo: string
          funcionario_cpf: string
          funcionario_data_contratacao: string
          funcionario_id: string
          funcionario_nome: string
          funcionario_salario: number
          funcionario_status: string
        }[]
      }
      get_relatorio_movimentacao_corretora: {
        Args: {
          p_corretora_id: string
          p_data_fim: string
          p_data_inicio: string
        }
        Returns: {
          exclusoes: number
          inclusoes: number
          mes: string
          saldo: number
        }[]
      }
      get_relatorio_pendencias_empresa: {
        Args: { p_empresa_id: string }
        Returns: {
          cargo: string
          cnpj_razao_social: string
          cpf: string
          data_solicitacao: string
          funcionario_nome: string
          motivo: string
          status: string
        }[]
      }
      get_security_events: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_type: string
          created_at: string
          details: Json
          id: string
          user_email: string
          user_name: string
          user_role: Database["public"]["Enums"]["user_role"]
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
        Args: { p_assunto_id: string; p_empresa_id: string }
        Returns: string
      }
      iniciar_ou_obter_conversa_por_protocolo: {
        Args: { p_empresa_id: string; p_protocolo: string }
        Returns: string
      }
      log_security_event: {
        Args: { event_details?: Json; event_type: string }
        Returns: undefined
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
      path_plano_id: {
        Args: { _name: string }
        Returns: string
      }
      repair_missing_pendencias_for_empresa: {
        Args: { p_empresa_id?: string }
        Returns: {
          erro: string
          funcionario_id: string
          funcionario_nome: string
          pendencia_criada: boolean
        }[]
      }
      resolver_exclusao_funcionario: {
        Args: { p_aprovado: boolean; p_funcionario_id: string }
        Returns: Json
      }
      solicitar_ativacao_plano_existente: {
        Args: { p_funcionario_id: string; p_tipo_plano: string }
        Returns: Json
      }
      solicitar_exclusao_funcionario: {
        Args: { p_funcionario_id: string; p_motivo?: string }
        Returns: Json
      }
      test_dashboard_connection: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_simple_count: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      toggle_corretora_status: {
        Args: { target_user_id: string }
        Returns: Json
      }
      update_plano: {
        Args: {
          p_cobertura_auxilio_funeral: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_plano_id: string
          p_seguradora: string
          p_valor_mensal: number
        }
        Returns: Json
      }
      update_plano_v2: {
        Args: {
          p_cobertura_auxilio_funeral: number
          p_cobertura_invalidez_acidente: number
          p_cobertura_morte: number
          p_cobertura_morte_acidental: number
          p_plano_id: string
          p_seguradora: string
          p_tipo_seguro?: Database["public"]["Enums"]["tipo_seguro"]
          p_valor_mensal: number
        }
        Returns: Json
      }
      validate_cpf: {
        Args: { cpf_input: string }
        Returns: boolean
      }
    }
    Enums: {
      boleto_status: "pendente" | "pago" | "vencido"
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
      status_matricula: "ativo" | "pendente" | "inativo" | "exclusao_solicitada"
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
      boleto_status: ["pendente", "pago", "vencido"],
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
      status_matricula: ["ativo", "pendente", "inativo", "exclusao_solicitada"],
      tipo_seguro: ["vida", "saude", "outros"],
      user_role: ["corretora", "empresa", "admin"],
    },
  },
} as const
