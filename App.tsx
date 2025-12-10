import React, { useState, useRef } from 'react';
import { 
  FlowStep, SelectionState, CardOption, GeneratedItem, ClosetItem, GenerationStatus,
  ProductSpecs
} from './types';
import { 
  TARGET_OPTIONS, CATEGORY_OPTIONS, SUB_CATEGORY_OPTIONS, 
  STYLE_PRESETS, MOOD_OPTIONS 
} from './constants';
import { SelectionCard } from './components/SelectionCard';
import { ClosetSidebar } from './components/ClosetSidebar';
import { VoiceInput } from './components/VoiceInput';
import { VisualSearchModal } from './components/VisualSearchModal';
import { generateItemImage, generateProductDetails, generateFromVoice } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [selection, setSelection] = useState<SelectionState>({});
  const [currentStep, setCurrentStep] = useState<FlowStep>(FlowStep.TARGET_SELECT);
  
  // Closet
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);

  // Visual Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [visualSearchInitialImage, setVisualSearchInitialImage] = useState<string | null>(null);
  
  // Generation
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generatedOptions, setGeneratedOptions] = useState<GeneratedItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<GeneratedItem | null>(null);
  
  // Refinement
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  
  // Refs for auto-scrolling
  const endOfListRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const scrollToBottom = () => {
    setTimeout(() => {
        endOfListRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelect = (key: keyof SelectionState, value: CardOption, nextStep: FlowStep) => {
    setSelection(prev => ({ ...prev, [key]: value }));
    setCurrentStep(nextStep);
    scrollToBottom();
  };

  const handleVisualSearch = (image?: string) => {
    setVisualSearchInitialImage(image || null);
    setIsSearchOpen(true);
  };

  const startGeneration = async () => {
    setCurrentStep(FlowStep.GENERATION);
    setGenerationStatus('generating');
    scrollToBottom();

    const basePrompt = `
      ${selection.target?.label} ${selection.stylePreset?.label} ${selection.mood?.label} 
      ${selection.subCategory?.label || selection.category?.label}.
      Style: ${selection.stylePreset?.description}.
      Context: ${selection.mood?.description}.
      Design concept: Contemporary fashion, high quality material.
    `;

    // Generate 4 variations
    const promises = Array(4).fill(0).map(async (_, i) => {
      const imageUrl = await generateItemImage(`${basePrompt} variation ${i+1}`);
      const closetContext = closetItems.length > 0 
        ? `${closetItems[0].analysis.color} ${closetItems[0].analysis.style} ${closetItems[0].analysis.material} item`
        : undefined;

      const { specs, info, matchScore } = await generateProductDetails(
        `${selection.subCategory?.label} ${selection.stylePreset?.label}`,
        closetContext
      );

      return {
        id: `gen-${Date.now()}-${i}`,
        imageUrl,
        specs,
        info,
        matchScore
      } as GeneratedItem;
    });

    const items = await Promise.all(promises);
    setGeneratedOptions(items);
    setGenerationStatus('complete');
  };

  const handleProductSelect = (item: GeneratedItem) => {
    setSelectedProduct(item);
    setCurrentStep(FlowStep.DETAIL);
    scrollToBottom();
  };

  const handleVoiceRefinement = async (audioBase64: string) => {
    if (!selectedProduct) return;
    setGenerationStatus('generating');
    
    const context = `A ${selection.target?.label} ${selection.subCategory?.label}, style: ${selection.stylePreset?.label}`;
    const { modification } = await generateFromVoice(audioBase64, context);
    
    setRefinementPrompt(modification);
    
    // Regenerate image based on refinement
    const newImage = await generateItemImage(`${context}. Modification: ${modification}. Apply subtle design changes while keeping the core identity.`);
    
    setSelectedProduct(prev => prev ? {
        ...prev,
        imageUrl: newImage,
        info: { ...prev.info, stylingTips: `Updated with: "${modification}". ${prev.info.stylingTips}` }
    } : null);
    
    setGenerationStatus('complete');
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="fixed top-0 left-0 w-full z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
      <div className="container mx-auto max-w-6xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-serif font-bold text-brand-black tracking-tight">VISION WEAVER</h1>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-brand-gray">STUDIO</span>
        </div>
        <div className="flex items-center gap-4">
           {/* Steps indicator */}
           <div className="hidden md:flex gap-1 text-xs font-medium text-gray-400">
              <span className={selection.target ? 'text-brand-black' : ''}>Target</span>
              <span>/</span>
              <span className={selection.category ? 'text-brand-black' : ''}>Category</span>
              <span>/</span>
              <span className={selection.stylePreset ? 'text-brand-black' : ''}>Style</span>
           </div>
           
           <button 
             className="text-xs underline text-brand-gray hover:text-brand-black transition-colors"
             onClick={() => window.location.reload()}
           >
             Start Over
           </button>
           
           <div className="h-6 w-px bg-gray-200 mx-2"></div>

           <button 
                onClick={() => handleVisualSearch()}
                className="text-brand-black hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                title="Visual Search"
            >
                <span className="material-icons">photo_camera</span>
            </button>
           
           <button 
                onClick={() => setIsClosetOpen(true)}
                className="bg-brand-black text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
            >
                <span className="material-icons text-base">checkroom</span>
                <span className="hidden sm:inline">Wardrobe</span>
            </button>
        </div>
      </div>
    </header>
  );

  const renderSection = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="min-h-[60vh] py-20 flex flex-col items-center animate-fade-in px-4 border-b border-gray-50 last:border-0">
      <div className="mb-12 text-center max-w-lg">
        <h2 className="text-4xl font-serif text-brand-black mb-3">{title}</h2>
        <p className="text-brand-gray font-light text-lg">{subtitle}</p>
      </div>
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-brand-black pb-32 pt-16">
      {renderHeader()}
      
      <ClosetSidebar 
        isOpen={isClosetOpen} 
        onToggle={() => setIsClosetOpen(!isClosetOpen)}
        closetItems={closetItems}
        onItemAdd={(item) => setClosetItems([...closetItems, item])}
      />

      <VisualSearchModal 
        isOpen={isSearchOpen}
        onClose={() => {
            setIsSearchOpen(false);
            setVisualSearchInitialImage(null);
        }}
        initialImage={visualSearchInitialImage}
      />

      <div className="container mx-auto max-w-6xl">
        
        {/* Step 1: Target */}
        {renderSection("Design Target", "Who are we designing for today?", (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TARGET_OPTIONS.map(opt => (
              <SelectionCard 
                key={opt.id} 
                option={opt} 
                selected={selection.target?.id === opt.id}
                onClick={() => handleSelect('target', opt, FlowStep.CATEGORY_SELECT)}
              />
            ))}
          </div>
        ))}

        {/* Step 2: Category */}
        {currentStep !== FlowStep.TARGET_SELECT && renderSection("Category", "Select the type of apparel.", (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {CATEGORY_OPTIONS.map(opt => (
               <SelectionCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.category?.id === opt.id}
                 onClick={() => handleSelect('category', opt, FlowStep.SUB_CATEGORY_SELECT)}
               />
             ))}
           </div>
        ))}

        {/* Step 3: Sub Category */}
        {(currentStep === FlowStep.SUB_CATEGORY_SELECT || selection.subCategory) && selection.category && renderSection("Specifics", `Refine your ${selection.category.label.toLowerCase()} choice.`, (
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
             {SUB_CATEGORY_OPTIONS[selection.category.id]?.map(opt => (
               <SelectionCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.subCategory?.id === opt.id}
                 onClick={() => handleSelect('subCategory', opt, FlowStep.STYLE_PRESET)}
               />
             ))}
           </div>
        ))}

        {/* Step 4: Style */}
        {(currentStep === FlowStep.STYLE_PRESET || selection.stylePreset) && renderSection("Aesthetic", "Define the visual language.", (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {STYLE_PRESETS.map(opt => (
               <SelectionCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.stylePreset?.id === opt.id}
                 onClick={() => handleSelect('stylePreset', opt, FlowStep.MOOD_SELECT)}
               />
             ))}
           </div>
        ))}

        {/* Step 5: Mood */}
        {(currentStep === FlowStep.MOOD_SELECT || selection.mood) && renderSection("Context", "Where will this be worn?", (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {MOOD_OPTIONS.map(opt => (
               <SelectionCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.mood?.id === opt.id}
                 onClick={() => {
                   setSelection(prev => ({ ...prev, mood: opt }));
                   startGeneration();
                 }}
               />
             ))}
           </div>
        ))}

        {/* Step 6: Generation */}
        {(currentStep === FlowStep.GENERATION || currentStep === FlowStep.DETAIL) && (
          <div className="min-h-screen py-16 flex flex-col items-center">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-serif mb-2">
                    {generationStatus === 'generating' ? 'Creating Designs...' : 'Collection Ready'}
                </h2>
                <p className="text-brand-gray">AI is synthesizing trends and materials.</p>
             </div>
            
            {generationStatus === 'generating' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full px-4 max-w-6xl">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-lg"></div>
                ))}
              </div>
            )}

            {generationStatus === 'complete' && !selectedProduct && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full px-4 max-w-6xl">
                {generatedOptions.map((item) => (
                  <div key={item.id} className="group relative">
                    <div 
                      onClick={() => handleProductSelect(item)}
                      className="cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-[3/4] overflow-hidden">
                          <img src={item.imageUrl} alt="Generated" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4">
                          <h3 className="font-sans font-medium text-brand-black truncate">{item.info.name}</h3>
                          {item.matchScore !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    {item.matchScore}% Match
                                </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 7: Detail View */}
        {currentStep === FlowStep.DETAIL && selectedProduct && (
          <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
             <div className="max-w-7xl mx-auto p-4 md:p-12 flex flex-col lg:flex-row gap-16 animate-fade-in">
               
               {/* Close / Back */}
               <button 
                  onClick={() => setCurrentStep(FlowStep.GENERATION)}
                  className="absolute top-6 left-6 z-50 bg-white/90 p-2 rounded-full shadow-lg hover:bg-gray-100"
               >
                 <span className="material-icons">arrow_back</span>
               </button>

               {/* Left: Images */}
               <div className="flex-1 lg:max-w-2xl">
                 <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
                    <img src={selectedProduct.imageUrl} className="w-full h-auto object-cover" />
                 </div>
                 
                 {/* Voice Refinement */}
                 <div className="mt-8 flex flex-col items-center p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-serif text-lg mb-2">AI Designer Assistant</h4>
                    <p className="text-sm text-brand-gray text-center mb-4 max-w-xs">
                        "Too dark", "Make it cleaner", "More casual". <br/>Speak to refine the design instantly.
                    </p>
                    <VoiceInput 
                        isProcessing={generationStatus === 'generating'}
                        onAudioRecorded={handleVoiceRefinement}
                    />
                    {refinementPrompt && (
                        <p className="text-xs text-brand-black mt-2 bg-white px-3 py-1 rounded border border-gray-200">
                            Last edit: "{refinementPrompt}"
                        </p>
                    )}
                 </div>
               </div>

               {/* Right: Info */}
               <div className="flex-1 pt-4">
                 <div className="mb-8 pb-8 border-b border-gray-100">
                    <span className="text-sm text-brand-gray uppercase tracking-widest">{selectedProduct.info.materials}</span>
                    <h1 className="text-4xl font-serif font-bold text-brand-black mt-2 mb-4">{selectedProduct.info.name}</h1>
                    <p className="text-lg text-gray-600 leading-relaxed font-light">
                        {selectedProduct.info.description}
                    </p>
                    {selectedProduct.matchScore !== undefined && (
                        <div className="mt-6 inline-flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                             <span className="material-icons text-brand-black">checkroom</span>
                             <span className="text-sm font-medium">Matches your wardrobe by <span className="text-brand-black font-bold">{selectedProduct.matchScore}%</span></span>
                        </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12">
                     <div>
                         <h3 className="font-bold text-sm uppercase text-brand-black mb-3">Styling Tips</h3>
                         <p className="text-sm text-gray-600 leading-relaxed">{selectedProduct.info.stylingTips}</p>
                     </div>
                     <div>
                         <h3 className="font-bold text-sm uppercase text-brand-black mb-3">Product Specs</h3>
                         <ul className="space-y-2 text-sm text-gray-600">
                             <li className="flex justify-between">
                                 <span>Versatility</span>
                                 <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2">
                                     <div className="h-full bg-brand-black rounded-full" style={{width: `${selectedProduct.specs.versatility}%`}}></div>
                                 </div>
                             </li>
                             <li className="flex justify-between">
                                 <span>Comfort</span>
                                 <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2">
                                     <div className="h-full bg-brand-black rounded-full" style={{width: `${selectedProduct.specs.comfort}%`}}></div>
                                 </div>
                             </li>
                             <li className="flex justify-between">
                                 <span>Trend</span>
                                 <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2">
                                     <div className="h-full bg-brand-black rounded-full" style={{width: `${selectedProduct.specs.trend}%`}}></div>
                                 </div>
                             </li>
                         </ul>
                     </div>
                 </div>

                 {/* Actions */}
                 <div className="space-y-4">
                    <button 
                        onClick={() => handleVisualSearch(selectedProduct.imageUrl)}
                        className="block w-full py-4 bg-brand-black text-white text-center font-medium rounded hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                         <span className="material-icons text-base">shopping_search</span>
                         Find Similar Items Online
                    </button>
                    <button className="block w-full py-4 bg-white border border-brand-black text-brand-black text-center font-medium rounded hover:bg-gray-50 transition-colors">
                        Save to Collection
                    </button>
                 </div>

               </div>
             </div>
          </div>
        )}

        <div ref={endOfListRef} />
      </div>
    </div>
  );
};

export default App;