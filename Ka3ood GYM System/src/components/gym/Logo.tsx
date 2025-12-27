import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "text-5xl" }) => {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <h1 
        className="font-black text-yellow-400 tracking-tighter uppercase italic leading-none text-center" 
        style={{ 
          fontFamily: 'Arial, sans-serif', 
          transform: 'skewX(-10deg)',
          textShadow: '0.08em 0.08em 0px #000' 
        }}
      >
        KA3OOD GYM
      </h1>
    </div>
  );
};

export default Logo;
