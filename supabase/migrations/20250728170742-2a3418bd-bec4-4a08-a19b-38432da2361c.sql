
-- Corrigir a função handle_employee_status_change para gerar o link correto
CREATE OR REPLACE FUNCTION public.handle_employee_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_corretora_user_id uuid;
    v_empresa_id uuid;
    v_link_url text;
BEGIN
    -- Só roda a lógica quando o status muda para 'exclusao_solicitada'
    IF TG_OP = 'UPDATE' AND NEW.status = 'exclusao_solicitada' AND OLD.status != 'exclusao_solicitada' THEN
        
        -- Busca o ID da corretora e da empresa de uma vez só
        SELECT e.corretora_id, e.id INTO v_corretora_user_id, v_empresa_id
        FROM public.cnpjs c
        JOIN public.empresas e ON c.empresa_id = e.id
        WHERE c.id = NEW.cnpj_id;

        -- Constrói a URL correta que leva direto para a gestão do plano
        v_link_url := '/corretora/seguros-de-vida/empresa/' || v_empresa_id || '/cnpj/' || NEW.cnpj_id;

        -- Inserir notificação para a corretora
        INSERT INTO public.notifications (
            user_id,
            type,
            message,
            entity_id,
            link_url
        ) VALUES (
            v_corretora_user_id,
            'exclusao_solicitada',
            'Funcionário ' || NEW.nome || ' solicitou exclusão do plano',
            NEW.id,
            v_link_url
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;
