
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (isCoolingDown || isLoading) return;

    const trimmed = password.trim();
    if (trimmed.length < 8) {
      toast({
        title: "Cod de acces prea scurt",
        description: "Codul trebuie să aibă cel puțin 8 caractere.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-access', {
        body: { code: trimmed }
      });

      if (error) throw error;

      if (data?.ok) {
        onConfirm();
        setPassword('');
        setAttempts(0);
        onClose();
      } else {
        setAttempts((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            setIsCoolingDown(true);
            setCooldownRemaining(30);
          }
          return next;
        });
        toast({
          title: "Cod de acces incorect",
          description: "Codul introdus nu este corect.",
          variant: "destructive",
        });
      }
    } catch (_e) {
      toast({
        title: "Eroare de validare cod",
        description: "Nu s-a putut valida codul. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = setInterval(() => {
      setCooldownRemaining((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setIsCoolingDown(false);
          setAttempts(0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCoolingDown]);

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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Introdu codul de acces..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { void handleConfirm(); } }}
                disabled={isCoolingDown || isLoading}
                className="bg-gray-800/50 border-2 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 h-12 rounded-xl pr-12 transition-all duration-200"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ascunde codul" : "Arată codul"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 bg-gray-800/50 border-2 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500 h-12 rounded-xl font-medium transition-all duration-200"
              >
                Anulează
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isCoolingDown || isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              >
                {isCoolingDown ? `Așteaptă ${cooldownRemaining}s` : (isLoading ? "Se verifică..." : "Confirmă")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
