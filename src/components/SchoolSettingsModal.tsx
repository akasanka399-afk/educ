import React, { useState } from 'react';
import { SchoolConfig } from '../types';
import { storage } from '../services/storage';
import { Settings, X, Save, CheckCircle2, Building, Phone, Mail, MapPin } from 'lucide-react';

interface SchoolSettingsModalProps {
  onClose: () => void;
  onConfigSaved: (config: SchoolConfig) => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<SchoolConfig>(storage.getSchoolConfig());
  const [saved, setSaved] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSchoolConfig(config);
    storage.logAudit('SCHOOL_CONFIG_UPDATED', `Mise à jour des coordonnées de l'école ${config.name}`);
    onConfigSaved(config);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-base">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Paramètres de l'Établissement & Modules SaaS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Paramètres enregistrés avec succès !</span>
            </div>
          )}

          {/* Activation des Modules (Maternelle & Primaire) */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <span className="font-bold text-emerald-950 uppercase tracking-wider block">
              Activation des Modules Pédagogiques (Logiciel 2-en-1)
            </span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.active_modules.kindergarten}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      active_modules: {
                        ...config.active_modules,
                        kindergarten: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Module Maternelle (PS, MS, GS)</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.active_modules.primary}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      active_modules: {
                        ...config.active_modules,
                        primary: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Module Primaire (CP1 au CM2)</span>
              </label>
            </div>
          </div>

          {/* Identité de l'école */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider border-b pb-1">
              Identité Officielle
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom de l'école *</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Code court / Sigle</label>
                <input
                  type="text"
                  value={config.short_code}
                  onChange={(e) => setConfig({ ...config, short_code: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">Devise de l'école</label>
                <input
                  type="text"
                  value={config.motto}
                  onChange={(e) => setConfig({ ...config, motto: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg italic"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Région / Ville</label>
                <input
                  type="text"
                  value={config.region}
                  onChange={(e) => setConfig({ ...config, region: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Adresse exacte</label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Téléphone officiel</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Contact WhatsApp</label>
                <input
                  type="text"
                  value={config.whatsapp}
                  onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Caisse & Reçus Thermiques */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider border-b pb-1">
              Configuration de la Caisse
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Préfixe de souche</label>
                <input
                  type="text"
                  value={config.cash_prefix}
                  onChange={(e) => setConfig({ ...config, cash_prefix: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Année Scolaire</label>
                <input
                  type="text"
                  value={config.academic_year}
                  onChange={(e) => setConfig({ ...config, academic_year: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Mention de bas de page du reçu thermique (Cachet)
              </label>
              <input
                type="text"
                value={config.stamp_text}
                onChange={(e) => setConfig({ ...config, stamp_text: e.target.value })}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          {/* Boutons actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
