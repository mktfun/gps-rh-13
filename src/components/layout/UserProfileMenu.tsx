import React from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, Crown, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export const UserProfileMenu = () => {
  const {
    user,
    role,
    signOut,
    branding
  } = useAuth();
  const { profile } = useProfile();

  const getRoleLabel = () => {
    switch (role) {
      case 'corretora':
        return 'Corretora';
      case 'empresa':
        return 'Empresa';
      case 'admin':
        return 'Administrador';
      default:
        return 'Usuário';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'corretora':
        return Building2;
      case 'empresa':
        return Building2;
      case 'admin':
        return Crown;
      default:
        return User;
    }
  };

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'corretora':
        return 'default';
      case 'empresa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getInitials = () => {
    if (profile?.nome) {
      const names = profile.nome.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      const emailParts = user.email.split('@')[0];
      return emailParts.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Gerar rotas contextuais baseadas no role - CORRIGIDO para usar rotas compartilhadas
  const getPerfilRoute = () => {
    return '/perfil'; // Rota compartilhada para todos os roles
  };
  const getConfiguracoesRoute = () => {
    return '/configuracoes'; // Rota compartilhada para todos os roles
  };
  
  const RoleIcon = getRoleIcon();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full hover:bg-accent">
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={branding?.logo_url || ""} 
              alt={profile?.nome || user?.email || "Avatar"} 
            />
            <AvatarFallback className="text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* Indicador de status quando há logo */}
          {branding?.logo_url && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={branding?.logo_url || ""} 
                  alt={profile?.nome || user?.email || "Avatar"} 
                />
                <AvatarFallback className="text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.nome || user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <Badge variant={getRoleBadgeVariant()} className="w-fit text-xs">
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {getRoleLabel()}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to={getPerfilRoute()} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to={getConfiguracoesRoute()} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
