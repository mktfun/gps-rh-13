import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PendenciaItem } from '@/hooks/usePendenciasDaCorretora';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pendencia?: PendenciaItem | null;
}
interface Mensagem {
  id: number;
  conteudo: string;
  created_at: string;
  remetente_id: string;
}
const sugestoes = ['Olá! Poderia enviar a documentação pendente para concluirmos o atendimento?', 'Estamos acompanhando esta pendência. Há alguma atualização?', 'Lembrete: o prazo desta pendência está próximo. Posso ajudar com algo?'];
const ModalConversaPendencia: React.FC<Props> = ({
  open,
  onOpenChange,
  pendencia
}) => {
  const {
    user
  } = useAuth();
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const empresaId = useMemo(() => pendencia?.empresa_id || null, [pendencia]);
  useEffect(() => {
    if (!open || !pendencia || !empresaId) return;
    const iniciarOuObter = async () => {
      const {
        data,
        error
      } = await (supabase as any).rpc('iniciar_ou_obter_conversa_por_protocolo', {
        p_empresa_id: empresaId,
        p_protocolo: pendencia.protocolo
      });
      if (error) {
        console.error('Erro ao iniciar/obter conversa:', error);
        toast.error('Não foi possível abrir a conversa.');
        return;
      }
      const id = data as string || null;
      setConversaId(id);
    };
    iniciarOuObter();
  }, [open, pendencia, empresaId]);
  useEffect(() => {
    const carregarMensagens = async () => {
      if (!conversaId) return;
      const {
        data,
        error
      } = await supabase.from('mensagens').select('*').eq('conversa_id', conversaId).order('created_at', {
        ascending: true
      });
      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return;
      }
      setMensagens((data || []) as any);
    };
    carregarMensagens();
  }, [conversaId]);
  const enviar = async (texto: string) => {
    if (!user?.id || !conversaId || !texto.trim()) return;
    const {
      data,
      error
    } = await supabase.from('mensagens').insert({
      conteudo: texto.trim(),
      conversa_id: conversaId,
      remetente_id: user.id,
      tipo: 'texto'
    }).select('*').single();
    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Falha ao enviar mensagem');
      return;
    }
    setMensagens(prev => [...prev, data as any]);
    setNovaMensagem('');
    toast.success('Mensagem enviada');
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Conversa sobre a pendência</DialogTitle>
        </DialogHeader>

        {!pendencia ? <div className="text-center text-muted-foreground">Selecione uma pendência</div> : <div className="space-y-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Detalhes</div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Funcionário:</span> {pendencia.funcionario_nome || '-'}</div>
                <div><span className="text-muted-foreground">Protocolo:</span> {pendencia.protocolo}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Descrição:</span> {pendencia.descricao}</div>
              </div>
              <div className="mt-3">
                <Button variant="outline" onClick={() => {
              console.log('Abrir conversa no chat/widget', conversaId);
              toast.info('Abrindo conversa no chat...');
            }} disabled={!conversaId}>
                  Abrir conversa
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Sugestões de mensagem</div>
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((s, i) => <Button key={i} variant="secondary" onClick={() => setNovaMensagem(s)}>
                    {s}
                  </Button>)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-2">Escreva sua mensagem</div>
              <Textarea placeholder="Digite aqui..." value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} />
              <div className="mt-2 flex justify-end">
                <Button onClick={() => enviar(novaMensagem)} disabled={!novaMensagem.trim()}>Enviar</Button>
              </div>
            </Card>

            
          </div>}
      </DialogContent>
    </Dialog>;
};
export default ModalConversaPendencia;