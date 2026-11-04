import React, { useState } from 'react';
import { DailyReport } from '../types/report';
import { generateWhatsAppMessage, createWhatsAppLink, WATemplateType } from '../services/exportService';
import { Send, Copy, Check, MessageSquare, ExternalLink, X, Smartphone, User } from 'lucide-react';

interface WhatsAppShareModalProps {
  report: DailyReport;
  sheetsUrl?: string;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  report,
  sheetsUrl,
  onClose,
}) => {
  const [template, setTemplate] = useState<WATemplateType>('lengkap');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const quickContacts = [
    { label: 'Project Manager (Owner)', phone: '081298765432' },
    { label: 'Konsultan Pengawas (MK)', phone: '08111223344' },
    { label: 'Grup WhatsApp Proyek', phone: '' },
  ];

  const messageText = generateWhatsAppMessage(report, template, sheetsUrl);
  const waLink = createWhatsAppLink(phoneNumber, messageText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  const handleSendWA = () => {
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Kirim Laporan Otomatis via WhatsApp</h3>
              <p className="text-xs text-emerald-100">Format pesan rapi langsung terkirim ke kontak atau grup WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Format Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Pilih Format Template Pesan:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('lengkap')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all ${
                  template === 'lengkap'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Format Lengkap</div>
                <div className="text-[10px] text-slate-500 font-normal">Tenaga kerja, progress, kendala, material</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('ringkas')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all ${
                  template === 'ringkas'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Format Ringkas (Eksekutif)</div>
                <div className="text-[10px] text-slate-500 font-normal">Singkat, cocok untuk Direksi / Klien</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('kendala')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all ${
                  template === 'kendala'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Fokus Kendala & K3</div>
                <div className="text-[10px] text-slate-500 font-normal">Masalah cuaca/alat & mitigasi cepat</div>
              </button>
            </div>
          </div>

          {/* Destination Phone Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Nomor WhatsApp Tujuan (Opsional - kosongkan jika kirim ke grup):</span>
              <span className="text-[11px] font-normal text-slate-500">Format: 0812... atau 62812...</span>
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Contoh: 081234567890 (atau biarkan kosong untuk pilih kontak di WA)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Contacts */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Kontak Cepat:</span>
              {quickContacts.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhoneNumber(c.phone)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <User size={12} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview (WhatsApp Chat Style) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Pratinjau Pesan WhatsApp:</span>
              <span className="text-[11px] text-slate-400">{messageText.length} karakter</span>
            </div>
            <div className="p-4 bg-[#e5ddd5] rounded-xl border border-slate-300 max-h-64 overflow-y-auto">
              <div className="bg-white p-3.5 rounded-lg rounded-tl-none shadow-xs text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-text border border-emerald-100">
                {messageText}
              </div>
            </div>
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
                <span>Salin Teks Format WA</span>
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
              onClick={handleSendWA}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Send size={16} />
              <span>Buka di WhatsApp Web / App</span>
              <ExternalLink size={14} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
