import React, { useRef, useState, useEffect } from 'react';
import { searchItemByImage, estimateBespokeCost } from '../services/geminiService';
import { SearchResult, BespokeQuote } from '../types';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({ isOpen, onClose, initialImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Bespoke State
  const [calculatingQuote, setCalculatingQuote] = useState(false);
  const [quote, setQuote] = useState<BespokeQuote | null>(null);
  const [orderSent, setOrderSent] = useState(false);

  // Helper to extract base64 from data URL or fetch from HTTP URL
  const getImageData = async (imgSrc: string): Promise<string | null> => {
    if (imgSrc.startsWith('data:')) {
      return imgSrc.split(',')[1];
    } else if (imgSrc.startsWith('http')) {
      try {
        const response = await fetch(imgSrc);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const res = reader.result as string;
                resolve(res.split(',')[1]);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to fetch image for search", e);
        return null;
      }
    }
    return null;
  };

  // Handle initialization and cleanup
  useEffect(() => {
    if (isOpen) {
      if (initialImage) {
        setSelectedImage(initialImage);
        // Reset previous states
        setResult(null);
        setQuote(null);
        setOrderSent(false);
        
        // Start search
        const run = async () => {
             const data = await getImageData(initialImage);
             if (data) {
                 performSearch(data);
             } else {
                 console.error("Could not process initial image");
             }
        };
        run();
      }
    } else {
      // Cleanup when closed
      stopCamera();
      reset();
    }
  }, [isOpen, initialImage]);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Full = canvas.toDataURL('image/jpeg');
        const base64Data = base64Full.split(',')[1];
        
        setSelectedImage(base64Full);
        stopCamera();
        performSearch(base64Data);
      }
    }
  };

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
    setQuote(null); // Reset quote on new search
    setOrderSent(false);
    try {
      const data = await searchItemByImage(base64Data);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetQuote = async () => {
      if (!selectedImage) return;
      setCalculatingQuote(true);
      try {
          const data = await getImageData(selectedImage);
          if (data) {
              const quoteData = await estimateBespokeCost(data);
              setQuote(quoteData);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setCalculatingQuote(false);
      }
  };

  const handleSendOrder = () => {
      setOrderSent(true);
      // Here you would typically connect to a payment/order backend
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    setQuote(null);
    setOrderSent(false);
    setIsCameraOpen(false);
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
             <span className="material-icons text-brand-black">photo_camera</span>
             <h2 className="text-xl font-serif font-bold text-brand-black">Visual Search</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-icons text-gray-500">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* Hidden Canvas for Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera View */}
          {isCameraOpen && !selectedImage && (
             <div className="relative bg-black rounded-lg overflow-hidden aspect-[3/4] md:aspect-video mb-6">
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 className="w-full h-full object-cover"
               />
               <div className="absolute bottom-6 left-0 w-full flex justify-center gap-4 z-20">
                 <button 
                   onClick={stopCamera}
                   className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all font-medium"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={capturePhoto}
                   className="bg-white text-brand-black px-6 py-3 rounded-full hover:bg-gray-100 transition-all font-bold flex items-center gap-2"
                 >
                   <span className="material-icons text-brand-black">camera</span>
                   Capture
                 </button>
               </div>
             </div>
          )}

          {/* Upload / Start View - Only show if no image selected */}
          {!selectedImage && !isCameraOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-black transition-all group"
                >
                    <span className="material-icons text-4xl text-gray-300 mb-3 group-hover:text-brand-black transition-colors">upload_file</span>
                    <p className="font-medium text-gray-600 group-hover:text-brand-black">Upload Photo</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                    />
                </div>

                <div 
                onClick={startCamera}
                className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-black transition-all group"
                >
                    <span className="material-icons text-4xl text-gray-300 mb-3 group-hover:text-brand-black transition-colors">photo_camera</span>
                    <p className="font-medium text-gray-600 group-hover:text-brand-black">Take Photo</p>
                </div>
            </div>
          )}

          {/* Search Results View */}
          {selectedImage && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Preview */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative group">
                  <img src={selectedImage} alt="Search target" className="w-full h-auto object-cover" />
                  {/* Only allow retake if not using an initial image passed from parent */}
                  {!initialImage && (
                    <button 
                        onClick={reset}
                        className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm hover:text-red-600 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Retake / Remove"
                    >
                        <span className="material-icons text-sm">refresh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Results List */}
              <div className="flex-1 space-y-4">
                {isSearching ? (
                  <div className="py-12 flex flex-col items-center text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-brand-black border-t-transparent rounded-full mb-4"></div>
                    <p className="text-sm font-medium text-brand-black">Analyzing style & material...</p>
                    <p className="text-xs text-brand-gray">Searching global retailers</p>
                  </div>
                ) : result ? (
                  <div className="animate-fade-in pb-20">
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                      <h3 className="text-xs font-bold uppercase text-brand-gray mb-2">AI Analysis</h3>
                      <p className="text-sm text-gray-800 leading-relaxed">{result.description}</p>
                    </div>

                    <h3 className="text-sm font-bold text-brand-black mb-3 flex items-center gap-2">
                      <span className="material-icons text-sm">shopping_bag</span>
                      Found Online
                    </h3>
                    
                    {result.links.length > 0 ? (
                      <div className="space-y-2 mb-8">
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
                      <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg mb-8">
                        No similar items found in stock.
                      </div>
                    )}

                    {/* BESPOKE SECTION */}
                    <div className="border-t border-gray-100 pt-8 mt-8">
                        <div className="bg-brand-black text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <span className="material-icons text-9xl">architecture</span>
                            </div>
                            <h3 className="text-xl font-serif font-bold mb-2 relative z-10">Can't find it? Make it.</h3>
                            <p className="text-sm text-gray-300 mb-6 max-w-xs relative z-10">
                                Our AI Meister can deconstruct this design and estimate the cost for a bespoke, made-to-order piece.
                            </p>
                            
                            {!quote && !calculatingQuote && (
                                <button 
                                    onClick={handleGetQuote}
                                    className="bg-white text-brand-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors w-full sm:w-auto relative z-10"
                                >
                                    Get Bespoke Quote
                                </button>
                            )}

                            {calculatingQuote && (
                                <div className="flex items-center gap-3 text-sm font-medium animate-pulse">
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Calculating fabric & labor...
                                </div>
                            )}

                            {quote && (
                                <div className="animate-fade-in mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Fabric</p>
                                            <p className="font-medium">{quote.fabricName}</p>
                                            <p className="text-xs text-gray-400">${quote.fabricCost}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Labor</p>
                                            <p className="font-medium">{quote.laborHours} hours</p>
                                            <p className="text-xs text-gray-400">${quote.laborCost}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Timeline</p>
                                            <p className="font-medium">{quote.timeline}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase">Total Estimate</p>
                                            <p className="text-xl font-bold text-green-400">${quote.totalCost}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-300 italic mb-4">"{quote.comments}"</p>
                                    
                                    {!orderSent ? (
                                        <button 
                                            onClick={handleSendOrder}
                                            className="w-full bg-white text-brand-black py-2 rounded font-bold text-sm hover:bg-gray-200 transition-colors"
                                        >
                                            Request Order to Atelier
                                        </button>
                                    ) : (
                                        <div className="bg-green-500/20 text-green-300 p-2 rounded text-center text-sm font-bold border border-green-500/30">
                                            Request Sent! An atelier will contact you.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
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