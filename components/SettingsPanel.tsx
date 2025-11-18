
import React, { useRef } from 'react';
import { Settings, VoiceGender } from '../types';
import { HomeIcon, QrCodeIcon, MovieIcon, UploadIcon, CloseIcon } from './icons';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  onGoHome: () => void;
  onShowQRCode: () => void;
  onShowVideoGenerator: () => void;
  pdfName: string[];
  isPdfProcessing: boolean;
  onPdfUpload: (files: FileList) => void;
  onPdfClear: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, 
  onSettingsChange, 
  onGoHome, 
  onShowQRCode, 
  onShowVideoGenerator,
  pdfName,
  isPdfProcessing,
  onPdfUpload,
  onPdfClear 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenderChange = (gender: VoiceGender) => {
    onSettingsChange({ ...settings, voiceGender: gender });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onPdfUpload(files);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 p-6 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
            <h2 className="text-3xl font-bold text-white">Pengaturan Admin</h2>
        </div>
        <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Kembali ke Home">
          <HomeIcon className="w-6 h-6 text-gray-300" />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Manajemen Dokumen PDF</h3>
          <p className="text-sm text-gray-400 mb-4">
            Unggah satu atau lebih dokumen PDF yang akan menjadi basis pengetahuan untuk Asisten AI.
          </p>
          {isPdfProcessing ? (
             <div className="flex items-center justify-center p-4 bg-gray-700 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-400 mr-3"></div>
                <span className="text-white">Menganalisis file...</span>
            </div>
          ) : pdfName.length > 0 ? (
            <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-semibold">Dokumen aktif ({pdfName.length}):</span>
                    <button onClick={onPdfClear} className="p-1 rounded-full hover:bg-gray-600 transition-colors" title="Hapus Semua Dokumen">
                        <CloseIcon className="w-5 h-5 text-red-400"/>
                    </button>
                </div>
                <ul className="max-h-32 overflow-y-auto space-y-1 pr-2">
                    {pdfName.map((name, index) => (
                        <li key={index} className="text-sm text-gray-300 bg-gray-800 p-2 rounded truncate flex items-center gap-2" title={name}>
                            <i className="fas fa-file-pdf text-red-400"></i>
                            <span>{name}</span>
                        </li>
                    ))}
                </ul>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-transform transform hover:scale-105"
            >
              <UploadIcon/> Unggah PDF
            </button>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" multiple />
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Pilihan Suara AI</h3>
          <p className="text-sm text-gray-400 mb-4">
            Pilih jenis suara untuk jawaban lisan dari Asisten AI.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => handleGenderChange(VoiceGender.Male)}
              className={`flex-1 p-4 rounded-lg text-center transition-all duration-200 ${settings.voiceGender === VoiceGender.Male ? 'bg-cyan-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <i className="fas fa-male text-2xl mb-2"></i>
              <span className="block font-semibold">Laki-laki (Wibawa)</span>
            </button>
            <button
              onClick={() => handleGenderChange(VoiceGender.Female)}
              className={`flex-1 p-4 rounded-lg text-center transition-all duration-200 ${settings.voiceGender === VoiceGender.Female ? 'bg-pink-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <i className="fas fa-female text-2xl mb-2"></i>
              <span className="block font-semibold">Perempuan</span>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Alat Bantu</h3>
            <div className="space-y-4">
              <button
              onClick={onShowQRCode}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left"
              >
              <div className="flex items-center">
                  <QrCodeIcon className="w-6 h-6 mr-4 text-cyan-400" />
                  <div>
                      <span className="font-semibold text-white">QR Code Generator</span>
                      <p className="text-sm text-gray-400">Buat dan cetak kode QR.</p>
                  </div>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
              <button
                onClick={onShowVideoGenerator}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left"
                >
                <div className="flex items-center">
                    <MovieIcon className="w-6 h-6 mr-4 text-cyan-400" />
                    <div>
                        <span className="font-semibold text-white">Animate Image with Veo</span>
                        <p className="text-sm text-gray-400">Buat video dari gambar dan teks.</p>
                    </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
