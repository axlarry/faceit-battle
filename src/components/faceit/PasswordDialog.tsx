
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
      <DialogContent className="bg-[#1a1d21] border-[#2a2f36] text-white shadow-2xl max-w-sm md:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold text-center text-white">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 md:space-y-6">
          <p className="text-[#b3b3b3] text-center text-sm md:text-base">{description}</p>
          
          <Input
            type="password"
            placeholder="Introdu parola..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
            className="bg-[#2a2f36] border-[#3a4048] text-white placeholder:text-[#9f9f9f] focus:border-[#ff6500] h-12"
          />
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              className="bg-transparent border-[#3a4048] text-[#b3b3b3] hover:bg-[#2a2f36] hover:text-white h-10 md:h-12 px-4 md:px-6"
            >
              Anulează
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-[#ff6500] hover:bg-[#e55a00] text-white h-10 md:h-12 px-4 md:px-6 font-bold"
            >
              Confirmă
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
