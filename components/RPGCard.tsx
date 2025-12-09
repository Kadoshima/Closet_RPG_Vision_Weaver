import React from 'react';
import { CardOption } from '../types';

interface RPGCardProps {
  option: CardOption;
  selected?: boolean;
  onClick: () => void;
  compact?: boolean;
}

export const RPGCard: React.FC<RPGCardProps> = ({ option, selected, onClick, compact }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer group transition-all duration-300
        ${selected ? 'scale-105 z-10' : 'hover:scale-105 hover:z-10 opacity-80 hover:opacity-100'}
        ${compact ? 'w-full h-24 flex flex-row items-center gap-4' : 'w-full aspect-[3/4] flex flex-col'}
        bg-slate-900 border-2
        ${selected ? 'border-rpg-gold shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'border-slate-600 hover:border-rpg-accent'}
      `}
    >
      {/* Corner Ornaments */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white opacity-50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white opacity-50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white opacity-50" />

      {/* Image */}
      <div className={`
        relative overflow-hidden
        ${compact ? 'w-24 h-full border-r-2 border-slate-700' : 'w-full h-2/3 border-b-2 border-slate-700'}
      `}>
        <img 
          src={option.image} 
          alt={option.label} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {selected && (
          <div className="absolute inset-0 bg-rpg-gold/10 flex items-center justify-center">
            <span className="font-serif font-bold text-rpg-gold text-lg tracking-widest drop-shadow-md bg-black/50 px-2">EQUIPPED</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-3 flex flex-col justify-center ${compact ? 'flex-1' : 'h-1/3'}`}>
        <h3 className={`font-serif font-bold text-rpg-text ${compact ? 'text-lg' : 'text-xl'} group-hover:text-rpg-accent transition-colors`}>
          {option.label}
        </h3>
        {option.description && (
          <p className="font-mono text-xs text-slate-400 mt-1 line-clamp-2">
            {option.description}
          </p>
        )}
      </div>
    </div>
  );
};
