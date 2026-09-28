import React, { useState } from 'react';
import { SchoolConfig, SchoolClass, Student, WhatsAppMessageLog } from '../types';
import { storage } from '../services/storage';
import { whatsappService, PREDEFINED_TEMPLATES } from '../services/whatsapp';
import { formatFCFA, displayPhoneFR, normalizeBurkinaPhone } from '../utils/formatters';
import {
  MessageSquare,
  Share2,
  CheckCircle2,
  Clock,
  Send,
  Filter,
  Users,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

interface WhatsAppCenterProps {
  school: SchoolConfig;
  classes: SchoolClass[];
}

export const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({ school, classes }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('reminder');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>(storage.getWhatsAppLogs());

  // File d'attente guidée
  const students = storage.getStudents();
  const targetStudents = students.filter((s) => {
    const matchesClass = selectedClassId === 'ALL' || s.class_id === selectedClassId;
    const remaining = (s.total_fees - s.discount) - s.paid_amount;
    if (selectedTemplateId === 'reminder') {
      return matchesClass && remaining > 0;
    }
    return matchesClass;
  });

  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const activeTemplate =
    PREDEFINED_TEMPLATES.find((t) => t.id === selectedTemplateId) || PREDEFINED_TEMPLATES[0];

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || 'Classe';
  };

  const handleSendToStudent = (st: Student) => {
    if (!st.parent_phone) {
      alert('Numéro du parent manquant.');
      return;
    }

    const remaining = (st.total_fees - st.discount) - st.paid_amount;
    const text = whatsappService.interpolate(activeTemplate.template, {
      nom_ecole: school.name,
      nom_parent: st.parent_name,
      nom_eleve: `${st.last_name} ${st.first_name}`,
      classe: getClassName(st.class_id),
      montant: formatFCFA(st.paid_amount),
      reste_a_payer: formatFCFA(remaining),
      numero_recu: 'REC-XXXX',
      mode_paiement: 'Espèces / Mobile Money',
      date: new Date().toLocaleDateString('fr-FR'),
      tel_ecole: school.phone,
      periode: '1er Trimestre',
      moyenne: '7.85/10',
      rang: '4e/42',
      date_reunion: 'Samedi prochain',
    });

    whatsappService.openWhatsApp(st.parent_phone, text);

    storage.logWhatsApp({
      student_id: st.id,
      recipient_name: st.parent_name,
      phone: st.parent_phone,
      template_type: activeTemplate.title,
      content: text,
      status: 'SENT',
    });

    setProcessedIds(new Set(processedIds).add(st.id));
    setLogs(storage.getWhatsAppLogs());
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim() || !customMessage.trim()) return;

    whatsappService.openWhatsApp(customPhone, customMessage);

    storage.logWhatsApp({
      recipient_name: 'Contact direct',
      phone: normalizeBurkinaPhone(customPhone),
      template_type: 'MESSAGE_PERSONNALISE',
      content: customMessage,
      status: 'SENT',
    });

    setCustomPhone('');
    setCustomMessage('');
    setLogs(storage.getWhatsAppLogs());
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#25D366]" />
            Centre de Communication WhatsApp Parents
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Envoi assisté (Mode 1 gratuit via wa.me) avec normalisation +226 et modèles prêts à l'emploi.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Mode 1 Actif : Liens wa.me directs 100% gratuits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Modèles & File d'attente d'envoi groupé */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sélection du Modèle */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              1. Choisir un Modèle de Message
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREDEFINED_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3 rounded-xl text-left border transition-all text-xs ${
                    selectedTemplateId === tpl.id
                      ? 'border-[#25D366] bg-emerald-50/50 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900 flex items-center justify-between">
                    <span>{tpl.title}</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded font-semibold bg-gray-100 text-gray-600">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 font-mono">
                    {tpl.template}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* File d'attente guidée des parents à notifier */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  File d'attente guidée ({targetStudents.length} parents ciblés)
                </h3>
                <p className="text-xs text-gray-500">
                  Traitez les envois un par un en un simple clic sans risque de doublon.
                </p>
              </div>

              {/* Filtre Classe */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Classe :</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                >
                  <option value="ALL">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progression de la file */}
            <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <span>
                Progression : <strong>{processedIds.size}</strong> sur{' '}
                <strong>{targetStudents.length}</strong> parents envoyés
              </span>
              <button
                onClick={() => setProcessedIds(new Set())}
                className="text-xs text-emerald-700 hover:underline font-semibold"
              >
                Réinitialiser la file
              </button>
            </div>

            {/* Liste des parents dans la file */}
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {targetStudents.map((st) => {
                const isSent = processedIds.has(st.id);
                const remaining = (st.total_fees - st.discount) - st.paid_amount;
                return (
                  <div
                    key={st.id}
                    className={`p-3 flex items-center justify-between text-xs transition-colors ${
                      isSent ? 'bg-emerald-50/40 opacity-70' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{st.parent_name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          Élève : {st.last_name} {st.first_name} ({getClassName(st.class_id)})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px]">
                        <span className="font-mono text-emerald-700 font-bold">
                          {displayPhoneFR(st.parent_phone)}
                        </span>
                        {remaining > 0 && (
                          <span className="text-amber-800 font-semibold">
                            Reliquat dû : {formatFCFA(remaining)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Envoyé
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendToStudent(st)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Envoyer WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Envoi Rapide Manuel & Historique */}
        <div className="lg:col-span-4 space-y-4">
          {/* Formulaire Envoi Manuel */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider border-b pb-2">
              Message Personnalisé Rapide
            </h3>

            <form onSubmit={handleSendCustom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Téléphone (+226...) *
                </label>
                <input
                  type="tel"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="Ex: 70 12 34 56"
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Tapez votre message à l'attention du parent..."
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Ouvrir dans WhatsApp</span>
              </button>
            </form>
          </div>

          {/* Historique des envois récents */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider border-b pb-2">
              Derniers Envois Émis ({logs.length})
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-gray-50 rounded-xl border border-gray-100 space-y-1"
                  >
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{log.recipient_name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {new Date(log.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="font-mono text-emerald-700 text-[10.5px]">{log.phone}</div>
                    <p className="text-gray-500 text-[10.5px] line-clamp-2 italic">
                      "{log.content}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 italic text-center py-4">
                  Aucun message envoyé pour le moment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
