import React from 'react';
import { CardOption } from '../types';

interface SelectionCardProps {
  option: CardOption;
  selected?: boolean;
  onClick: () => void;
  compact?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({ option, selected, onClick, compact }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer group transition-all duration-300
        ${compact ? 'h-20 flex items-center gap-4' : 'flex flex-col'}
        ${selected ? '' : 'opacity-90 hover:opacity-100'}
      `}
    >
      {/* Image container */}
      <div className={`
        relative overflow-hidden bg-gray-100
        ${compact ? 'w-20 h-20 rounded-md' : 'w-full aspect-[3/4] rounded-lg'}
        ${selected ? 'ring-2 ring-brand-black ring-offset-2' : ''}
      `}>
        <img 
          src={option.image} 
          alt={option.label} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {selected && !compact && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <span className="bg-white/90 text-brand-black px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-sm">Selected</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`mt-3 ${compact ? 'flex-1' : ''}`}>
        <h3 className={`font-sans font-medium text-brand-black ${compact ? 'text-base' : 'text-lg'}`}>
          {option.label}
        </h3>
        {option.description && (
          <p className="text-sm text-brand-gray mt-0.5 leading-tight">
            {option.description}
          </p>
        )}
      </div>
    </div>
  );
};
