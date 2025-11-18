
import React, { useState } from 'react';
// FIX: Changed default import to a named import `QRCodeSVG` as the default export is not a valid JSX component.
import { QRCodeSVG } from 'qrcode.react';
import { BackIcon, HomeIcon } from './icons';

interface QRCodeGeneratorProps {
  onBack: () => void;
  onGoHome: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ onBack, onGoHome }) => {
  const [text, setText] = useState(window.location.href);

  const handlePrint = () => {
    const qrCodeElement = document.getElementById('qrcode-printable-area');
    if (qrCodeElement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print QR Code</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; } h1 { margin-bottom: 20px; font-size: 16px; word-break: break-all; max-width: 90vw; }</style>');
            printWindow.document.write('</head><body>');
            
            if (text) {
              printWindow.document.write(`<h1>${text}</h1>`);
            }
            printWindow.document.write(qrCodeElement.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            
            printWindow.onafterprint = () => {
                printWindow.close();
            };
            
            printWindow.focus();
            printWindow.print();
        }
    }
  };


  return (
    <div className="flex flex-col h-full bg-gray-800 p-6 rounded-lg shadow-xl text-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-4" title="Kembali ke Pengaturan">
              <BackIcon className="w-6 h-6 text-gray-300" />
            </button>
            <h2 className="text-3xl font-bold">QR Code Generator</h2>
        </div>
         <button onClick={onGoHome} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Kembali ke Home">
          <HomeIcon className="w-6 h-6 text-gray-300" />
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-inner">
             <div id="qrcode-printable-area">
                {text ? (
                    // FIX: Used the correctly imported `QRCodeSVG` component and removed the now-redundant `renderAs` prop.
                    <QRCodeSVG value={text} size={256} level="H" includeMargin={true} />
                ) : (
                    <div className="w-64 h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                      <span className="text-gray-500">QR Code akan muncul di sini</span>
                    </div>
                )}
             </div>
        </div>
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Masukkan teks atau URL..."
          className="w-full max-w-md px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
        />
        
        <button
          onClick={handlePrint}
          disabled={!text}
          className="w-full max-w-md px-4 py-3 font-semibold bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Print QR Code
        </button>
      </div>
    </div>
  );
};
