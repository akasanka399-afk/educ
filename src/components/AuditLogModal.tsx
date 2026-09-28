import React from 'react';
import { storage } from '../services/storage';
import { formatDateTimeFR } from '../utils/formatters';
import { ShieldCheck, X, Clock, User } from 'lucide-react';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const auditLogs = storage.getAuditLogs();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>Journal d'Audit Immuable & Sécurité</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste des logs */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs">
          <p className="text-gray-500 text-[11px]">
            Toutes les transactions financières, annulations de reçus et modifications administratives sont scellées et horodatées.
          </p>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-white hover:bg-gray-50 transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded text-[10.5px]">
                      {log.action}
                    </span>
                    <span className="text-gray-400 text-[10.5px] font-mono">
                      {formatDateTimeFR(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-gray-800 font-medium">{log.details}</p>

                  <div className="text-[10.5px] text-gray-400 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>
                      Opérateur : <strong>{log.user_name}</strong> ({log.user_role})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                Aucun événement d'audit enregistré.
              </div>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
