
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { Bell } from 'lucide-react';

export const NotificacoesSection = () => {
  const { profile, updateProfile, isUpdating } = useProfile();

  const handleEmailNotificationsChange = (checked: boolean) => {
    updateProfile.mutate({ notificacoes_email: checked });
  };

  const handleSystemNotificationsChange = (checked: boolean) => {
    updateProfile.mutate({ notificacoes_sistema: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notificações</span>
        </CardTitle>
        <CardDescription>
          Configure suas preferências de notificação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Notificações por E-mail</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações importantes no seu e-mail
              </p>
            </div>
            <Switch
              checked={profile?.notificacoes_email ?? true}
              onCheckedChange={handleEmailNotificationsChange}
              disabled={isUpdating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Notificações de Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre mudanças no sistema
              </p>
            </div>
            <Switch
              checked={profile?.notificacoes_sistema ?? true}
              onCheckedChange={handleSystemNotificationsChange}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
