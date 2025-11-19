import React, { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';
import ChatBubble from './ChatBubble';
import { Transcript } from '../types';

interface VoiceModeProps {
  onBack: () => void;
}

/*
  A simplified voice chat implementation that relies on the Web Speech API
  for speech recognition and the browser's SpeechSynthesis for audio output.
  When the user taps the microphone button, we capture a single utterance,
  send it to our backend chat API (the same endpoint used in ChatMode),
  and speak the AI's response aloud.  Conversation history is maintained
  in the `transcripts` state.  This approach avoids exposing the API key
  to the client and does not rely on experimental streaming APIs.
*/
const VoiceMode: React.FC<VoiceModeProps> = ({ onBack }) => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMessage, setStatusMessage] = useState('กดปุ่มไมโครโฟนเพื่อเริ่มคุย');
  const recognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendToBackend = async (prompt: string) => {
    // Append the user's transcript
    setTranscripts((prev) => [...prev, { speaker: 'user', text: prompt }]);

    try {
      setStatusMessage('กำลังตอบกลับ...');
      const payload: any = { prompt };
      const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      const reply = data.text || 'ขออภัยค่ะ ไม่พบคำตอบ';
      // Append AI response
      setTranscripts((prev) => [...prev, { speaker: 'ai', text: reply }]);
      speak(reply);
      setStatusMessage('กดปุ่มไมโครโฟนเพื่อเริ่มคุย');
    } catch (err) {
      console.error('Voice chat error:', err);
      setTranscripts((prev) => [...prev, { speaker: 'ai', text: 'ขออภัยค่ะ เกิดข้อผิดพลาดบางอย่าง' }]);
      setStatusMessage('ขออภัยค่ะ เกิดข้อผิดพลาดบางอย่าง');
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('ขออภัยค่ะ เบราว์เซอร์ของคุณไม่รองรับการพิมพ์ด้วยเสียง');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'th-TH';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setIsRecording(true);
      setStatusMessage('กำลังฟัง...');
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      recognition.stop();
      setIsRecording(false);
      if (transcript) {
        sendToBackend(transcript);
      } else {
        setStatusMessage('ไม่ได้ยินอะไรเลย ลองอีกครั้ง');
      }
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setStatusMessage('เกิดข้อผิดพลาดในการรับเสียง');
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.start();
  };

  return (
    <div className="w-full max-w-4xl h-full flex flex-col relative">
      <button
        onClick={onBack}
        className="absolute top-0 left-0 text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Back to home"
      >
        <i className="fas fa-arrow-left mr-2"></i>กลับ
      </button>

      <div className="flex-shrink-0 mb-4 pt-8">
        <Avatar isTalking={isRecording} />
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        aria-live="polite"
      >
        {transcripts.map((transcript: Transcript, index: number) => (
          <ChatBubble key={index} transcript={transcript} />
        ))}
        {transcripts.length === 0 && !isRecording && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">{statusMessage}</p>
          </div>
        )}
      </div>

      <div className="w-full flex-shrink-0 pt-4">
        <div className="flex justify-center items-center">
          <button
            onClick={startRecording}
            className={`bg-green-500 rounded-full w-16 h-16 flex items-center justify-center text-white shadow-md hover:bg-green-600 transition-colors ${isRecording ? 'animate-pulse' : ''}`}
            aria-label={isRecording ? 'กำลังบันทึกเสียง' : 'เริ่มพูด'}
          >
            <i className="fas fa-microphone"></i>
          </button>
        </div>
        {isRecording && <p className="text-center text-xs text-gray-500 mt-2 animate-pulse">{statusMessage}</p>}
      </div>
    </div>
  );
};

export default VoiceMode;