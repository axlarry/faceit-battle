
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const PasswordDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description 
}: PasswordDialogProps) => {
  const [password, setPassword] = useState('');

  const handleConfirm = () => {
    if (password === 'lacurte.ro') {
      onConfirm();
      setPassword('');
      onClose();
    } else {
      toast({
        title: "Parolă incorectă",
        description: "Parola introdusă nu este corectă.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-300 text-center">{description}</p>
          
          <Input
            type="password"
            placeholder="Introdu parola..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
            className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Anulează
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              Confirmă
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
