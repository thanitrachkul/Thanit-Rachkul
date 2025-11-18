import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';

interface ChatModeProps {
  onBack: () => void;
}

// FIX: Defined types for the Web Speech API to resolve the 'Cannot find name SpeechRecognition' error.
// This is necessary because these types are not standard across all browsers and are not included in default TypeScript typings.
interface SpeechRecognitionEvent extends Event {
  readonly results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  // FIX: Add the missing 'onstart' property to the SpeechRecognition interface to fix a TypeScript compilation error.
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URI prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

const ChatMode: React.FC<ChatModeProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechRecognitionSupported(!!SpeechRecognition);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleToggleRecording = () => {
    if (!speechRecognitionSupported) {
      alert("ขออภัยค่ะ เบราว์เซอร์ของคุณไม่รองรับการพิมพ์ด้วยเสียง");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'th-TH';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        setInput((prev) => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('กรุณาอนุญาตให้แอปเข้าถึงไมโครโฟนของคุณ');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.start();
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || isLoading) return;

    setIsLoading(true);

    const userMessage: ChatMessageType = { 
        role: 'user', 
        text: input,
        ...(imagePreview && { imageUrl: imagePreview }),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Store and then clear state
    const currentInput = input;
    const currentImageFile = imageFile;
    setInput('');
    handleRemoveImage();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      let modelResponse: ChatMessageType;
      
      const safetyInstruction = {
        systemInstruction: 'You are "น้อง RightCode Buddy", a friendly and helpful AI assistant from Thailand. Your name is "น้อง RightCode Buddy". You must ALWAYS refer to yourself as "น้อง RightCode Buddy", not Gemini or any other AI model. You are capable of searching the web and generating images directly in this chat. Respond in Thai. Ensure all content is child-friendly, avoiding any sensitive, violent, or adult topics.',
      };

      if (currentImageFile) {
        const base64Image = await fileToBase64(currentImageFile);
        const imagePart = {
            inlineData: { mimeType: currentImageFile.type, data: base64Image },
        };
        const textPart = { text: currentInput };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [textPart, imagePart] },
          config: safetyInstruction,
        });

        const text = response.text;
        modelResponse = { role: 'model', text };

      } else {
        const imageKeywords = ['รูป', 'วาด', 'สร้างภาพ', 'image', 'draw', 'generate image'];
        const wantsImage = imageKeywords.some(kw => currentInput.toLowerCase().includes(kw));

        if (wantsImage) {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: currentInput }] },
            config: { 
                responseModalities: [Modality.IMAGE],
                ...safetyInstruction 
            },
          });
          const part = response.candidates?.[0]?.content?.parts?.[0];
          if (part?.inlineData) {
            const base64Image = part.inlineData.data;
            modelResponse = { role: 'model', imageUrl: `data:${part.inlineData.mimeType};base64,${base64Image}` };
          } else {
              modelResponse = { role: 'model', text: 'ขออภัยค่ะ ไม่สามารถสร้างภาพได้ในขณะนี้' };
          }
        } else {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: currentInput,
            config: { 
                tools: [{ googleSearch: {} }],
                ...safetyInstruction
            },
          });
          const text = response.text;
          const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const sources = groundingChunks
              ?.filter((chunk: any) => chunk.web)
              .map((chunk: any) => ({
                  title: chunk.web.title,
                  uri: chunk.web.uri,
              })) || [];

          modelResponse = { role: 'model', text, sources };
        }
      }
      setMessages((prev) => [...prev, modelResponse]);
    } catch (error) {
      console.error('Error contacting AI:', error);
      const errorMessage: ChatMessageType = { role: 'model', text: 'ขออภัยค่ะ เกิดข้อผิดพลาดบางอย่าง' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl h-full flex flex-col relative bg-white rounded-lg shadow-lg border border-gray-200">
       <button 
        onClick={onBack} 
        className="absolute top-2 left-2 text-gray-500 hover:text-gray-800 transition-colors z-10 p-2"
        aria-label="Back to home"
        >
         <i className="fas fa-arrow-left mr-2"></i>กลับ
      </button>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 pt-14">
        {messages.length === 0 && (
            <div className="flex flex-col justify-center items-center h-full text-center text-gray-500">
                <i className="fas fa-rocket fa-2x mb-4 text-green-400"></i>
                <p>เริ่มต้นการสนทนาได้เลย!</p>
                <p className="text-sm">ลองถามคำถาม, อัปโหลดรูป, หรือสั่ง "วาดรูปแมวอวกาศ"</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && <ChatMessage message={{ role: 'model', text: 'กำลังพิมพ์...' }} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        {imagePreview && (
            <div className="mb-2 relative w-24 h-24 p-1 border rounded-md">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded"/>
                <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        )}
        <div className="flex items-center bg-gray-100 rounded-full p-2 border border-gray-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-green-600 transition-colors mx-2"
            aria-label="Attach image"
          >
            <i className="fas fa-paperclip"></i>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="พิมพ์ข้อความหรือแนบรูป..."
            className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none px-2"
            disabled={isLoading}
          />
          <button
            onClick={handleToggleRecording}
            disabled={!speechRecognitionSupported}
            className={`transition-colors mx-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-green-600'} disabled:text-gray-300 disabled:cursor-not-allowed`}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            <i className="fas fa-microphone"></i>
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !imageFile)}
            className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-600 transition-colors shadow-sm"
            aria-label="Send message"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;