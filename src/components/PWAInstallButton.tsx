import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Masquer le bouton si l'application est déjà lancée en mode autonome installé
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Pour les navigateurs où beforeinstallprompt n'a pas encore fait feu ou desktop sans invite directe
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Installer EduNova sur votre écran d'accueil (PWA Hors-Ligne)"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all transform hover:scale-105 active:scale-95"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span className="hidden sm:inline">Installer l'Application</span>
        <span className="sm:hidden">Installer</span>
      </button>

      {/* Guide modal pour iOS Safari et autres navigateurs */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-gray-900 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 leading-tight">
                  Installer EduNova PWA
                </h3>
                <p className="text-xs text-gray-500">
                  Accès hors-ligne direct & plein écran
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Fonctionne 100% Hors-Ligne</span>
              </div>
              <p className="text-[11px] text-emerald-700 pl-5.5">
                Même sans réseau Internet à l'école, encaissez les scolarités et imprimez les reçus thermiques.
              </p>
            </div>

            <div className="space-y-3 pt-1 text-xs text-gray-700">
              <p className="font-semibold text-gray-800">
                {isIOS ? "Sur iPhone / iPad (Safari) :" : "Pour installer manuellement :"}
              </p>

              <ol className="space-y-2 list-decimal list-inside text-gray-600">
                <li className="leading-relaxed">
                  Appuyez sur le bouton de partage{' '}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 border rounded font-semibold text-gray-800">
                    <Share className="w-3 h-3 text-blue-600" /> Partager
                  </span>{' '}
                  en bas ou haut du navigateur.
                </li>
                <li className="leading-relaxed">
                  Faites défiler vers le bas et sélectionnez{' '}
                  <span className="font-bold text-gray-900">« Sur l'écran d'accueil »</span>.
                </li>
                <li className="leading-relaxed">
                  Appuyez sur <span className="font-bold text-emerald-700">« Ajouter »</span> en haut à droite.
                </li>
              </ol>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
