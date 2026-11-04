import React, { useState } from 'react';
import { DailyReport } from '../types/report';
import { generateEmailContent, createMailtoLink } from '../services/exportService';
import { Mail, Copy, Check, ExternalLink, X, Send, FileDown } from 'lucide-react';

interface EmailShareModalProps {
  report: DailyReport;
  sheetsUrl?: string;
  onDownloadPdf?: () => void;
  onClose: () => void;
}

export const EmailShareModal: React.FC<EmailShareModalProps> = ({
  report,
  sheetsUrl,
  onDownloadPdf,
  onClose,
}) => {
  const { subject: initialSubject, body: initialBody } = generateEmailContent(report, sheetsUrl);

  const [toEmail, setToEmail] = useState('pt.eshanpancabersama5@gmail.com');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [copied, setCopied] = useState(false);

  const quickRecipients = [
    { label: 'Pemberi Tugas (Owner)', email: 'owner.project@metropolitan.co.id' },
    { label: 'Konsultan Pengawas (MK)', email: 'mk.budi@pengawas-utama.com' },
    { label: 'Direksi Kontraktor', email: 'direksi@eshanpancabersama.co.id' },
  ];

  const mailtoUrl = createMailtoLink(toEmail, subject, body, ccEmail);

  const handleCopy = async () => {
    try {
      const fullText = `Kepada: ${toEmail}\nCC: ${ccEmail}\nSubjek: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  const handleSendEmail = () => {
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-600 rounded-xl">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Kirim Laporan Otomatis via Email</h3>
              <p className="text-xs text-sky-100">Kirim laporan resmi harian langsung ke email manajemen dan klien</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sky-200 hover:text-white hover:bg-sky-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tip Banner */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
            <span>💡 <strong>Tips Lampiran:</strong> Unduh file PDF laporan terlebih dahulu untuk di-attach ke dalam email Anda.</span>
            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="px-3 py-1 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-1.5 shrink-0 ml-3"
              >
                <FileDown size={14} /> Unduh PDF
              </button>
            )}
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kepada (To):</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="email@pemberitugas.com"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
            {/* Quick Contacts */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Pilihan Cepat:</span>
              {quickRecipients.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setToEmail(r.email)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700 rounded-lg transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* CC */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tembusan (CC - Opsional):</label>
            <input
              type="text"
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              placeholder="engineer@proyek.com, konsultan@mk.com"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subjek Email:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Pesan (Body):</label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-2xs"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Salin Teks Lengkap</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Send size={16} />
              <span>Buka di Aplikasi Email</span>
              <ExternalLink size={14} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
