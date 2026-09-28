import React, { useState, useEffect } from 'react';
import { Payment, SchoolConfig, Student } from '../types';
import { formatFCFA, formatDateTimeFR, displayPhoneFR } from '../utils/formatters';
import { thermalPrinter } from '../services/thermalPrinter';
import { whatsappService } from '../services/whatsapp';
import { storage } from '../services/storage';
import QRCode from 'qrcode';
import { Printer, Share2, CheckCircle2, AlertTriangle, X, FileText, QrCode as QrIcon } from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment;
  onClose: () => void;
  onReprint?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose, onReprint }) => {
  const [school] = useState<SchoolConfig>(storage.getSchoolConfig());
  const [student, setStudent] = useState<Student | undefined>(storage.getStudentById(payment.student_id));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [printingStatus, setPrintingStatus] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const isDuplicate = payment.print_count > 1;

  useEffect(() => {
    // Génération du QR Code officiel de sécurisation
    const qrPayload = `EDUNOVA:${school.id}|${payment.receipt_number}|${payment.student_number}|${payment.amount_fcfa}|${payment.created_at}`;
    QRCode.toDataURL(qrPayload, { width: 140, margin: 1 })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code error', err));

    if (!student) {
      setStudent(storage.getStudentById(payment.student_id));
    }
  }, [payment, school]);

  // Impression Thermique ESC/POS directe (BLE ou repli)
  const handleThermalPrint = async () => {
    setPrintingStatus('Impression en cours...');
    try {
      storage.incrementPaymentPrintCount(payment.id);
      const res = await thermalPrinter.printPaymentReceipt(payment, school, isDuplicate);
      if (res.printedVia === 'BLE') {
        setPrintingStatus('Reçu imprimé avec succès via Bluetooth !');
        setIsSuccess(true);
      } else {
        setPrintingStatus('Impression système déclenchée.');
        window.print();
      }
      if (onReprint) onReprint();
    } catch (err: any) {
      setPrintingStatus(`Erreur : ${err.message || 'Impossible d\'imprimer'}`);
    }
  };

  // Impression via le navigateur (@media print)
  const handleBrowserPrint = () => {
    storage.incrementPaymentPrintCount(payment.id);
    if (onReprint) onReprint();
    window.print();
  };

  // Envoi WhatsApp direct au parent
  const handleWhatsAppShare = () => {
    if (!student || !student.parent_phone) {
      alert('Numéro WhatsApp du parent introuvable.');
      return;
    }
    const message = whatsappService.createPaymentMessage(payment, student, school);
    whatsappService.openWhatsApp(student.parent_phone, message);
    storage.logWhatsApp({
      student_id: student.id,
      recipient_name: student.parent_name,
      phone: student.parent_phone,
      template_type: 'CONFIRMATION_RECU',
      content: message,
      status: 'SENT',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Barre d'action supérieure */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider text-gray-700 uppercase">
              Ticket Thermique 80 mm
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du ticket thermique stylisé (aspect papier rouleau 80 mm continu) */}
        <div className="p-4 overflow-y-auto flex-1 bg-gray-100 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-5 shadow-md border-t-4 border-emerald-600 rounded-sm font-mono text-[11.5px] leading-tight text-gray-900 border-dashed border-b-2 border-gray-300"
          >
            {/* Mention Duplicata */}
            {isDuplicate && (
              <div className="mb-2 py-1 bg-amber-100 border border-amber-400 text-amber-900 text-center font-bold text-xs tracking-widest uppercase">
                *** DUPLICATA DE REÇU ***
              </div>
            )}

            {payment.is_cancelled && (
              <div className="mb-2 py-1 bg-red-100 border border-red-500 text-red-700 text-center font-bold text-xs tracking-widest uppercase">
                *** REÇU ANNULÉ ***
              </div>
            )}

            {/* En-tête École */}
            <div className="text-center space-y-0.5 pb-2 border-b border-gray-800">
              <h1 className="font-black text-sm tracking-tight text-gray-900 uppercase">
                {school.name}
              </h1>
              <p className="text-[10px] italic text-gray-600">{school.motto}</p>
              <p className="text-[10px] text-gray-600">{school.address}</p>
              <p className="text-[10px] font-semibold text-gray-700">Tél: {school.phone}</p>
            </div>

            {/* Titre & Numéro */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold text-gray-900">
                <span>REÇU N°:</span>
                <span>{payment.receipt_number}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Date:</span>
                <span>{formatDateTimeFR(payment.created_at)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Caissier:</span>
                <span>{payment.cashier_name}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Mode:</span>
                <span className="font-semibold text-gray-900">
                  {payment.payment_method.replace('_', ' ')}
                </span>
              </div>
              {payment.transaction_ref && (
                <div className="flex justify-between text-gray-600">
                  <span>Réf:</span>
                  <span className="font-mono text-[10px]">{payment.transaction_ref}</span>
                </div>
              )}
            </div>

            {/* Informations Élève */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Élève
              </div>
              <div className="font-bold text-gray-900 text-xs">
                {payment.student_name}
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Matricule:</span>
                <span className="font-semibold">{payment.student_number}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Classe:</span>
                <span className="font-semibold">{payment.class_name}</span>
              </div>
            </div>

            {/* Motif & Versement */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Motif du versement
              </div>
              <div className="font-medium text-gray-800">
                {payment.fee_category} - {payment.period_label || 'Paiement scolarité'}
              </div>

              {/* Bloc Montant */}
              <div className="my-2 py-2 bg-gray-50 border border-gray-200 text-center rounded">
                <div className="text-[9px] uppercase tracking-wider text-gray-500 font-sans">
                  Montant encaissé
                </div>
                <div className="text-lg font-black text-emerald-700 tracking-tight">
                  {formatFCFA(payment.amount_fcfa)}
                </div>
              </div>

              <div className="text-[10px] italic text-gray-600 leading-tight">
                Arrêté à : <span className="font-semibold">{payment.amount_in_words}</span>
              </div>
            </div>

            {/* Situation financière */}
            <div className="py-2 border-b border-gray-800 space-y-0.5 text-[10.5px]">
              <div className="flex justify-between text-gray-600">
                <span>Total déjà versé:</span>
                <span>{formatFCFA(payment.total_paid_after)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>RESTE À PAYER:</span>
                <span className="text-amber-800 font-black">
                  {formatFCFA(payment.remaining_balance_after)}
                </span>
              </div>
            </div>

            {/* QR Code de vérification & Cachet */}
            <div className="pt-3 pb-1 text-center flex flex-col items-center">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code Reçu"
                  className="w-24 h-24 border border-gray-300 p-0.5 bg-white mb-1"
                />
              )}
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                Vérification anti-fraude
              </span>
              <p className="mt-2 text-[9px] text-gray-500 max-w-[240px]">
                {school.stamp_text}
              </p>
              <p className="mt-1 text-[8.5px] italic text-gray-400">
                Frais non remboursables. Conservez ce reçu.
              </p>
            </div>
          </div>
        </div>

        {/* Message de statut */}
        {printingStatus && (
          <div
            className={`px-4 py-2 text-xs text-center font-medium ${
              isSuccess ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
            }`}
          >
            {printingStatus}
          </div>
        )}

        {/* Barre d'actions */}
        <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Bouton Impression Thermique ESC/POS */}
            <button
              onClick={handleThermalPrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl text-xs shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer 80mm</span>
            </button>

            {/* Bouton Envoi WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-medium rounded-xl text-xs shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Parent</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Bouton Repli Boîte Système / PDF */}
            <button
              onClick={handleBrowserPrint}
              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium rounded-xl text-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>Impression / PDF</span>
            </button>

            {/* Fermer */}
            <button
              onClick={onClose}
              className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
          </div>

          {student?.parent_phone && (
            <div className="text-center text-[10.5px] text-gray-500">
              Contact tuteur : <span className="font-semibold text-gray-700">{displayPhoneFR(student.parent_phone)}</span> ({student.parent_name})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
