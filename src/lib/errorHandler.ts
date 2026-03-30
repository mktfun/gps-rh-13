import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ApiError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Handle API Errors consistently across the application.
 * Logs the error to the internal logger and displays a standardized user-friendly toast.
 * 
 * @param error The Error object caught from the operation
 * @param context Action context (e.g. 'Ao carregar dashboard', 'Ao excluir empresa')
 */
export const handleApiError = (error: unknown, context: string): void => {
  const err = error as ApiError;
  
  // Log real details internally
  logger.error(`❌ [Error] ${context}:`, err);

  // User friendly message
  let userMessage = `Ocorreu um erro: ${context}`;
  
  if (err.code === '23505') {
    userMessage = 'Erro de validação: Dados incompletos.';
  } else if (err.code === '23503') {
    userMessage = 'Este registro viola restrições do sistema.';
  } else if (err.code === 'PGRST116') {
    userMessage = 'Múltiplos registros encontrados quando apenas um era esperado.';
  } else if (err.message) {
    // If it's a known error message without obscure SQL details
    if (!err.message.includes('relation') && !err.message.includes('syntax')) {
      userMessage = `${context}: ${err.message}`;
    }
  }

  // Show Toast via Sonner
  toast.error(userMessage, {
    description: err.hint || 'Por favor, tente novamente ou contate o suporte se o erro persistir.',
  });
};
