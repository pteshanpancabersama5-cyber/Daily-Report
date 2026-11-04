import React, { useState } from 'react';
import { AppSettings } from '../types/report';
import { Settings, Save, X, Building, Mail, Phone, User, FileSpreadsheet } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-sky-400 rounded-xl">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Pengaturan Perusahaan & Default Laporan</h3>
              <p className="text-xs text-slate-400">Konfigurasi data kop surat resmi, kontak pengawas, dan integrasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan / Kontraktor Utama:</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Kantor / Kop Dokumen:</label>
            <textarea
              rows={2}
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kontraktor Pelaksana Default:</label>
              <input
                type="text"
                value={formData.defaultContractor}
                onChange={(e) => setFormData({ ...formData, defaultContractor: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pemberi Tugas / Owner Default:</label>
              <input
                type="text"
                value={formData.defaultClient}
                onChange={(e) => setFormData({ ...formData, defaultClient: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Site Supervisor Default:</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Pengawas:</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={formData.supervisorPhone}
                  onChange={(e) => setFormData({ ...formData, supervisorPhone: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Default Manajemen / Penerima Laporan:</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="email"
                value={formData.managerEmail}
                onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ID Google Spreadsheet Terhubung:</label>
            <div className="relative">
              <FileSpreadsheet className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="ID Spreadsheet Google Docs..."
                value={formData.spreadsheetId || ''}
                onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save size={15} /> Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
