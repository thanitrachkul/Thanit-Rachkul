import React from 'react';

interface AvatarProps {
  isTalking: boolean;
}

const IDLE_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JpZGJ1cm54ajdxdjR0cHRuamtycHZ2a3d0M3dhaGZka3FhaG9zcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/m9pQk2nL8USs77v5j8/giphy.gif';
const TALKING_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenN4MHFzMGY5dDVsc3drZnpod2p4a3h0bmNnM3M2eHR0aDFkM2RkciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bcAseE2Yf59jG/giphy.gif';


const Avatar: React.FC<AvatarProps> = ({ isTalking }) => {
  return (
    <div className="flex justify-center items-center h-40 w-40">
       <img 
        src={isTalking ? TALKING_GIF : IDLE_GIF} 
        alt="AI Robot Avatar" 
        className="w-full h-full object-contain transition-transform duration-300 ease-in-out"
        style={{ transform: isTalking ? 'scale(1.1)' : 'scale(1)' }}
      />
    </div>
  );
};

export default Avatar;