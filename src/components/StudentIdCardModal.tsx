import React, { useState } from 'react';
import { Student, SchoolConfig, SchoolClass } from '../types';
import { StudentIdCard } from './StudentIdCard';
import {
  Printer,
  X,
  CreditCard,
  Download,
  Share2,
  CheckCircle,
  Eye,
  Layers,
  Image as ImageIcon
} from 'lucide-react';

interface StudentIdCardModalProps {
  student: Student;
  school: SchoolConfig;
  schoolClass?: SchoolClass;
  onClose: () => void;
  onUpdatePhoto?: (studentId: string, photoUrl: string) => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  school,
  schoolClass,
  onClose,
  onUpdatePhoto,
}) => {
  const [showBackSide, setShowBackSide] = useState<boolean>(true);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(student.photo_url);

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setPhotoPreview(result);
        if (onUpdatePhoto) {
          onUpdatePhoto(student.id, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentStudent = {
    ...student,
    photo_url: photoPreview,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Conteneur principal modal */}
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:w-full print:m-0 print:p-0 print:bg-white print:rounded-none print:shadow-none">
        {/* En-tête (masqué lors de l'impression) */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 flex items-center justify-center text-white shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight">
                Carte Scolaire Officielle (Norme ISO CR80)
              </h2>
              <p className="text-xs text-emerald-200">
                {student.last_name} {student.first_name} • {student.student_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBackSide(!showBackSide)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold rounded-xl text-white transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showBackSide ? 'Recto seul' : 'Recto + Verso'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black rounded-xl shadow-md transition-transform hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Carte</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barre d'outils Photo et Personnalisation (masqué lors de l'impression) */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 text-xs text-gray-700">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer font-medium text-gray-700 border border-gray-200 transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Changer la photo d'identité</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">
              Format standard : 85.6 × 54 mm (plastification ou porte-badge cordon)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>QR Code Sécurisé Actif</span>
          </div>
        </div>

        {/* Zone de prévisualisation et d'impression */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center bg-radial from-slate-200 to-slate-300 print:bg-white print:p-0">
          <div className="p-4 bg-white/70 backdrop-blur-xs rounded-3xl shadow-sm border border-white/60 print:bg-transparent print:p-0 print:border-none print:shadow-none">
            <StudentIdCard
              student={currentStudent}
              school={school}
              schoolClass={schoolClass}
              showBackSide={showBackSide}
            />
          </div>
        </div>

        {/* Pied de modal (masqué lors de l'impression) */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-gray-500">
            Astuce : Utilisez du papier cartonné 250g-300g ou des pochettes plastiques rigides avec tour de cou.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Lancer l'impression</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
