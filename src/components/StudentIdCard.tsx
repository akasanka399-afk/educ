import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Student, SchoolConfig, SchoolClass } from '../types';
import { formatDateFR, displayPhoneFR } from '../utils/formatters';
import { Shield, Sparkles, CheckCircle2, Phone, AlertTriangle, UserCheck } from 'lucide-react';

interface StudentIdCardProps {
  student: Student;
  school: SchoolConfig;
  schoolClass?: SchoolClass;
  cardLayout?: 'badge' | 'landscape'; // Badge vertical (standard porte-badge) ou format carte bancaire horizontal
  showBackSide?: boolean;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({
  student,
  school,
  schoolClass,
  cardLayout = 'badge',
  showBackSide = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Payload du QR Code pour vérification d'authenticité et contrôle aux entrées / cantine / ramassage
    const qrPayload = JSON.stringify({
      id: student.id,
      matricule: student.student_number,
      nom: `${student.last_name} ${student.first_name}`,
      classe: schoolClass?.name || 'Inconnue',
      annee: school.academic_year,
      ecole: school.name,
      contact_parent: student.parent_phone,
    });

    QRCode.toDataURL(qrPayload, {
      width: 140,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch((err) => console.error('Erreur QR Code carte', err));
  }, [student, school, schoolClass]);

  const isKindergarten = student.cycle === 'kindergarten';
  const primaryPickup = student.authorized_pickups?.[0];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 print:p-0 print:m-0 print:gap-4 print:page-break-inside-avoid">
      {/* ================= RECTO DE LA CARTE ================= */}
      <div
        className="w-[85.6mm] h-[54mm] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative flex flex-col justify-between select-none print:shadow-none print:border-gray-400 print:rounded-xl"
        style={{
          boxSizing: 'border-box',
          width: '85.6mm',
          height: '54mm',
          minWidth: '85.6mm',
          minHeight: '54mm',
          maxWidth: '85.6mm',
          maxHeight: '54mm',
        }}
      >
        {/* Bandeau Supérieur avec Dégradé et Devise */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-2.5 py-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center font-black text-[9px] text-amber-300 shrink-0">
              {school.short_code.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-[9.5px] uppercase tracking-tight truncate leading-tight">
                {school.name}
              </h4>
              <p className="text-[7px] text-emerald-200 truncate leading-none">
                {school.motto || 'Discipline • Travail • Succès'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 font-mono">
              CARTE SCOLAIRE
            </span>
          </div>
        </div>

        {/* Sous-bandeau Année Scolaire & Cycle */}
        <div className="bg-emerald-900 text-white px-2.5 py-0.5 flex items-center justify-between text-[7.5px] font-semibold border-b border-emerald-950/20">
          <span className="text-emerald-100">{school.academic_year}</span>
          <span className="uppercase text-amber-300 font-bold">
            {isKindergarten ? 'Cycle Maternelle' : 'Cycle Primaire'}
          </span>
          <span className="text-emerald-100">{school.region}</span>
        </div>

        {/* Corps central du Recto : Photo, Informations Élève & QR Code */}
        <div className="flex-1 px-2.5 py-1.5 flex items-center gap-2.5">
          {/* Cadre Photo d'identité */}
          <div className="w-[19mm] h-[24mm] shrink-0 rounded-lg border-2 border-emerald-600 bg-gray-100 overflow-hidden relative shadow-inner flex flex-col items-center justify-center text-center">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={`${student.first_name} ${student.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-1 text-gray-400">
                <span className="text-xl font-black text-emerald-700">
                  {student.last_name[0]}
                  {student.first_name[0]}
                </span>
                <span className="text-[6.5px] font-bold text-gray-500 uppercase mt-0.5">
                  Photo
                </span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-emerald-800 text-white text-[6.5px] font-bold py-0.2 uppercase text-center">
              {student.gender === 'M' ? 'Masculin' : 'Féminin'}
            </div>
          </div>

          {/* Données d'identité de l'élève */}
          <div className="flex-1 min-w-0 space-y-0.5 text-[8px] text-gray-800">
            <div>
              <div className="text-[6.5px] uppercase font-bold text-gray-400 tracking-wider">
                Nom & Prénom(s)
              </div>
              <div className="font-extrabold text-[10px] text-gray-950 leading-tight uppercase truncate">
                {student.last_name}
              </div>
              <div className="font-bold text-[9px] text-emerald-900 leading-tight capitalize truncate">
                {student.first_name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <div>
                <span className="text-[6.5px] font-bold text-gray-400 uppercase block">
                  Matricule
                </span>
                <span className="font-mono font-black text-[8.5px] text-emerald-800">
                  {student.student_number}
                </span>
              </div>
              <div>
                <span className="text-[6.5px] font-bold text-gray-400 uppercase block">
                  Classe
                </span>
                <span className="font-extrabold text-[9px] text-gray-900 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block">
                  {schoolClass?.name || 'Non assigné'}
                </span>
              </div>
            </div>

            <div className="pt-0.5 text-[7px] text-gray-600 truncate">
              Né(e) le <span className="font-semibold text-gray-900">{formatDateFR(student.birth_date)}</span>
              {student.birth_place ? ` à ${student.birth_place}` : ''}
            </div>
          </div>

          {/* QR Code Sécurisé */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Authentification"
                className="w-[18mm] h-[18mm] rounded border border-gray-200 bg-white p-0.5"
              />
            ) : (
              <div className="w-[18mm] h-[18mm] bg-gray-100 rounded animate-pulse" />
            )}
            <span className="text-[5.5px] font-mono font-bold text-emerald-800 tracking-tighter mt-0.5">
              SCAN OFFICIEL
            </span>
          </div>
        </div>

        {/* Pied de Carte Recto : Filigrane et signature */}
        <div className="bg-gray-50 border-t border-gray-200 px-2.5 py-0.8 flex items-center justify-between text-[6.5px] text-gray-500">
          <span className="font-medium truncate max-w-[55mm]">
            Tél Établissement : <strong className="text-gray-700">{school.phone}</strong>
          </span>
          <span className="font-serif italic font-bold text-emerald-900 text-[7px]">
            La Direction
          </span>
        </div>
      </div>

      {/* ================= VERSO DE LA CARTE ================= */}
      {showBackSide && (
        <div
          className="w-[85.6mm] h-[54mm] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative flex flex-col justify-between select-none print:shadow-none print:border-gray-400 print:rounded-xl"
          style={{
            boxSizing: 'border-box',
            width: '85.6mm',
            height: '54mm',
            minWidth: '85.6mm',
            minHeight: '54mm',
            maxWidth: '85.6mm',
            maxHeight: '54mm',
          }}
        >
          {/* Bandeau Supérieur Verso */}
          <div className="bg-gray-800 text-white px-2.5 py-1 flex items-center justify-between text-[7.5px] font-bold">
            <span className="uppercase tracking-wider">INFORMATIONS D'URGENCE & SÉCURITÉ</span>
            <span className="text-emerald-400 font-mono text-[7px]">BURKINA FASO</span>
          </div>

          {/* Contenu Verso */}
          <div className="px-3 py-1.5 flex-1 space-y-1.5 text-[7.5px]">
            {/* Responsable Légal */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <div className="flex items-center justify-between font-bold text-gray-900 text-[8px]">
                <span>Parent / Tuteur : {student.parent_name}</span>
                <span className="text-emerald-800 font-mono">{displayPhoneFR(student.parent_phone)}</span>
              </div>
              <div className="text-gray-500 text-[7px] truncate mt-0.5">
                Adresse : {student.parent_address || 'Non spécifiée'} {student.parent_profession ? `(${student.parent_profession})` : ''}
              </div>
            </div>

            {/* Personne autorisée au ramassage (Crucial en Maternelle / Primaire) */}
            {primaryPickup && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-1 text-[7px]">
                <span className="font-bold text-amber-900 block">
                  Sortie / Ramassage autorisé : {primaryPickup.name} ({primaryPickup.relation})
                </span>
                <span className="text-amber-800 font-mono">
                  Tél : {displayPhoneFR(primaryPickup.phone)}
                </span>
              </div>
            )}

            {/* Santé & Allergies */}
            <div className="grid grid-cols-2 gap-1 text-[7px]">
              <div className="bg-red-50 border border-red-200 rounded-lg p-1 text-red-900">
                <span className="font-bold block text-[6.5px] uppercase text-red-700">Groupe Sanguin</span>
                <span className="font-black text-[9px]">{student.blood_group || 'Non renseigné'}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-1 text-blue-900 truncate">
                <span className="font-bold block text-[6.5px] uppercase text-blue-700">Allergies / Santé</span>
                <span className="font-semibold truncate">{student.allergies || student.health_notes || 'Aucune'}</span>
              </div>
            </div>

            {/* Mention de retour */}
            <p className="text-[6px] text-gray-400 italic text-center leading-tight">
              Cette carte est strictement personnelle. En cas de perte ou de découverte, prière de la rapporter à la direction de {school.name} au {school.phone}.
            </p>
          </div>

          {/* Pied Verso */}
          <div className="bg-emerald-800 text-white px-2.5 py-0.8 flex items-center justify-between text-[6.5px]">
            <span className="font-mono text-emerald-200">EduNova Primaire SaaS BF</span>
            <span className="font-bold">Valable pour l'année {school.academic_year}</span>
          </div>
        </div>
      )}
    </div>
  );
};
