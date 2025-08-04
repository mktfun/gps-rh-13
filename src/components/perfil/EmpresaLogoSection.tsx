
import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmpresaBranding } from '@/hooks/useEmpresaBranding';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Building2, Trash2, CheckCircle } from 'lucide-react';

export const EmpresaLogoSection = () => {
  const { role } = useAuth();
  const { branding, uploadLogo, deleteLogo, isUpdating, isLoading, error } = useEmpresaBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Só mostra para empresas
  if (role !== 'empresa') {
    return null;
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('O arquivo deve ter no máximo 2MB');
        return;
      }
      
      // Validar tipo de arquivo
      const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Formato de arquivo não suportado. Use PNG, JPG, SVG ou WebP.');
        return;
      }
      
      uploadLogo.mutate(file);
    }
  };

  const handleDeleteLogo = () => {
    if (window.confirm('Tem certeza que deseja remover a logo da empresa?')) {
      deleteLogo.mutate();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Logo da Empresa</span>
          </CardTitle>
          <CardDescription>
            Personalize o avatar no header com a logo da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="w-16 h-16 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Logo da Empresa</span>
          </CardTitle>
          <CardDescription>
            Personalize o avatar no header com a logo da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar logo da empresa. Tente novamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Logo da Empresa</span>
        </CardTitle>
        <CardDescription>
          Personalize o avatar no header com a logo da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Logo da Empresa</Label>
          <div className="flex items-center space-x-4">
            {branding?.logo_url && (
              <div className="relative">
                <img 
                  src={branding.logo_url} 
                  alt="Logo atual" 
                  className="w-16 h-16 object-contain border rounded"
                  onLoad={() => {
                    console.log('Logo carregada com sucesso');
                  }}
                  onError={(e) => {
                    console.error('Erro ao carregar logo:', e);
                  }}
                />
                {!isUpdating && (
                  <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-600 bg-white rounded-full" />
                )}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{branding?.logo_url ? 'Alterar Logo' : 'Fazer Upload do Logo'}</span>
                </Button>
                {branding?.logo_url && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteLogo}
                    disabled={isUpdating}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remover</span>
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG ou WebP. Máximo 2MB.
              </p>
              {isUpdating && (
                <p className="text-xs text-blue-600 flex items-center space-x-1">
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </p>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};
