import React, { useState } from 'react';
import { Shield, KeyRound, X, AlertCircle } from 'lucide-react';
import { SUPER_ADMIN_PIN } from '../services/storage';

interface SuperAdminPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuperAdminPinDialog: React.FC<SuperAdminPinDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.trim() === SUPER_ADMIN_PIN) {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('Code PIN Super Admin incorrect. Accès refusé.');
      setPin('');
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      // Auto submit if exact PIN match
      if (nextPin === SUPER_ADMIN_PIN) {
        setTimeout(() => {
          setPin('');
          onSuccess();
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-purple-500/40 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-950 to-indigo-950 p-4 border-b border-purple-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-purple-100">Espace Super Admin</h3>
              <p className="text-[11px] text-purple-300">Authentification de sécurité requise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center mb-3 text-purple-300">
            <KeyRound className="w-6 h-6" />
          </div>

          <p className="text-xs text-gray-300 text-center mb-5">
            Veuillez saisir le code PIN secret de la plateforme pour administrer les établissements et abonnements.
          </p>

          {/* Affichage des cercles PIN */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 border ${
                    isFilled
                      ? 'bg-purple-400 border-purple-300 scale-110 shadow-sm shadow-purple-500'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/80 border border-red-700/60 text-red-200 text-xs mb-4 w-full">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Clavier numérique */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px] mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-12 rounded-xl bg-gray-800/90 hover:bg-purple-900/60 active:scale-95 border border-gray-700 hover:border-purple-500 text-lg font-bold text-white transition-all flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl bg-gray-800/50 hover:bg-gray-700 text-xs font-semibold text-gray-400 hover:text-white transition-all flex items-center justify-center"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-gray-800/90 hover:bg-purple-900/60 active:scale-95 border border-gray-700 hover:border-purple-500 text-lg font-bold text-white transition-all flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="h-12 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs font-bold text-white transition-all flex items-center justify-center shadow-md shadow-purple-900/50"
            >
              Valider
            </button>
          </div>

          <p className="text-[11px] text-gray-500 mt-2 text-center">
            Accès strictement réservé au gestionnaire de la plateforme.
          </p>
        </div>
      </div>
    </div>
  );
};
