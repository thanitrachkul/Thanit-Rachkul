import React, { useRef, useEffect } from 'react';
import Avatar from './Avatar';
import Controls from './Controls';
import ChatBubble from './ChatBubble';
import useGeminiLive from '../hooks/useGeminiLive';
import { Transcript } from '../types';

interface VoiceModeProps {
  onBack: () => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onBack }) => {
  const {
    transcripts,
    isSessionActive,
    isAITalking,
    statusMessage,
    startSession,
    stopSession,
  } = useGeminiLive();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

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
        <Avatar isTalking={isAITalking} />
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        aria-live="polite"
      >
        {transcripts.map((transcript: Transcript, index: number) => (
          <ChatBubble key={index} transcript={transcript} />
        ))}
         {transcripts.length === 0 && !isSessionActive && (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">{statusMessage}</p>
            </div>
        )}
      </div>
      
      <div className="w-full flex-shrink-0 pt-4">
        <Controls
            isSessionActive={isSessionActive}
            onStart={startSession}
            onStop={stopSession}
        />
        {isSessionActive && <p className="text-center text-xs text-gray-500 mt-2 animate-pulse">{statusMessage}</p>}
      </div>
    </div>
  );
};

export default VoiceMode;