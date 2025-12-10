import React, { useRef, useState } from 'react';
import { searchItemByImage } from '../services/geminiService';
import { SearchResult } from '../types';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Full = reader.result as string;
      const base64Data = base64Full.split(',')[1];
      setSelectedImage(base64Full);
      performSearch(base64Data);
    };
  };

  const performSearch = async (base64Data: string) => {
    setIsSearching(true);
    setResult(null);
    try {
      const data = await searchItemByImage(base64Data);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
             <span className="material-icons text-brand-black">center_focus_strong</span>
             <h2 className="text-xl font-serif font-bold text-brand-black">Visual Search</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Upload Area */}
          {!selectedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-black transition-all group h-64"
            >
              <span className="material-icons text-5xl text-gray-300 mb-4 group-hover:text-brand-black transition-colors">add_a_photo</span>
              <p className="font-medium text-gray-600 group-hover:text-brand-black">Upload a photo of a coat, bag, or item</p>
              <p className="text-xs text-gray-400 mt-2">Find similar items online</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Search View */}
          {selectedImage && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Preview */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative group">
                  <img src={selectedImage} alt="Search target" className="w-full h-auto object-cover" />
                  <button 
                    onClick={reset}
                    className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm hover:text-red-600 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 space-y-4">
                {isSearching ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-black border-t-transparent rounded-full mb-4"></div>
                    <p className="text-sm font-medium text-brand-black">Analyzing style & material...</p>
                    <p className="text-xs text-brand-gray">Searching global retailers</p>
                  </div>
                ) : result ? (
                  <div className="animate-fade-in">
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                      <h3 className="text-xs font-bold uppercase text-brand-gray mb-2">AI Analysis</h3>
                      <p className="text-sm text-gray-800 leading-relaxed">{result.description}</p>
                    </div>

                    <h3 className="text-sm font-bold text-brand-black mb-3 flex items-center gap-2">
                      <span className="material-icons text-sm">shopping_bag</span>
                      Found Online
                    </h3>
                    
                    {result.links.length > 0 ? (
                      <div className="space-y-2">
                        {result.links.map((link, idx) => (
                          <a 
                            key={idx}
                            href={link.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-black hover:bg-gray-50 transition-all group"
                          >
                             <div className="bg-white p-2 rounded border border-gray-100 text-gray-400 group-hover:text-brand-black">
                               <span className="material-icons text-sm">link</span>
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium text-brand-black truncate group-hover:underline">
                                 {link.title}
                               </p>
                               <p className="text-xs text-gray-400 truncate">{link.uri}</p>
                             </div>
                             <span className="material-icons text-gray-300 text-sm">open_in_new</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                        No direct shopping links found. <br/>
                        <a 
                           href={`https://www.google.com/search?q=${encodeURIComponent(result.description)}&tbm=shop`}
                           target="_blank"
                           rel="noreferrer"
                           className="text-brand-black underline mt-2 inline-block"
                        >
                          Try manual Google Shopping search
                        </a>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
