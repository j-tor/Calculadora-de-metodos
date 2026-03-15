import { Mic, X } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceCommandDialog({ isOpen, onClose }: VoiceCommandDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[#F8FAFC]">Comando de Voz</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Habla para seleccionar un método</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1E293B] text-[#64748B] hover:text-[#F8FAFC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Microphone */}
        <div className="flex flex-col items-center justify-center py-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] flex items-center justify-center shadow-lg shadow-[#3B82F6]/30"
          >
            <Mic className="w-12 h-12 text-white" />
          </motion.div>
          <p className="text-[#CBD5E1] mt-6 text-center">Escuchando...</p>
        </div>

        {/* Example Commands */}
        <div className="bg-[#1E293B]/40 rounded-lg p-4 border border-[#334155]/50 mt-6">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            Ejemplos de comandos:
          </p>
          <div className="space-y-2 text-sm text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>
              <span>"Ejecutar método de Newton"</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>
              <span>"Usar bisección"</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>
              <span>"Calcular Simpson 1/3"</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
