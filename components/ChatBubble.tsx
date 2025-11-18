import React from 'react';
import { Transcript } from '../types';

interface ChatBubbleProps {
  transcript: Transcript;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ transcript }) => {
  const { speaker, text } = transcript;
  const isUser = speaker === 'user';

  const bubbleClasses = isUser
    ? 'bg-orange-500 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';
  
  const containerClasses = isUser ? 'flex justify-end' : 'flex justify-start';
  const labelText = isUser ? 'คุณพูดว่า' : 'RightCode Buddy ตอบว่า';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <p className="text-xs text-gray-500 px-2 mb-1">{labelText}</p>
      <div className={containerClasses}>
        <div
          className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md transition-all duration-300 ease-in-out transform scale-95 opacity-0 animate-fade-in-up ${bubbleClasses}`}
        >
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
  );
};

// Add keyframes for animation in a style tag for simplicity, as we can't use a separate CSS file.
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in-up {
  from {
    transform: translateY(10px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}
`;
document.head.appendChild(style);


export default ChatBubble;