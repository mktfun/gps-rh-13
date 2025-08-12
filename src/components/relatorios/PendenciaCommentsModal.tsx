
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Calendar, Link as LinkIcon, Sparkles, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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

  // Calcular dias em atraso
  const diasAtraso = useMemo(() => {
    if (!pendencia.data_solicitacao) return 0;
    return differenceInDays(new Date(), new Date(pendencia.data_solicitacao));
  }, [pendencia.data_solicitacao]);

  // Gerar dados contextuais da pendência
  const dadosContextuais = useMemo(() => {
    const statusLabels = {
      'pendente': 'Ativação Pendente',
      'exclusao_solicitada': 'Exclusão Solicitada',
      'inativo': 'Funcionário Inativo'
    };

    const dados = [
      `📋 DADOS DA PENDÊNCIA - PROTOCOLO ${pendencia.protocolo}`,
      ``,
      `👤 Funcionário: ${pendencia.funcionario_nome}`,
      `📄 CPF: ${pendencia.cpf}`,
      `💼 Cargo: ${pendencia.cargo}`,
      `🏢 Empresa: ${pendencia.cnpj_razao_social}`,
      `📊 Status: ${statusLabels[pendencia.status as keyof typeof statusLabels] || pendencia.status}`,
      `📅 Data da Solicitação: ${format(new Date(pendencia.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}`,
      `⏰ Tempo em Aberto: ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`,
      `🔍 Motivo: ${pendencia.motivo}`,
      ``,
      `---`,
      ``
    ];

    return dados.join('\n');
  }, [pendencia, diasAtraso]);

  // Sugestões "inteligentes" baseadas no contexto da pendência
  const suggestions = useMemo(() => {
    const nome = pendencia.funcionario_nome?.split(' ')?.[0] || pendencia.funcionario_nome;
    const desc = (pendencia.descricao || '').toLowerCase();
    const status = pendencia.status;
    const dias = diasAtraso;

    const base: string[] = [];

    // Sugestões baseadas no status
    if (status === 'pendente') {
      if (dias > 7) {
        base.push(`Olá! A ativação do funcionário ${nome} está pendente há ${dias} dias. Precisamos acelerar este processo. Há algum impedimento?`);
      } else if (dias > 3) {
        base.push(`Olá! Notamos que a ativação do ${nome} está em aberto há ${dias} dias. Podemos dar andamento?`);
      } else {
        base.push(`Olá! Sobre a ativação do funcionário ${nome}, há alguma documentação adicional necessária?`);
      }
    }

    if (status === 'exclusao_solicitada') {
      base.push(`Olá! Recebemos a solicitação de exclusão do funcionário ${nome}. Podemos confirmar os próximos passos para finalizar com segurança?`);
      if (dias > 5) {
        base.push(`A solicitação de exclusão do ${nome} está em análise há ${dias} dias. Há alguma pendência para concluirmos?`);
      }
    }

    // Sugestões baseadas na descrição
    if (desc.includes('document') || desc.includes('doc') || desc.includes('anexo')) {
      base.push(`Sobre o ${nome}, por favor anexe os documentos pendentes aqui na plataforma para darmos continuidade ao processo.`);
    }

    if (desc.includes('cpf') || desc.includes('dados') || desc.includes('informação')) {
      base.push(`Identificamos uma divergência nos dados do ${nome}. Pode confirmar CPF e informações cadastrais para seguirmos?`);
    }

    // Sugestão padrão
    base.push(`Olá! Sobre a pendência do funcionário ${nome}, estou acompanhando o caso e gostaria de saber se há algo que possamos resolver rapidamente.`);

    return Array.from(new Set(base));
  }, [pendencia.funcionario_nome, pendencia.descricao, pendencia.status, diasAtraso]);

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
      console.log('✉️ Enviando mensagem para conversa:', conversaId);

      // Combinar dados contextuais + mensagem personalizada
      const mensagemCompleta = dadosContextuais + message.trim();

      // Enviar mensagem diretamente para a tabela "mensagens"
      const { data: userInfo } = await supabase.auth.getUser();
      const remetenteId = userInfo.user?.id;

      const { error: insertError } = await supabase.from('mensagens').insert([
        {
          conversa_id: conversaId,
          remetente_id: remetenteId,
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
        description: 'Sua mensagem com os dados da pendência foi enviada para a empresa.',
      });
      setMessage('');
    } finally {
      setIsSubmitting(false);
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
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={pendencia.status === 'exclusao_solicitada' ? 'destructive' : 'secondary'}>
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
                <Link to={`/chat?conversa=${conversaId}`} className="inline-flex">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Abrir chat completo
                  </Button>
                </Link>
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

          {/* Sugestões inteligentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Sugestões de mensagem personalizada</h4>
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
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {message.length}/1000 caracteres • Os dados da pendência serão incluídos automaticamente
              </p>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isSubmitting || !conversaId}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar mensagem completa'}
              </Button>
            </div>
          </div>

          {/* Histórico note */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> A mensagem será enviada com todos os dados da pendência incluídos automaticamente. 
            A empresa receberá as informações completas e poderá responder diretamente no chat.
            {conversaId && (
              <> Você pode acompanhar e continuar a conversa na <Link to={`/chat?conversa=${conversaId}`} className="text-primary hover:underline">Central de Mensagens</Link>.</>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
