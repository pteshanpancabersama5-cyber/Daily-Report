/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyReport, AppSettings } from './types/report';
import { sampleReports, initialSettings } from './data/sampleReports';
import { Header } from './components/Header';
import { ReportList } from './components/ReportList';
import { ReportEditor } from './components/ReportEditor';
import { ReportDetailModal } from './components/ReportDetailModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { EmailShareModal } from './components/EmailShareModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SettingsModal } from './components/SettingsModal';
import {
  FileCheck2,
  Share2,
  FileSpreadsheet,
  FileDown,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

const STORAGE_KEY_REPORTS = 'dailyreport_pro_reports_v1';
const STORAGE_KEY_SETTINGS = 'dailyreport_pro_settings_v1';

export default function App() {
  // Reports State with LocalStorage cache
  const [reports, setReports] = useState<DailyReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load reports from storage', e);
    }
    return sampleReports;
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load settings from storage', e);
    }
    return initialSettings;
  });

  // Modal States
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);
  const [editorReport, setEditorReport] = useState<DailyReport | null | undefined>(undefined); // undefined = closed, null = new, report = edit
  const [waReport, setWaReport] = useState<DailyReport | null>(null);
  const [emailReport, setEmailReport] = useState<DailyReport | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [targetSheetsReport, setTargetSheetsReport] = useState<DailyReport | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed saving reports to storage', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed saving settings to storage', e);
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // CRUD Operations
  const handleSaveReport = (savedReport: DailyReport) => {
    setReports((prev) => {
      const exists = prev.some((r) => r.id === savedReport.id);
      if (exists) {
        return prev.map((r) => (r.id === savedReport.id ? savedReport : r));
      }
      return [savedReport, ...prev];
    });

    setEditorReport(undefined);
    if (activeReport?.id === savedReport.id) {
      setActiveReport(savedReport);
    }
    showToast(`Laporan ${savedReport.reportNumber} berhasil disimpan!`);
  };

  const handleDeleteReport = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    if (activeReport?.id === reportId) {
      setActiveReport(null);
    }
    showToast('Laporan berhasil dihapus.');
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    showToast('Pengaturan berhasil diperbarui.');
  };

  const handleReportSynced = (reportId: string, sheetsUrl: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, syncedToSheets: true, sheetsUrl } : r))
    );
    if (activeReport?.id === reportId) {
      setActiveReport((prev) => (prev ? { ...prev, syncedToSheets: true, sheetsUrl } : null));
    }
    showToast('Data berhasil disinkronkan ke Google Sheets!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <Header
        settings={settings}
        onCreateReport={() => setEditorReport(null)}
        onOpenSheets={() => {
          setTargetSheetsReport(undefined);
          setIsSheetsModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        {/* Banner Quick Actions & Features Guide */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
                <Sparkles size={14} className="text-amber-400" />
                <span>Sistem Pelaporan Terpadu Lapangan & Manajemen</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Laporan Harian Proyek Lengkap & Ekspor PDF Foto Dokumentasi
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kelola rekap tenaga kerja, target & realisasi progres, log material, kendala cuaca, serta lembar tanda tangan digital. Didukung pengiriman pesan otomatis ke WhatsApp, Email, dan sinkronisasi resmi Google Sheets.
              </p>
            </div>

            {/* Quick action buttons on banner */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setEditorReport(null)}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>+ Buat Laporan Harian</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetSheetsReport(undefined);
                  setIsSheetsModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold border border-emerald-500/40 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet size={16} />
                <span>Sinkronisasi Sheets</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report List & Dashboard View */}
        <ReportList
          reports={reports}
          settings={settings}
          onViewReport={(rep) => setActiveReport(rep)}
          onEditReport={(rep) => setEditorReport(rep)}
          onDeleteReport={handleDeleteReport}
          onOpenWhatsApp={(rep) => setWaReport(rep)}
          onOpenEmail={(rep) => setEmailReport(rep)}
          onOpenSheets={(rep) => {
            setTargetSheetsReport(rep);
            setIsSheetsModalOpen(true);
          }}
          onCreateNew={() => setEditorReport(null)}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            DailyReport Pro • Sistem Manajemen Dokumentasi Lapangan © {new Date().getFullYear()} {settings.companyName}
          </span>
          <span className="text-[11px] text-slate-400">
            Dukungan Ekspor PDF • WhatsApp Web • Mailto • Google Sheets API v4
          </span>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Report Editor Modal (Create or Edit) */}
      {editorReport !== undefined && (
        <ReportEditor
          initialReport={editorReport}
          settings={settings}
          onSave={handleSaveReport}
          onCancel={() => setEditorReport(undefined)}
        />
      )}

      {/* 2. Full Report Detail Modal */}
      {activeReport && (
        <ReportDetailModal
          report={activeReport}
          allReports={reports}
          settings={settings}
          onEdit={(rep) => {
            setActiveReport(null);
            setEditorReport(rep);
          }}
          onDelete={handleDeleteReport}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setActiveReport(null)}
        />
      )}

      {/* 3. WhatsApp Share Modal */}
      {waReport && (
        <WhatsAppShareModal
          report={waReport}
          sheetsUrl={settings.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit` : undefined}
          onClose={() => setWaReport(null)}
        />
      )}

      {/* 4. Email Share Modal */}
      {emailReport && (
        <EmailShareModal
          report={emailReport}
          sheetsUrl={settings.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit` : undefined}
          onClose={() => setEmailReport(null)}
        />
      )}

      {/* 5. Google Sheets Sync Modal */}
      {isSheetsModalOpen && (
        <GoogleSheetsModal
          report={targetSheetsReport}
          allReports={reports}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onReportSynced={handleReportSynced}
          onClose={() => {
            setIsSheetsModalOpen(false);
            setTargetSheetsReport(undefined);
          }}
        />
      )}

      {/* 6. Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
