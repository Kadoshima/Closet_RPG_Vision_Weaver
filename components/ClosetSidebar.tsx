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
        {/* Overlay */}
        {isOpen && (
             <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={onToggle}></div>
        )}

        <div className={`
            fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50
            transform transition-transform duration-300 ease-out overflow-y-auto
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
            <div className="p-8 pb-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-brand-black">My Wardrobe</h2>
                  <p className="text-xs text-brand-gray mt-1">Upload items to check compatibility</p>
                </div>
                <button onClick={onToggle} className="text-gray-400 hover:text-brand-black text-2xl">&times;</button>
            </div>

            <div className="p-8 flex flex-col gap-6">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-black transition-all group"
                >
                    {analyzing ? (
                        <div className="animate-spin h-6 w-6 border-2 border-brand-black border-t-transparent rounded-full"></div>
                    ) : (
                        <>
                            <span className="text-3xl mb-3 text-gray-300 group-hover:text-brand-black transition-colors">+</span>
                            <span className="text-sm font-medium text-brand-gray group-hover:text-brand-black">Add Item</span>
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
                        <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <img src={item.imageUrl} alt="Closet item" className="w-20 h-20 object-cover rounded-md" />
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-xs font-bold uppercase text-brand-black tracking-wider">{item.analysis.style}</div>
                                <div className="text-sm text-gray-800">{item.analysis.color} {item.analysis.material}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.analysis.season}</div>
                            </div>
                        </div>
                    ))}
                    {closetItems.length === 0 && !analyzing && (
                        <p className="text-center text-gray-400 text-sm py-8">
                            Your wardrobe is empty.<br/>Upload a photo to get started.
                        </p>
                    )}
                </div>
            </div>
        </div>
    </>
  );
};