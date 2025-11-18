
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BackIcon, UploadIcon, MovieIcon, HomeIcon } from './icons';

interface VideoGeneratorProps {
  onBack: () => void;
  onGoHome: () => void;
}

const loadingMessages = [
  "Memulai proses pembuatan video...",
  "AI sedang berkreasi...",
  "Mengumpulkan piksel-piksel ajaib...",
  "Hampir selesai, menambahkan sentuhan akhir...",
  "Video Anda sedang dirender, ini mungkin memakan waktu beberapa menit.",
];

// FIX: Changed to a named export to resolve the import error in App.tsx.
export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onBack, onGoHome }) => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      let messageIndex = 0;
      interval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const checkApiKey = async () => {
    if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
      setApiKeySelected(true);
    } else {
      setApiKeySelected(false);
    }
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        await checkApiKey();
    }
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setGeneratedVideoUrl(null);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image || !imageBase64) {
      setError('Silakan unggah gambar terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setGeneratedVideoUrl(null);
    setError(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const imagePart = {
          mimeType: image.type,
          imageBytes: imageBase64,
      };

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: imagePart,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      if (operation.error) {
          throw new Error(`Video generation failed: ${operation.error.message}`);
      }
      
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error('Tidak ada link video yang dihasilkan.');
      }
      
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        const responseBody = await response.text();
        if (responseBody.includes("Requested entity was not found.")) {
             throw new Error("Requested entity was not found.");
        }
        throw new Error(`Gagal mengunduh video: ${response.statusText}`);
      }
      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || 'Terjadi kesalahan yang tidak diketahui.';
      if (errorMessage.includes("Requested entity was not found.")) {
          errorMessage = "Kunci API tidak valid atau tidak ditemukan. Silakan pilih kunci API yang benar.";
          setApiKeySelected(false);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!apiKeySelected) {
    return (
        <div className="flex flex-col h-full bg-gray-800 p-6 rounded-lg shadow-xl text-white items-center justify-center text-center">
            <MovieIcon className="w-16 h-16 text-cyan-400 mb-4"/>
            <h2 className="text-2xl font-bold mb-2">Animate Image with Veo</h2>
            <p className="mb-4 text-gray-400">Untuk menggunakan fitur ini, Anda perlu memilih Kunci API.</p>
            <button onClick={handleSelectKey} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors">
                Pilih Kunci API
            </button>
            <p className="mt-4 text-xs text-gray-500">
                Mungkin ada biaya yang terkait dengan penggunaan API. Lihat <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-400">dokumentasi penagihan</a> untuk detailnya.
            </p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 p-6 rounded-lg shadow-xl text-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-4" title="Kembali ke Pengaturan">
              <BackIcon className="w-6 h-6 text-gray-300" />
            </button>
            <h2 className="text-3xl font-bold">Animate Image with Veo</h2>
        </div>
        <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Kembali ke Home">
          <HomeIcon className="w-6 h-6 text-gray-300" />
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4"></div>
            <p className="text-lg font-semibold">{loadingMessage}</p>
            <p className="text-sm text-gray-400 mt-2">Proses ini bisa memakan waktu beberapa menit. Mohon jangan tutup jendela ini.</p>
          </div>
        ) : generatedVideoUrl ? (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4">Video Berhasil Dibuat!</h3>
            <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg"></video>
            <button onClick={() => { setImage(null); setImageBase64(null); setGeneratedVideoUrl(null); setPrompt(''); }} className="mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors">
              Buat Video Lain
            </button>
          </div>
        ) : (
          <>
            <div 
              className="w-full max-w-md h-64 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-center cursor-pointer hover:border-cyan-400 hover:bg-gray-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                <img src={URL.createObjectURL(image)} alt="Preview" className="max-w-full max-h-full rounded-lg object-contain"/>
              ) : (
                <div className="text-gray-400">
                  <UploadIcon className="w-12 h-12 mx-auto mb-2"/>
                  <p>Klik untuk mengunggah gambar</p>
                  <p className="text-xs">(JPG, PNG, WebP)</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg, image/png, image/webp" className="hidden" />

            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Masukkan prompt (opsional)... cth: 'kucing terbang di angkasa'"
              className="w-full max-w-md px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />

            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-300 mb-2">Aspek Rasio</label>
              <div className="flex space-x-4">
                  <button onClick={() => setAspectRatio('16:9')} className={`flex-1 p-2 rounded-lg transition-colors ${aspectRatio === '16:9' ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Landscape (16:9)</button>
                  <button onClick={() => setAspectRatio('9:16')} className={`flex-1 p-2 rounded-lg transition-colors ${aspectRatio === '9:16' ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Portrait (9:16)</button>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              onClick={generateVideo}
              disabled={!image}
              className="w-full max-w-md px-4 py-3 font-semibold bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <MovieIcon/> Buat Video
            </button>
          </>
        )}
      </div>
    </div>
  );
};
