export interface Transcript {
  speaker: 'user' | 'ai';
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  sources?: { title: string; uri: string }[];
}
