
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isTyping?: boolean;
}

export enum VoiceGender {
  Male = 'male',
  Female = 'female',
}

export interface Settings {
  voiceGender: VoiceGender;
}

export enum Page {
  Login,
  Chat,
  Settings,
  QRCode,
  VideoGenerator,
}