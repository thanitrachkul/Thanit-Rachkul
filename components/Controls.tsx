import React from 'react';

interface ControlsProps {
  isSessionActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ isSessionActive, onStart, onStop }) => {
  const text = isSessionActive ? 'เสร็จสิ้น' : 'กดเพื่อพูด';
  
  return (
    <div className="flex justify-center items-center">
      <button
        onClick={isSessionActive ? onStop : onStart}
        className={`w-40 h-16 rounded-lg flex items-center justify-center text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg hover:shadow-xl ${
          isSessionActive 
          ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 animate-pulse' 
          : 'bg-green-500 hover:bg-green-600 focus:ring-green-300'
        }`}
        aria-label={isSessionActive ? 'Stop conversation' : 'Start conversation'}
      >
        <i className={`fas ${isSessionActive ? 'fa-stop' : 'fa-microphone'} fa-lg mr-3`}></i>
        <span className="font-semibold">{text}</span>
      </button>
    </div>
  );
};

export default Controls;