
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Calendar, Link as LinkIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface PendenciaCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendencia: {
    id: string;
    protocolo: string;
    funcionario_nome: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

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

  // Sugestões "inteligentes" simples baseadas no contexto da pendência
  const suggestions = useMemo(() => {
    const nome = pendencia.funcionario_nome?.split(' ')?.[0] || pendencia.funcionario_nome;
    const desc = (pendencia.descricao || '').toLowerCase();

    const base = [
      `Olá, ${nome}! Estamos acompanhando sua pendência (protocolo ${pendencia.protocolo}). Precisamos de uma ação sua para avançar.`,
      `Olá, ${nome}! Recebemos sua pendência (protocolo ${pendencia.protocolo}). Estou aqui para te ajudar a resolver rapidamente.`,
    ];

    if (desc.includes('document') || desc.includes('doc') || desc.includes('anexo')) {
      base.push(
        `Olá, ${nome}! Sobre sua pendência (protocolo ${pendencia.protocolo}), por favor anexe o documento pendente aqui na plataforma para concluirmos.`
      );
    }

    if (desc.includes('cpf') || desc.includes('dados') || desc.includes('informação')) {
      base.push(
        `Olá, ${nome}! Notamos uma divergência de dados (protocolo ${pendencia.protocolo}). Pode confirmar CPF e dados cadastrais para seguirmos?`
      );
    }

    if (desc.includes('exclus') || desc.includes('saida') || desc.includes('deslig')) {
      base.push(
        `Olá, ${nome}! Entendemos seu pedido (protocolo ${pendencia.protocolo}). Podemos confirmar os próximos passos para finalizar a exclusão com segurança?`
      );
    }

    // Remover duplicadas simples
    return Array.from(new Set(base));
  }, [pendencia.funcionario_nome, pendencia.descricao, pendencia.protocolo]);

  const handleUseSuggestion = (text: string) => {
    setMessage(text);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!conversaId) {
      toast({
        title: 'Conversa não disponível',
        description: 'Ainda estamos vinculando a conversa desta pendência. Tente novamente em instantes.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('✉️ Enviando mensagem para conversa:', conversaId, 'mensagem:', message);

      // Enviar mensagem diretamente para a tabela "mensagens"
      const { data: userInfo } = await supabase.auth.getUser();
      const remetenteId = userInfo.user?.id;

      const { error: insertError } = await supabase.from('mensagens').insert([
        {
          conversa_id: conversaId,
          remetente_id: remetenteId,
          conteudo: message.trim(),
          tipo: 'texto',
          metadata: {
            origem: 'relatorio_pendencias',
            pendencia_id: pendencia.id,
            protocolo: pendencia.protocolo,
          },
        } as any,
      ]);

      if (insertError) {
        console.error('❌ Erro ao enviar mensagem:', insertError);
        toast({
          title: 'Erro ao enviar',
          description: 'Não foi possível enviar sua mensagem. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada para a conversa vinculada a esta pendência.',
      });
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens da Pendência - Protocolo {pendencia.protocolo}
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Conversa</p>
                {isLinking ? (
                  <Badge variant="secondary">Vinculando...</Badge>
                ) : conversaId ? (
                  <Badge variant="outline" className="border-green-300 text-green-700">Conversa vinculada</Badge>
                ) : (
                  <Badge variant="destructive">Sem conversa</Badge>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-sm">{pendencia.descricao}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {conversaId && (
                <Link to={`/chat?conversa=${conversaId}`} className="inline-flex">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Abrir conversa
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <Separator />

          {/* Sugestões inteligentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Sugestões de mensagem</h4>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="text-left text-sm px-3 py-2 rounded-md border hover:bg-muted transition-colors"
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
            <h4 className="font-medium">Escreva sua mensagem</h4>
            <Textarea
              placeholder="Digite sua mensagem personalizada para esta pendência..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {message.length}/1000 caracteres
              </p>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isSubmitting || !conversaId}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
              </Button>
            </div>
          </div>

          {/* Histórico ilustrativo (mantemos apenas visual, sem mock fixo) */}
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">Histórico</h4>
            <div className="text-xs text-muted-foreground">
              As mensagens enviadas aqui ficam disponíveis na Central de Mensagens.
              {conversaId ? (
                <> Você pode acompanhar e responder na aba de Chat.</>
              ) : (
                <> Vincularemos a conversa automaticamente.</>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
