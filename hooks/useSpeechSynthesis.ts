
import { useState, useEffect, useCallback } from 'react';
import { VoiceGender } from '../types';

/**
 * Memproses teks untuk membersihkan karakter yang tidak diinginkan dan memperluas singkatan
 * umum sebelum diucapkan oleh text-to-speech engine.
 * @param text - Teks input mentah dari AI.
 * @returns Teks yang telah dibersihkan dan siap untuk diucapkan.
 */
const preprocessTextForSpeech = (text: string): string => {
  let processedText = text;

  // 1. Hapus karakter Markdown umum (seperti *, _, #) yang mungkin dibaca secara harfiah.
  // Ini membantu membersihkan output AI yang mungkin mengandung format dasar.
  processedText = processedText.replace(/[*_#]/g, '');

  // 2. Perluas singkatan umum dalam Bahasa Indonesia untuk pelafalan yang lebih alami.
  // Menggunakan word boundaries (\b) untuk menghindari penggantian bagian dari kata lain (misal, 'ha' di dalam 'bahagia').
  const abbreviations: { [key: string]: string } = {
    'ha': 'hektar',
    'kg': 'kilogram',
    'km': 'kilometer',
    'cm': 'sentimeter',
    'm²': 'meter persegi',
    'dll': 'dan lain-lain',
    'dsb': 'dan sebagainya',
    'Yth': 'Yang Terhormat',
    'rp': 'rupiah',
    'dr': 'dokter',
    'prof': 'profesor'
  };

  for (const abbr in abbreviations) {
    // Regex untuk mencocokkan seluruh kata, tidak case-sensitive, dan menangani titik opsional di akhir (mis. 'dll.')
    const regex = new RegExp(`\\b${abbr}\\.?\\b`, 'gi');
    processedText = processedText.replace(regex, abbreviations[abbr]);
  }
  
  return processedText;
};


export const useSpeechSynthesis = (gender: VoiceGender) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Effect ini secara aman mengisi daftar suara yang tersedia.
  useEffect(() => {
    // Pengaman untuk server-side rendering atau browser yang tidak didukung
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn("Speech synthesis is not supported by this browser.");
      return;
    }
    const synth = window.speechSynthesis;

    const getVoices = () => {
      const voiceList = synth.getVoices();
      if (voiceList.length > 0) {
        setVoices(voiceList);
      }
    };

    // Panggil sekali untuk mencoba mendapatkan suara
    getVoices();
    // Event 'onvoiceschanged' adalah cara paling andal untuk mendapatkan daftar suara, karena seringkali dimuat secara asynchronous.
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = getVoices;
    }

    // Fungsi cleanup untuk menghapus event listener saat komponen dilepas
    return () => {
      if (synth) {
        synth.onvoiceschanged = null;
      }
    };
  }, []); // Array dependensi kosong memastikan efek ini hanya berjalan sekali saat mount.

  const speak = useCallback((text: string) => {
    // Pengaman jika API tidak tersedia atau tidak ada teks untuk diucapkan
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return;
    }

    const synth = window.speechSynthesis;
    
    // Jika ada suara yang sedang diputar, batalkan untuk memulai yang baru.
    // Ini mencegah antrian yang tidak diinginkan.
    if (synth.speaking) {
      synth.cancel();
    }

    // Proses teks sebelum mengirimkannya ke speech engine
    const cleanText = preprocessTextForSpeech(text);

    const utterThis = new SpeechSynthesisUtterance(cleanText);
    // Secara eksplisit atur bahasa ke 'id-ID' untuk pelafalan terbaik.
    utterThis.lang = 'id-ID'; 
    
    utterThis.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
    };

    // Cari suara Bahasa Indonesia yang paling sesuai
    const indonesianVoices = voices.filter(voice => voice.lang === 'id-ID');
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (indonesianVoices.length > 0) {
        if (gender === VoiceGender.Male) {
            // Prioritaskan nama yang mengandung kata 'male' atau 'laki'
            selectedVoice = indonesianVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('laki'));
        } else {
            selectedVoice = indonesianVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('perempuan'));
        }
        
        // Jika suara spesifik gender tidak ditemukan, gunakan suara Indonesia pertama yang tersedia
        if (!selectedVoice) {
           selectedVoice = indonesianVoices[0];
        }
    }
    
    if (selectedVoice) {
      utterThis.voice = selectedVoice;
    } else {
      console.warn("No Indonesian voice found. Using default voice.");
    }
    
    utterThis.pitch = 1;
    utterThis.rate = 0.9;
    synth.speak(utterThis);
  }, [voices, gender]); // Dependensi pada 'voices' dan 'gender' agar fungsi diperbarui jika berubah

  return { speak };
};
