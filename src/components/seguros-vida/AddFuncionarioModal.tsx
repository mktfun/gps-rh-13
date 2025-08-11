
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cnpjId: string;
  planoId?: string;
  onFuncionarioCreated?: () => void;
}

export const AddFuncionarioModal: React.FC<AddFuncionarioModalProps> = ({
  open,
  onOpenChange,
  cnpjId,
  planoId,
  onFuncionarioCreated
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Funcionário</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground mb-4">
            Funcionalidade em desenvolvimento.
          </p>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
