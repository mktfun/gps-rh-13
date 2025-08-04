
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConversas } from '@/hooks/useConversas';
import { ConversasList } from './ConversasList';
import { ChatModule } from './ChatModule';

export const ChatWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [nomeDestinatario, setNomeDestinatario] = useState<string>('');

  // Only load conversations when expanded to optimize performance
  const { conversas } = useConversas();

  // Calculate unread messages count (simplified - you can enhance this later)
  const unreadCount = 0; // This would be calculated from mensagens in a real implementation

  const handleSelecionarConversa = (conversaId: string, nome: string) => {
    setConversaSelecionada(conversaId);
    setNomeDestinatario(nome);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setConversaSelecionada(null);
    setNomeDestinatario('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? 384 : 320, // w-96 : w-80
          height: isExpanded ? 500 : 64, // h-[500px] : h-16
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
      >
        <Card className="h-full shadow-xl border-border bg-card">
          {/* Header */}
          <CardHeader 
            className={`flex flex-row items-center justify-between p-4 cursor-pointer border-b ${!isExpanded ? 'border-b-0' : ''}`}
            onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-sm">Conversas</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={isExpanded ? handleClose : () => setIsExpanded(true)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>

          {/* Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="flex-1 flex flex-col h-[calc(100%-80px)]"
              >
                <CardContent className="flex-1 p-0 flex">
                  {conversaSelecionada ? (
                    // Chat View
                    <div className="flex-1 flex flex-col">
                      <div className="p-2 border-b flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">
                          {nomeDestinatario}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConversaSelecionada(null);
                            setNomeDestinatario('');
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <ChatModule
                          conversaId={conversaSelecionada}
                          destinatarioNome={nomeDestinatario}
                        />
                      </div>
                    </div>
                  ) : (
                    // Conversations List
                    <div className="flex-1">
                      <ConversasList
                        onSelecionarConversa={handleSelecionarConversa}
                        conversaSelecionada={conversaSelecionada || undefined}
                        compact={true}
                      />
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};
