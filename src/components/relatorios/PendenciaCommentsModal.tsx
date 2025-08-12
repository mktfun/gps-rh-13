
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Calendar, Sparkles, Info, MessageCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnviarMensagem } from '@/hooks/useEnviarMensagem';
import { openChatWidget } from '@/utils/chatWidgetEvents';

interface PendenciaCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendencia: {
    id: string;
    protocolo: string;
    funcionario_nome: string;
    cpf: string;
    cargo: string;
    status: string;
    cnpj_razao_social: string;
    data_solicitacao: string;
    motivo: string;
    descricao: string;
    comentarios_count: number;
  };
}

export const PendenciaCommentsModal: React.FC<PendenciaCommentsModalProps> = ({
  isOpen,
  onClose,
  pendencia
}) => {
  const [message, setMessage] = useState('');
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();
  const enviarMensagem = useEnviarMensagem(conversaId || '');

  // Buscar empresa_id a partir da pendência e vincular/obter a conversa pelo protocolo
  useEffect(() => {
    const run = async () => {
      if (!isOpen) return;
      setIsLinking(true);
      setConversaId(null);

      try {
        console.log('🔎 Buscando empresa da pendência:', pendencia.id);
        const { data: empresaLookup, error: empresaError } = await supabase
          .from('pendencias')
          .select('cnpj_id, cnpjs!inner(empresa_id)')
          .eq('id', pendencia.id)
          .limit(1)
          .single();

        if (empresaError) {
          console.error('❌ Erro ao buscar empresa da pendência:', empresaError);
          toast({
            title: 'Erro',
            description: 'Não foi possível identificar a empresa desta pendência.',
            variant: 'destructive',
          });
          return;
        }

        const foundEmpresaId = (empresaLookup as any)?.cnpjs?.empresa_id;
        if (!foundEmpresaId) {
          console.warn('⚠️ empresa_id não localizado para pendência:', pendencia.id, empresaLookup);
          toast({
            title: 'Aviso',
            description: 'Não foi possível vincular esta pendência a uma empresa.',
            variant: 'destructive',
          });
          return;
        }

        setEmpresaId(foundEmpresaId);
        console.log('🏢 empresa_id encontrado:', foundEmpresaId, '— vinculando/obtendo conversa por protocolo:', pendencia.protocolo);

        const { data: conversaUuid, error: conversaError } = await supabase.rpc(
          'iniciar_ou_obter_conversa_por_protocolo',
          {
            p_empresa_id: foundEmpresaId,
            p_protocolo: pendencia.protocolo,
          }
        );

        if (conversaError) {
          console.error('❌ Erro ao vincular/obter conversa:', conversaError);
          toast({
            title: 'Erro',
            description: 'Não foi possível vincular a conversa para esta pendência.',
            variant: 'destructive',
          });
          return;
        }

        if (conversaUuid) {
          setConversaId(conversaUuid as unknown as string);
          console.log('✅ Conversa vinculada:', conversaUuid);
        }
      } finally {
        setIsLinking(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendencia.id, pendencia.protocolo]);

  // Calcular dias em atraso
  const diasAtraso = useMemo(() => {
    if (!pendencia.data_solicitacao) return 0;
    return differenceInDays(new Date(), new Date(pendencia.data_solicitacao));
  }, [pendencia.data_solicitacao]);

  // Gerar dados contextuais da pendência
  const dadosContextuais = useMemo(() => {
    const dados = [
      `📋 MENSAGEM DA EMPRESA PARA A CORRETORA - PROTOCOLO ${pendencia.protocolo}`,
      ``,
      `👤 Funcionário: ${pendencia.funcionario_nome}`,
      `📄 CPF: ${pendencia.cpf}`,
      `💼 Cargo: ${pendencia.cargo}`,
      `🏢 Empresa: ${pendencia.cnpj_razao_social}`,
      `📊 Motivo: ${pendencia.motivo}`,
      `📅 Data da Solicitação: ${format(new Date(pendencia.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}`,
      `⏰ Tempo em Aberto: ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`,
      `🔍 Descrição: ${pendencia.descricao}`,
      ``,
      `---`,
      `MENSAGEM DA EMPRESA:`,
      ``
    ];

    return dados.join('\n');
  }, [pendencia, diasAtraso]);

  // Sugestões de mensagem da empresa para a corretora
  const suggestions = useMemo(() => {
    const nome = pendencia.funcionario_nome?.split(' ')?.[0] || pendencia.funcionario_nome;
    const desc = (pendencia.descricao || '').toLowerCase();
    const dias = diasAtraso;

    const base: string[] = [];

    // Sugestões baseadas no tempo em aberto
    if (dias > 7) {
      base.push(`Olá, equipe da corretora, o funcionário ${nome} (CPF: ${pendencia.cpf}) está com pendência há ${dias} dias e ainda não recebemos nenhum retorno. Precisamos de uma posição urgente sobre esta solicitação.`);
    } else if (dias > 3) {
      base.push(`Olá, equipe da corretora, notamos que a pendência do funcionário ${nome} (CPF: ${pendencia.cpf}) está em aberto há ${dias} dias. Poderiam nos dar um retorno sobre o andamento?`);
    } else {
      base.push(`Olá, equipe da corretora, sobre a pendência do funcionário ${nome} (CPF: ${pendencia.cpf}), há alguma documentação adicional necessária para prosseguirmos?`);
    }

    // Sugestões baseadas na descrição
    if (desc.includes('document') || desc.includes('doc') || desc.includes('anexo')) {
      base.push(`Sobre o funcionário ${nome} (CPF: ${pendencia.cpf}), ainda aguardamos os documentos pendentes. Poderiam providenciar o quanto antes?`);
    }

    if (desc.includes('cpf') || desc.includes('dados') || desc.includes('informação')) {
      base.push(`Identificamos uma divergência nos dados do funcionário ${nome} (CPF: ${pendencia.cpf}). Poderiam confirmar as informações cadastrais para prosseguirmos?`);
    }

    if (desc.includes('ativacao') || desc.includes('ativar')) {
      base.push(`A ativação do funcionário ${nome} (CPF: ${pendencia.cpf}) está pendente há ${dias} ${dias === 1 ? 'dia' : 'dias'}. Há previsão para conclusão?`);
    }

    // Sugestão padrão
    base.push(`Olá, equipe da corretora, sobre a pendência do funcionário ${nome} (CPF: ${pendencia.cpf}), estamos acompanhando este caso há ${dias} ${dias === 1 ? 'dia' : 'dias'} e gostaríamos de saber quando poderemos ter uma resolução.`);

    return Array.from(new Set(base));
  }, [pendencia.funcionario_nome, pendencia.cpf, pendencia.descricao, diasAtraso]);

  const handleUseSuggestion = (text: string) => {
    setMessage(text);
  };

  const handleSend = async () => {
    const mensagemPersonalizada = message.trim();
    if (!mensagemPersonalizada) return;

    if (!conversaId) {
      toast({
        title: 'Conversa não disponível',
        description: 'Ainda estamos vinculando a conversa desta pendência. Tente novamente em instantes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('✉️ Enviando mensagem para conversa:', conversaId);

      // Combinar dados contextuais + mensagem personalizada
      const mensagemCompleta = dadosContextuais + mensagemPersonalizada;

      // Usar o hook useEnviarMensagem
      await enviarMensagem.mutateAsync({
        conteudo: mensagemCompleta,
        tipo: 'texto',
        metadata: {
          origem: 'relatorio_pendencias',
          pendencia_id: pendencia.id,
          protocolo: pendencia.protocolo,
          funcionario_nome: pendencia.funcionario_nome,
          cpf: pendencia.cpf,
          cnpj_razao_social: pendencia.cnpj_razao_social,
          status: pendencia.status,
          dias_atraso: diasAtraso,
        },
      });

      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem sobre a pendência foi enviada para a corretora.',
      });
      setMessage('');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua mensagem. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChatWidget = () => {
    if (conversaId) {
      openChatWidget({ 
        conversaId, 
        empresaNome: pendencia.cnpj_razao_social 
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem - Protocolo {pendencia.protocolo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pendência Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funcionário</p>
                <p className="font-medium">{pendencia.funcionario_nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                <p className="font-medium">{pendencia.cpf}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                <p className="font-medium">{pendencia.cnpj_razao_social}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Conversa</p>
                {isLinking ? (
                  <Badge variant="secondary">Vinculando...</Badge>
                ) : conversaId ? (
                  <Badge variant="outline" className="border-green-300 text-green-700">Conversa ativa</Badge>
                ) : (
                  <Badge variant="destructive">Sem conversa</Badge>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                <Badge variant="secondary">
                  {pendencia.motivo}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo em aberto</p>
                <Badge variant={diasAtraso > 7 ? 'destructive' : diasAtraso > 3 ? 'secondary' : 'default'}>
                  {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {conversaId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleOpenChatWidget}
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir conversa no widget
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Preview dos dados que serão incluídos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <h4 className="font-medium">Dados que serão incluídos automaticamente na mensagem</h4>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border text-sm font-mono whitespace-pre-line text-gray-700 max-h-32 overflow-y-auto">
              {dadosContextuais}
            </div>
          </div>

          <Separator />

          {/* Sugestões de mensagem */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Sugestões de mensagem para a corretora</h4>
            </div>

            <div className="space-y-2">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full text-left text-sm px-3 py-3 rounded-md border hover:bg-muted transition-colors"
                  onClick={() => handleUseSuggestion(sug)}
                  title="Usar sugestão"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Composer */}
          <div className="space-y-3">
            <h4 className="font-medium">Sua mensagem personalizada</h4>
            <Textarea
              placeholder="Digite sua mensagem personalizada (será enviada após os dados da pendência)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {message.length}/1000 caracteres • Os dados da pendência serão incluídos automaticamente
              </p>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || enviarMensagem.isPending || !conversaId}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {enviarMensagem.isPending ? 'Enviando...' : 'Enviar mensagem'}
              </Button>
            </div>
          </div>

          {/* Histórico note */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> A mensagem será enviada da empresa para a corretora com todos os dados da pendência incluídos automaticamente. 
            A corretora receberá as informações completas e poderá responder diretamente no chat.
            {conversaId && (
              <> Você pode acompanhar e continuar a conversa no widget de chat.</>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
