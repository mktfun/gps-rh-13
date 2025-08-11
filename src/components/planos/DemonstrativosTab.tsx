
import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload, FileText, DollarSign } from "lucide-react";

interface DemonstrativosTabProps {
  planoId: string;
  isCorretora?: boolean;
  ano?: number;
}

type TipoArquivo = "demonstrativo" | "boleto";

const sanitizeFileName = (name: string) =>
  name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");

const meses = [
  { numero: 1, nome: "Jan" },
  { numero: 2, nome: "Fev" },
  { numero: 3, nome: "Mar" },
  { numero: 4, nome: "Abr" },
  { numero: 5, nome: "Mai" },
  { numero: 6, nome: "Jun" },
  { numero: 7, nome: "Jul" },
  { numero: 8, nome: "Ago" },
  { numero: 9, nome: "Set" },
  { numero: 10, nome: "Out" },
  { numero: 11, nome: "Nov" },
  { numero: 12, nome: "Dez" },
];

export const DemonstrativosTab: React.FC<DemonstrativosTabProps> = ({
  planoId,
  isCorretora = false,
  ano,
}) => {
  const year = useMemo(() => ano || new Date().getFullYear(), [ano]);
  const queryClient = useQueryClient();

  const { data: registros, isLoading } = useQuery({
    queryKey: ["plano-demonstrativos", planoId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_demonstrativos")
        .select("*")
        .eq("plano_id", planoId)
        .eq("ano", year)
        .order("mes", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!planoId && !!year,
    staleTime: 1000 * 60 * 2,
  });

  const upload = useMutation({
    mutationFn: async ({
      file,
      mes,
      tipo,
    }: {
      file: File;
      mes: number;
      tipo: TipoArquivo;
    }) => {
      if (!file) throw new Error("Selecione um arquivo PDF");
      if (file.type !== "application/pdf") {
        throw new Error("Apenas arquivos PDF são permitidos");
      }

      const sanitized = sanitizeFileName(file.name);
      const path = `planos/${planoId}/demonstrativos/${year}/${mes}/${tipo}/${Date.now()}_${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos_planos")
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const payload =
        tipo === "demonstrativo"
          ? {
              plano_id: planoId,
              mes,
              ano: year,
              path_demonstrativo: path,
            }
          : {
              plano_id: planoId,
              mes,
              ano: year,
              path_boleto: path,
            };

      const { error: upsertError } = await supabase
        .from("planos_demonstrativos")
        .upsert(payload as any, { onConflict: "plano_id,mes,ano" });
      if (upsertError) throw upsertError;

      return true;
    },
    onSuccess: () => {
      toast.success("Arquivo enviado com sucesso");
      queryClient.invalidateQueries({
        queryKey: ["plano-demonstrativos", planoId, year],
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao enviar arquivo");
    },
  });

  const handleDownload = async (path?: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("documentos_planos")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível gerar o link de download");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demonstrativos e Boletos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {meses.map((m) => {
              const registro = registros?.find((r: any) => r.mes === m.numero);
              const hasDem = !!registro?.path_demonstrativo;
              const hasBol = !!registro?.path_boleto;

              return (
                <div
                  key={m.numero}
                  className="border rounded-lg p-3 flex flex-col gap-2"
                >
                  <div className="font-medium text-center">{m.nome}/{year}</div>
                  <div className="flex items-center justify-center gap-2">
                    {isCorretora ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Anexar Demonstrativo"
                          onClick={async () => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "application/pdf";
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                upload.mutate({
                                  file,
                                  mes: m.numero,
                                  tipo: "demonstrativo",
                                });
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Anexar Boleto"
                          onClick={async () => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "application/pdf";
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                upload.mutate({
                                  file,
                                  mes: m.numero,
                                  tipo: "boleto",
                                });
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!hasDem}
                          title={hasDem ? "Baixar Demonstrativo" : "Sem Demonstrativo"}
                          onClick={() => handleDownload(registro?.path_demonstrativo)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!hasBol}
                          title={hasBol ? "Baixar Boleto" : "Sem Boleto"}
                          onClick={() => handleDownload(registro?.path_boleto)}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DemonstrativosTab;
