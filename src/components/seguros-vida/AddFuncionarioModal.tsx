
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddFuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  planoId?: string;
  onFuncionarioCreated?: () => void;
}

export const AddFuncionarioModal: React.FC<AddFuncionarioModalProps> = ({
  isOpen,
  onClose,
  planoId,
  onFuncionarioCreated
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Funcionário</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-muted-foreground mb-4">
            Funcionalidade em desenvolvimento.
          </p>
          <Button onClick={onClose} variant="outline" className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
