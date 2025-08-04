
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building2, User, Loader2 } from 'lucide-react';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useConversas } from '@/hooks/useConversas';
import { toast } from 'sonner';

interface NovaConversaModalProps {
  open: boolean;
  onClose: () => void;
  onConversaCriada?: (conversaId: string, nomeDestinatario: string) => void;
}

export const NovaConversaModal: React.FC<NovaConversaModalProps> = ({
  open,
  onClose,
  onConversaCriada
}) => {
  const [busca, setBusca] = useState('');
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string | null>(null);

  const { empresas, isLoading: loadingEmpresas } = useEmpresas();
  const { criarConversaCorretora } = useConversas();

  // Filtrar empresas baseado na busca
  const empresasFiltradas = useMemo(() => {
    if (!busca.trim()) return empresas;
    
    const termoBusca = busca.toLowerCase();
    return empresas.filter(empresa => 
      empresa.nome.toLowerCase().includes(termoBusca) ||
      empresa.responsavel.toLowerCase().includes(termoBusca)
    );
  }, [empresas, busca]);

  const handleIniciarConversa = async () => {
    if (!empresaSelecionada) return;

    try {
      const empresaInfo = empresas.find(e => e.id === empresaSelecionada);
      if (!empresaInfo) return;

      const conversa = await criarConversaCorretora.mutateAsync({
        empresaId: empresaSelecionada
      });

      // Fechar modal e resetar estado
      onClose();
      setBusca('');
      setEmpresaSelecionada(null);

      // Callback para selecionar a conversa criada
      if (onConversaCriada) {
        onConversaCriada(conversa.id, empresaInfo.nome);
      }

    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setBusca('');
    setEmpresaSelecionada(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de empresas */}
          <div className="max-h-80 overflow-y-auto border rounded-md">
            {loadingEmpresas ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando empresas...</span>
              </div>
            ) : empresasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {busca ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa disponível'}
              </div>
            ) : (
              <div className="p-2">
                {empresasFiltradas.map((empresa) => (
                  <div
                    key={empresa.id}
                    onClick={() => setEmpresaSelecionada(empresa.id)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      empresaSelecionada === empresa.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{empresa.nome}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          {empresa.responsavel}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleIniciarConversa}
              disabled={!empresaSelecionada || criarConversaCorretora.isPending}
            >
              {criarConversaCorretora.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Iniciar Conversa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
