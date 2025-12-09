import React, { useRef, useState } from 'react';
import { ClosetItem } from '../types';
import { analyzeClosetImage } from '../services/geminiService';

interface ClosetSidebarProps {
  closetItems: ClosetItem[];
  onItemAdd: (item: ClosetItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ClosetSidebar: React.FC<ClosetSidebarProps> = ({ closetItems, onItemAdd, isOpen, onToggle }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const imageUrl = reader.result as string;

      try {
        const analysis = await analyzeClosetImage(base64);
        const newItem: ClosetItem = {
          id: Date.now().toString(),
          imageUrl,
          analysis
        };
        onItemAdd(newItem);
      } catch (error) {
        console.error("Failed to analyze closet item", error);
      } finally {
        setAnalyzing(false);
      }
    };
  };

  return (
    <>
        {/* Toggle Button (Visible when closed) */}
        {!isOpen && (
            <button 
                onClick={onToggle}
                className="fixed top-4 right-4 z-50 bg-rpg-panel border-2 border-rpg-gold text-rpg-gold p-2 rounded-full shadow-lg hover:bg-slate-700 transition-all"
            >
                <span className="text-xl">👕</span>
            </button>
        )}

        <div className={`
            fixed top-0 right-0 h-full w-80 bg-rpg-panel border-l-4 border-slate-700 shadow-2xl z-40
            transform transition-transform duration-300 overflow-y-auto
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
            <div className="p-4 border-b-2 border-slate-600 flex justify-between items-center">
                <h2 className="text-xl font-serif text-rpg-gold font-bold">My Closet Sync</h2>
                <button onClick={onToggle} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 flex flex-col gap-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                >
                    {analyzing ? (
                        <div className="animate-spin h-8 w-8 border-4 border-rpg-accent border-t-transparent rounded-full"></div>
                    ) : (
                        <>
                            <span className="text-4xl mb-2">+</span>
                            <span className="text-sm font-mono text-slate-300">Sync Equipment</span>
                        </>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                    />
                </div>

                <div className="space-y-4">
                    {closetItems.map((item) => (
                        <div key={item.id} className="bg-slate-900 p-2 rounded border border-slate-600 flex gap-3">
                            <img src={item.imageUrl} alt="Closet item" className="w-16 h-16 object-cover rounded bg-slate-800" />
                            <div className="flex-1">
                                <div className="text-xs font-mono text-rpg-accent uppercase">{item.analysis.style}</div>
                                <div className="text-sm font-serif text-white">{item.analysis.color} {item.analysis.material}</div>
                                <div className="text-xs text-slate-400 mt-1">Season: {item.analysis.season}</div>
                            </div>
                        </div>
                    ))}
                    {closetItems.length === 0 && !analyzing && (
                        <p className="text-center text-slate-500 font-serif italic p-4">
                            No equipment synced. Upload your outfit to check compatibility.
                        </p>
                    )}
                </div>
            </div>
        </div>
    </>
  );
};
