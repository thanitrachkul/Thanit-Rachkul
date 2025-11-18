import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ChatMode from './components/ChatMode';
import VoiceMode from './components/VoiceMode';

const App: React.FC = () => {
  const [mode, setMode] = useState<'home' | 'chat' | 'voice'>('home');

  const renderContent = () => {
    switch (mode) {
      case 'chat':
        return <ChatMode onBack={() => setMode('home')} />;
      case 'voice':
        return <VoiceMode onBack={() => setMode('home')} />;
      case 'home':
      default:
        return <HomePage onSetMode={setMode} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="p-4 text-center border-b border-gray-200 flex-shrink-0 bg-white">
        <h1 className="text-4xl font-bold">
          <span className="text-orange-500">RightCode</span>
          <span className="text-green-600">Buddy</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">สอบถามปัญหา ปรึกษากับบัดดี้คู่ใจได้ทุกเวลากับ RightCode Buddy เล้ย!</p>
      </header>
      
      <main className="flex-1 flex flex-col items-center p-4 overflow-hidden">
        {renderContent()}
      </main>

      <footer className="w-full flex-shrink-0 p-3 bg-white border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          พัฒนาโดย: นายธนิท ธนพัตนิรัชกุล ครูผู้ช่วย โรงเรียนกาฬสินธุ์ปัญญานุกูล จังหวัดกาฬสินธุ์
        </p>
      </footer>
    </div>
  );
};

export default App;