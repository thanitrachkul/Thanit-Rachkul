import React from 'react';

interface HomePageProps {
  onSetMode: (mode: 'chat' | 'voice') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSetMode }) => {
  return (
    <div className="w-full max-w-4xl h-full flex flex-col justify-center items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
        {/* Chat Mode Card */}
        <div 
          className="bg-white p-8 rounded-lg shadow-md hover:shadow-green-500/30 border border-gray-200 hover:border-green-400 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
          onClick={() => onSetMode('chat')}
        >
          <i className="fas fa-comments fa-3x text-green-500 mb-4"></i>
          <h2 className="text-2xl font-bold mb-2">Chat Mode</h2>
          <p className="text-gray-500">พิมพ์คุย, ค้นหาข้อมูล, และสร้างภาพกับ AI</p>
        </div>

        {/* Voice Mode Card */}
        <div 
          className="bg-white p-8 rounded-lg shadow-md hover:shadow-orange-500/30 border border-gray-200 hover:border-orange-400 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
          onClick={() => onSetMode('voice')}
        >
          <i className="fas fa-headset fa-3x text-orange-500 mb-4"></i>
          <h2 className="text-2xl font-bold mb-2">Voice Mode</h2>
          <p className="text-gray-500">สนทนาโต้ตอบด้วยเสียงแบบเรียลไทม์</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;