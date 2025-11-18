
import React, { useState, Suspense, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Settings, VoiceGender, Page } from './types';
import { LoginScreen } from './components/LoginScreen';

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@5.4.394/build/pdf.worker.min.js`;

// Lazy load komponen yang berat untuk mencegah crash saat startup
const ChatWindow = React.lazy(() => import('./components/ChatWindow').then(module => ({ default: module.ChatWindow })));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel').then(module => ({ default: module.SettingsPanel })));
const QRCodeGenerator = React.lazy(() => import('./components/QRCodeGenerator').then(module => ({ default: module.QRCodeGenerator })));
const VideoGenerator = React.lazy(() => import('./components/VideoGenerator').then(module => ({ default: module.VideoGenerator })));

// Komponen loading sederhana untuk fallback Suspense
const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-cyan-400"></div>
    </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Chat);
  const [settings, setSettings] = useState<Settings>({
    voiceGender: VoiceGender.Male,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [destinationPage, setDestinationPage] = useState<Page | null>(null);

  // PDF related state lifted to App component
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string[]>([]);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);

  // Load PDF data from localStorage on initial app load
  useEffect(() => {
    try {
      const savedPdfText = localStorage.getItem('pdfText');
      const savedPdfNameJSON = localStorage.getItem('pdfName');

      if (savedPdfText && savedPdfNameJSON) {
        setPdfText(savedPdfText);
        setPdfName(JSON.parse(savedPdfNameJSON));
      }
    } catch (error) {
        console.error("Gagal memuat data PDF dari local storage:", error);
        // Hapus data yang rusak jika parsing gagal
        localStorage.removeItem('pdfText');
        localStorage.removeItem('pdfName');
    }
  }, []);
  
  const handlePdfUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsPdfProcessing(true);
    const newFileNames = Array.from(files).map(f => f.name);
    setPdfName(newFileNames);
    
    try {
      const fileReadPromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
            try {
              const pdf = await pdfjsLib.getDocument(typedArray).promise;
              let fullText = `--- MULAI DOKUMEN: ${file.name} ---\n\n`;
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
              }
              fullText += `\n\n--- AKHIR DOKUMEN: ${file.name} ---`;
              resolve(fullText);
            } catch (error) {
              console.error(`Error parsing ${file.name}:`, error);
              reject(`Gagal memproses file: ${file.name}`);
            }
          };
          reader.onerror = (error) => reject(error);
          reader.readAsArrayBuffer(file);
        });
      });

      const texts = await Promise.all(fileReadPromises);
      const newPdfText = texts.join('\n\n');
      setPdfText(newPdfText);

      // Save to localStorage after successful processing
      localStorage.setItem('pdfText', newPdfText);
      localStorage.setItem('pdfName', JSON.stringify(newFileNames));

    } catch (error) {
      console.error('Error processing PDF files:', error);
      setPdfName([]);
      setPdfText(null);
      // Clear localStorage on error as well
      localStorage.removeItem('pdfText');
      localStorage.removeItem('pdfName');
    } finally {
      setIsPdfProcessing(false);
    }
  };

  const handlePdfClear = () => {
    setPdfText(null);
    setPdfName([]);
    // Also clear from localStorage
    localStorage.removeItem('pdfText');
    localStorage.removeItem('pdfName');
  };


  const handleShowSettings = () => {
    if (isAuthenticated) {
      setCurrentPage(Page.Settings);
    } else {
      setDestinationPage(Page.Settings);
      setCurrentPage(Page.Login);
    }
  };
  
  const handleGoHome = () => {
    setCurrentPage(Page.Chat);
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Navigate to the originally intended page, or default to Settings
    setCurrentPage(destinationPage || Page.Settings);
    setDestinationPage(null);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case Page.Login:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
      case Page.Settings:
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto h-screen">
            <SettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              onGoHome={handleGoHome}
              onShowQRCode={() => setCurrentPage(Page.QRCode)}
              onShowVideoGenerator={() => setCurrentPage(Page.VideoGenerator)}
              pdfName={pdfName}
              isPdfProcessing={isPdfProcessing}
              onPdfUpload={handlePdfUpload}
              onPdfClear={handlePdfClear}
            />
          </div>
        );
      case Page.QRCode:
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto h-screen">
            <QRCodeGenerator 
              onBack={() => setCurrentPage(Page.Settings)} 
              onGoHome={handleGoHome}
            />
          </div>
        );
      case Page.VideoGenerator:
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto h-screen">
            <VideoGenerator 
              onBack={() => setCurrentPage(Page.Settings)}
              onGoHome={handleGoHome}
            />
          </div>
        );
      case Page.Chat:
      default:
        return (
          <ChatWindow
            settings={settings}
            onShowSettings={handleShowSettings}
            pdfText={pdfText}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen">
        <Suspense fallback={<LoadingSpinner />}>
            {renderCurrentPage()}
        </Suspense>
    </div>
  );
};

export default App;
