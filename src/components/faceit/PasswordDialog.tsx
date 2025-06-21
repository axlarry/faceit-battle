
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
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500/30 text-white shadow-2xl shadow-orange-500/20 w-[90vw] max-w-md mx-auto rounded-2xl">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          <p className="text-gray-300 text-center text-sm md:text-base leading-relaxed">
            {description}
          </p>
          
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Introdu parola..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
              className="bg-gray-800/50 border-2 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 h-12 rounded-xl transition-all duration-200"
            />
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-gray-800/50 border-2 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500 h-12 rounded-xl font-medium transition-all duration-200"
              >
                Anulează
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:scale-105"
              >
                Confirmă
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
