
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Settings } from '../types';
import { getAiResponse } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { MicIcon, SendIcon, SettingsIcon } from './icons';

interface ChatWindowProps {
  settings: Settings;
  onShowSettings: () => void;
  pdfText: string | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ settings, onShowSettings, pdfText }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();
  const { speak } = useSpeechSynthesis(settings.voiceGender);

  // Effect to manage chat state based on PDF context
  useEffect(() => {
    // If a PDF is loaded and there are no messages, show a welcome message.
    if (pdfText && messages.length === 0) {
      setMessages([{ id: Date.now().toString(), sender: 'ai', text: `Dokumen berhasil dipelajari. Silakan ajukan pertanyaan.` }]);
    } 
    // If the PDF is cleared, also clear the chat history for a clean slate.
    else if (!pdfText && messages.length > 0) {
      setMessages([]);
    }
  }, [pdfText]);


  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (input.trim() === '' || isProcessing || !pdfText) return;
    
    stopListening();
    const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    const typingIndicator: ChatMessage = { id: 'typing', text: '', sender: 'ai', isTyping: true };
    setMessages(prev => [...prev, typingIndicator]);

    const responseText = await getAiResponse(pdfText, userMessage.text);
    
    const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: responseText, sender: 'ai' };
    setMessages(prev => prev.filter(m => m.id !== 'typing'));
    setMessages(prev => [...prev, aiMessage]);
    
    speak(responseText);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
        <div className="flex items-center min-w-0">
            <i className="fas fa-robot text-3xl text-cyan-400 mr-3"></i>
            <div className="min-w-0">
                <h1 className="text-xl font-bold">Asisten AI Cerdas</h1>
                <div className="flex items-center text-xs text-gray-400">
                    {pdfText ? (
                        <span>Status: Siap Menjawab</span>
                    ) : (
                        "Menunggu dokumen dari admin..."
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={onShowSettings} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><SettingsIcon /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {!pdfText && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <img src="https://picsum.photos/seed/ai-avatar/150/150" alt="AI Avatar" className="rounded-full mb-4 border-4 border-gray-700" />
            <h2 className="text-2xl font-semibold text-white">Selamat Datang!</h2>
            <p className="max-w-md mt-2">
              Belum ada dokumen yang dipelajari. Silakan minta admin untuk mengunggah file PDF melalui panel pengaturan.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <i className="fas fa-robot text-xl text-cyan-400 mb-2"></i>}
            <div className={`max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-cyan-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
              {msg.isTyping ? (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-gray-800">
        <div className="flex items-center bg-gray-700 rounded-lg px-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              !pdfText ? "Unggah PDF di panel admin untuk memulai" : 
              isListening ? "Mendengarkan..." : 
              "Ketik atau ucapkan pertanyaan..."
            }
            className="flex-1 bg-transparent p-3 focus:outline-none disabled:cursor-not-allowed"
            disabled={!pdfText || isProcessing}
          />
          {hasRecognitionSupport && (
            <button 
              onClick={isListening ? stopListening : startListening} 
              className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-600'}`}
              disabled={!pdfText || isProcessing}
            >
              <MicIcon />
            </button>
          )}
          <button onClick={handleSend} disabled={!input.trim() || isProcessing} className="p-2 rounded-full hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed">
            <SendIcon />
          </button>
        </div>
      </footer>
    </div>
  );
};
