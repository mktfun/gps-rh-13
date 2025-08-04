
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Users, Calendar, Phone, Mail } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaHoverCardProps {
  empresa: Empresa;
  children: React.ReactNode;
  funcionariosCount?: number;
}

export const EmpresaHoverCard = ({ empresa, children, funcionariosCount = 0 }: EmpresaHoverCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="right" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-semibold text-base">{empresa.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  ID: {empresa.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <Badge variant={empresa.primeiro_acesso ? "secondary" : "default"}>
              {empresa.primeiro_acesso ? "Aguardando" : "Ativa"}
            </Badge>
          </div>

          <Separator />

          {/* Informações de Contato */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{empresa.responsavel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{empresa.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{empresa.telefone}</span>
            </div>
          </div>

          <Separator />

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Funcionários</p>
              <p className="font-semibold">{funcionariosCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cadastro</p>
              <p className="font-semibold">{formatDate(empresa.created_at)}</p>
            </div>
          </div>

          {/* Status Details */}
          {empresa.primeiro_acesso && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                Esta empresa ainda não realizou o primeiro acesso ao sistema.
              </p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
