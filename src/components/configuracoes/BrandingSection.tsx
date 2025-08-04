
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranding } from '@/hooks/useBranding';
import { Upload, Palette } from 'lucide-react';

export const BrandingSection = () => {
  const { branding, updateBranding, uploadLogo, isUpdating, isLoading, error } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [corPrimaria, setCorPrimaria] = useState('#3b82f6');

  // Update local state when branding data loads
  React.useEffect(() => {
    if (branding?.cor_primaria) {
      setCorPrimaria(branding.cor_primaria);
    }
  }, [branding?.cor_primaria]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('O arquivo deve ter no máximo 2MB');
        return;
      }
      uploadLogo.mutate(file);
    }
  };

  const handleCorChange = () => {
    updateBranding.mutate({ cor_primaria: corPrimaria });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Identidade Visual</span>
          </CardTitle>
          <CardDescription>
            Personalize a aparência da plataforma com sua marca
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
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center space-x-4">
              <Skeleton className="w-12 h-12 rounded" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-16" />
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
            <Palette className="h-5 w-5" />
            <span>Identidade Visual</span>
          </CardTitle>
          <CardDescription>
            Personalize a aparência da plataforma com sua marca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar configurações de marca. Tente novamente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Identidade Visual</span>
        </CardTitle>
        <CardDescription>
          Personalize a aparência da plataforma com sua marca
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload do Logo */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Logo da Empresa</Label>
          <div className="flex items-center space-x-4">
            {branding?.logo_url && (
              <img 
                src={branding.logo_url} 
                alt="Logo atual" 
                className="w-16 h-16 object-contain border rounded"
              />
            )}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{branding?.logo_url ? 'Alterar Logo' : 'Fazer Upload do Logo'}</span>
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou SVG. Máximo 2MB.
              </p>
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

        {/* Seletor de Cor */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Cor Primária</Label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="w-12 h-12 border border-border rounded cursor-pointer"
            />
            <div className="flex-1">
              <Input
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                placeholder="#3b82f6"
                className="font-mono"
              />
            </div>
            <Button
              onClick={handleCorChange}
              disabled={isUpdating || corPrimaria === (branding?.cor_primaria || '#3b82f6')}
              size="sm"
            >
              Aplicar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta cor será aplicada aos botões e elementos principais da interface.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
