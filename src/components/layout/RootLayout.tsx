
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { DashboardLoadingState } from "../ui/loading-state";
import { ChatWidget } from "@/components/chat/ChatWidget";

const RootLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* A ESTRUTURA PRINCIPAL DA PÁGINA COM TEMA APLICADO */}
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Container do Sidebar: Tem largura fixa (w-64), borda, e só aparece em telas médias ou maiores (md:block) */}
        <div className="hidden border-r bg-card md:block w-64">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <Sidebar />
          </div>
        </div>

        {/* Container do Conteúdo Principal: Ocupa o espaço restante e é o ÚNICO com rolagem. */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-background">
          <Header />

          <main className="flex-1 p-6 lg:p-8 bg-background">
            <Outlet />
          </main>
        </div>
      </div>

      {/* O CHAT WIDGET FICA AQUI FORA, SOLTO E FLUTUANDO SOBRE TUDO */}
      <ChatWidget />
    </>
  );
};

export default RootLayout;
