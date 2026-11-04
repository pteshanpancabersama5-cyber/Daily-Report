import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types/report';
import { initAuth, googleSignIn, logout } from '../services/firebase';
import { User } from 'firebase/auth';
import {
  FileText,
  Plus,
  Table2,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  onCreateReport: () => void;
  onOpenSheets: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onCreateReport,
  onOpenSheets,
  onOpenSettings,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (u) => setUser(u),
      () => setUser(null)
    );
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-900/30">
            <FileText className="text-white" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">DailyReport Pro</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                Sistem Laporan Lapangan
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {settings.companyName || 'Sistem Laporan Harian Konstruksi & Proyek'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Google Sheets Status / Button */}
          <button
            type="button"
            onClick={onOpenSheets}
            className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              user && settings.spreadsheetId
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Table2 size={16} className={user ? 'text-emerald-400' : 'text-slate-400'} />
            <span>{user ? 'Google Sheets Aktif' : 'Hubungkan Sheets'}</span>
            {user && settings.spreadsheetId && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Pengaturan Kop Perusahaan & Kontak"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Settings size={18} />
          </button>

          {/* Create New Report Button */}
          <button
            type="button"
            onClick={onCreateReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shadow-sky-900/30 cursor-pointer"
          >
            <Plus size={16} />
            <span>Buat Laporan Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
