import React, { useState } from 'react';
import { ThermalPrinterSettings, SchoolConfig } from '../types';
import { thermalPrinter } from '../services/thermalPrinter';
import {
  Printer,
  Bluetooth,
  Usb,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Info
} from 'lucide-react';

interface PrinterSettingsModalProps {
  school: SchoolConfig;
  onClose: () => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({ school, onClose }) => {
  const [settings, setSettings] = useState<ThermalPrinterSettings>(thermalPrinter.getSettings());
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string>('');

  const isBleSupported = thermalPrinter.isBluetoothSupported();
  const isUsbSupported = thermalPrinter.isUsbSupported();

  const handleConnectBluetooth = async () => {
    setIsLoading(true);
    setConnectionStatus('Recherche des périphériques Bluetooth à proximité...');
    try {
      const res = await thermalPrinter.connectBluetooth();
      if (res.success) {
        setConnectionStatus(`Imprimante connectée avec succès : ${res.deviceName || 'POS-80'}`);
        setSettings(thermalPrinter.getSettings());
      } else {
        setConnectionStatus(`Échec : ${res.error}`);
      }
    } catch (err: any) {
      setConnectionStatus(`Erreur : ${err.message || 'Impossible de se connecter'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrint = async () => {
    setIsLoading(true);
    setTestResult('Envoi du ticket de test 80 mm...');
    try {
      const res = await thermalPrinter.printTestTicket(school);
      if (res.mode === 'BLE') {
        setTestResult('Ticket de test imprimé via Bluetooth avec succès !');
      } else {
        setTestResult('Mode secours : Impression système déclenchée.');
        window.print();
      }
    } catch (err: any) {
      setTestResult(`Erreur test : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    thermalPrinter.saveSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <Printer className="w-5 h-5 text-emerald-600" />
            <span>Configuration Imprimante Thermique 80 mm</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des réglages */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* État matériel actuel */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 uppercase">Mode de liaison actif :</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                {settings.connection_type === 'BLE'
                  ? 'Bluetooth BLE Direct'
                  : settings.connection_type === 'USB'
                  ? 'Câble USB Direct'
                  : 'Impression Système (Fallback)'}
              </span>
            </div>
            {settings.device_name && (
              <p className="text-gray-600">
                Appareil mémorisé : <strong>{settings.device_name}</strong>
              </p>
            )}
          </div>

          {/* Boutons d'Appairage Direct */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-800 uppercase tracking-wider">
              1. Appairage & Connexion Matérielle
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Bluetooth BLE */}
              <button
                type="button"
                onClick={handleConnectBluetooth}
                disabled={!isBleSupported || isLoading}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  isBleSupported
                    ? 'border-blue-300 bg-blue-50/60 hover:bg-blue-100 text-blue-900 font-bold'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Bluetooth className="w-5 h-5 text-blue-600" />
                <span>Appairer en Bluetooth (BLE)</span>
                <span className="text-[10px] text-gray-500 font-normal">
                  {isBleSupported ? 'Supporté sur Chrome' : 'Non supporté sur ce navigateur'}
                </span>
              </button>

              {/* Mode Secours Navigateur */}
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, connection_type: 'BROWSER_PRINT' })
                }
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  settings.connection_type === 'BROWSER_PRINT'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>Mode Secours Système</span>
                <span className="text-[10px] text-gray-500 font-normal">
                  Fonctionne sur 100% des appareils
                </span>
              </button>
            </div>

            {connectionStatus && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium">
                {connectionStatus}
              </div>
            )}
          </div>

          {/* Options de format & découpe */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block font-bold text-gray-800 uppercase tracking-wider">
              2. Paramètres du Rouleau Thermique
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Largeur du papier</label>
                <select
                  value={settings.paper_width}
                  onChange={(e) =>
                    setSettings({ ...settings, paper_width: e.target.value as any })
                  }
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                >
                  <option value="80mm">80 mm (Standard Grand Ticket Caisse)</option>
                  <option value="58mm">58 mm (Petit Rouleau Mobile)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Densité de trame</label>
                <select
                  value={settings.density}
                  onChange={(e) =>
                    setSettings({ ...settings, density: e.target.value as any })
                  }
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <option value="light">Clair (Économie)</option>
                  <option value="medium">Moyen (Standard)</option>
                  <option value="dark">Foncé (Netteté Max)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={settings.auto_cut}
                  onChange={(e) => setSettings({ ...settings, auto_cut: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Découpe automatique du papier après le reçu (Auto-cut)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={settings.open_cash_drawer}
                  onChange={(e) =>
                    setSettings({ ...settings, open_cash_drawer: e.target.checked })
                  }
                  className="rounded text-emerald-600"
                />
                <span>Impulsion d'ouverture du tiroir-caisse connecté (RJ11)</span>
              </label>
            </div>
          </div>

          {/* Test d'impression */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900">Vérification Matérielle :</span>
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg text-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Lancer un Ticket Test 80 mm</span>
              </button>
            </div>
            {testResult && (
              <p className="text-[11px] text-amber-800 font-semibold">{testResult}</p>
            )}
          </div>

          {/* Note sur la compatibilité iOS / Safari */}
          <div className="flex items-start gap-2 text-[10.5px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>
              Les connexions directes Web Bluetooth et WebUSB sont natives sur <strong>Google Chrome</strong> (Android, PC et Mac). Sur les appareils Apple iOS (iPhone/iPad), le logiciel bascule de manière transparente sur la boîte d'impression système optimisée pour rouleaux de 80 mm.
            </span>
          </div>
        </div>

        {/* Pied de modal */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
          >
            Enregistrer les Réglages
          </button>
        </div>
      </div>
    </div>
  );
};
