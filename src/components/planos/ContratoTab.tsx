
import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ContratoTabProps {
  planoId: string;
  isCorretora?: boolean;
}

const sanitizeFileName = (name: string) =>
  name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");

export const ContratoTab: React.FC<ContratoTabProps> = ({ planoId, isCorretora = false }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contrato, isLoading } = useQuery({
    queryKey: ["plano-contrato", planoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_contratos")
        .select("*")
        .eq("plano_id", planoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!planoId,
    staleTime: 1000 * 60 * 2,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error("Selecione um arquivo PDF");
      if (file.type !== "application/pdf") {
        throw new Error("Apenas arquivos PDF são permitidos");
      }
      if (!user?.id) throw new Error("Usuário não autenticado");

      const sanitized = sanitizeFileName(file.name);
      const path = `planos/${planoId}/contrato/${Date.now()}_${sanitized}`;
      const { error: uploadError } = await supabase.storage
        .from("documentos_planos")
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { error: upsertError } = await supabase
        .from("planos_contratos")
        .upsert(
          {
            plano_id: planoId,
            file_name: file.name,
            storage_object_path: path,
            uploaded_by: user.id,
          },
          { onConflict: "plano_id" }
        );
      if (upsertError) throw upsertError;

      return true;
    },
    onSuccess: () => {
      toast.success("Contrato enviado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["plano-contrato", planoId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao enviar contrato");
    },
  });

  const handleSelectFile = () => fileInputRef.current?.click();

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async () => {
    if (!contrato?.storage_object_path) return;
    const { data, error } = await supabase.storage
      .from("documentos_planos")
      .createSignedUrl(contrato.storage_object_path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível gerar o link de download");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contrato do Plano</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : contrato ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{contrato.file_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Contrato
              </Button>
              {isCorretora && (
                <Button onClick={handleSelectFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  Substituir Contrato
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Nenhum contrato enviado ainda.
            </div>
            {isCorretora && (
              <Button onClick={handleSelectFile}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Contrato (PDF)
              </Button>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );
};

export default ContratoTab;
