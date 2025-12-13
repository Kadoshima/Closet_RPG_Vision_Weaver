import React, { useState, useRef } from 'react';
import { 
  FlowStep, SelectionState, CardOption, GeneratedLook, GenerationStatus
} from './types';
import { 
  TARGET_OPTIONS, CATEGORY_OPTIONS, STYLE_PRESETS, MOOD_OPTIONS 
} from './constants';
import { SelectionCard } from './components/SelectionCard';
import { ClosetSidebar } from './components/ClosetSidebar';
import { VoiceInput } from './components/VoiceInput';
import { VisualSearchModal } from './components/VisualSearchModal';
import { generateFashionImage, generateLookDetails, generateFromVoice } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [currentStep, setCurrentStep] = useState<FlowStep>(FlowStep.TARGET_SELECT);
  const [selection, setSelection] = useState<SelectionState>({});
  
  // Closet
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  // We can keep closetItems in a real app, simplified here
  const [closetItems, setClosetItems] = useState<any[]>([]);

  // Generation
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generatedLooks, setGeneratedLooks] = useState<GeneratedLook[]>([]);
  const [selectedLook, setSelectedLook] = useState<GeneratedLook | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');

  // Tools
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [visualSearchInitialImage, setVisualSearchInitialImage] = useState<string | null>(null);
  const [visualSearchMode, setVisualSearchMode] = useState<'search' | 'bespoke'>('search');

  const endOfListRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const scrollToBottom = () => {
    setTimeout(() => {
        endOfListRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelect = (key: keyof SelectionState, value: CardOption, nextStep: FlowStep) => {
    setSelection(prev => ({ ...prev, [key]: value }));
    
    // Auto-advance if not the final trigger
    if (nextStep !== FlowStep.GENERATION) {
        setCurrentStep(nextStep);
        scrollToBottom();
    } else {
        // Just update state, the button will trigger generation
        setCurrentStep(FlowStep.MOOD_SELECT); 
        scrollToBottom();
    }
  };

  const handleMoodSelect = (option: CardOption) => {
      setSelection(prev => ({ ...prev, mood: option }));
      startGeneration(option);
  };

  const startGeneration = async (moodOption?: CardOption) => {
    const finalMood = moodOption || selection.mood;
    if (!selection.target || !selection.category || !selection.stylePreset || !finalMood) return;

    setCurrentStep(FlowStep.GENERATION);
    setGenerationStatus('generating');
    scrollToBottom();

    // Construct prompt for text-to-image
    const target = selection.target.label;
    const category = selection.category.label;
    const style = selection.stylePreset.label;
    const mood = finalMood.label;
    
    // Generate 3 variations
    try {
        const promises = Array(3).fill(0).map(async (_, i) => {
            const variation = i === 0 ? "minimalist interpretation" : i === 1 ? "bold and textured" : "modern layered look";
            
            // Rephrase to prioritize the item description over the "atmosphere"
            let itemDescription = `${target} ${category}`;
            // Expand generic categories
            if (category.toLowerCase() === 'bottoms') itemDescription = `${target} trousers, pants, or skirt`;
            if (category.toLowerCase() === 'tops') itemDescription = `${target} top, shirt, or knitwear`;
            if (category.toLowerCase() === 'outerwear') itemDescription = `${target} coat or jacket`;

            const imagePrompt = `Full body fashion shot. A model wearing ${itemDescription} in ${style} style. The setting suggests ${mood}. ${variation}. Ensure the ${category} is clearly visible and is the main focus.`;
            
            const textContext = `${target} ${category}, ${style} style, ${mood} vibe. ${variation}.`;

            const imageUrl = await generateFashionImage(imagePrompt);
            const { specs, info } = await generateLookDetails(textContext);
            
            return {
                id: `look-${Date.now()}-${i}`,
                imageUrl,
                specs,
                info
            } as GeneratedLook;
        });

        const results = await Promise.all(promises);
        setGeneratedLooks(results);
        setGenerationStatus('complete');
    } catch (e) {
        console.error(e);
        setGenerationStatus('error');
    }
  };

  const handleVoiceRefinement = async (audioBase64: string) => {
    if (!selectedLook) return;
    setGenerationStatus('generating');
    
    const context = `Current design: ${selectedLook.info.name}. ${selectedLook.info.description}`;
    const { modification } = await generateFromVoice(audioBase64, context);
    setRefinementPrompt(modification);
    
    const prompt = `A fashion model wearing ${selectedLook.info.name}. ${modification}. Keep the general style.`;
    
    try {
        const newImage = await generateFashionImage(prompt);
        
        setSelectedLook(prev => prev ? {
            ...prev,
            imageUrl: newImage,
            info: { 
                ...prev.info, 
                stylingTips: `Updated based on: "${modification}". ${prev.info.stylingTips}` 
            }
        } : null);
    } catch (e) {
        alert("Failed to refine design.");
    } finally {
        setGenerationStatus('complete');
    }
  };

  const handleVisualSearch = (image: string, mode: 'search' | 'bespoke') => {
    setVisualSearchInitialImage(image);
    setVisualSearchMode(mode);
    setIsSearchOpen(true);
  };

  const handleLookSelect = (look: GeneratedLook) => {
      setSelectedLook(look);
      setCurrentStep(FlowStep.DETAIL);
      scrollToBottom();
  };

  // --- Render Sections ---

  const renderHeader = () => (
    <header className="fixed top-0 left-0 w-full z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 py-4 transition-all">
      <div className="container mx-auto max-w-6xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-serif font-bold text-brand-black tracking-tight">VISION WEAVER</h1>
        </div>
        <div className="flex items-center gap-4">
           {/* Progress Indicator */}
           <div className="hidden md:flex gap-2 text-xs font-medium text-gray-400">
              <span className={currentStep === FlowStep.TARGET_SELECT ? 'text-brand-black' : ''}>Target</span>/
              <span className={currentStep === FlowStep.CATEGORY_SELECT ? 'text-brand-black' : ''}>Category</span>/
              <span className={currentStep === FlowStep.STYLE_SELECT ? 'text-brand-black' : ''}>Style</span>/
              <span className={currentStep === FlowStep.MOOD_SELECT ? 'text-brand-black' : ''}>Mood</span>
           </div>

           <button 
             className="text-xs font-medium text-brand-black hover:opacity-70 ml-4"
             onClick={() => window.location.reload()}
           >
             Start Over
           </button>
           
           <div className="w-px h-4 bg-gray-300 mx-2"></div>

           <button 
                onClick={() => setIsClosetOpen(true)}
                className="text-brand-black hover:text-gray-600 transition-colors flex items-center gap-2"
            >
                <span className="material-icons">checkroom</span>
                <span className="hidden sm:inline text-xs font-bold">WARDROBE</span>
            </button>
        </div>
      </div>
    </header>
  );

  const renderSection = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="py-12 flex flex-col items-center animate-fade-in px-4 border-b border-gray-50 last:border-0">
      <div className="mb-10 text-center max-w-lg">
        <h2 className="text-3xl font-serif text-brand-black mb-3">{title}</h2>
        <p className="text-brand-gray font-light">{subtitle}</p>
      </div>
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-brand-black pb-32 pt-20">
      {renderHeader()}
      
      <ClosetSidebar 
        isOpen={isClosetOpen} 
        onToggle={() => setIsClosetOpen(!isClosetOpen)}
        closetItems={closetItems}
        onItemAdd={(item) => setClosetItems([...closetItems, item])}
      />

      <VisualSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialImage={visualSearchInitialImage}
        initialMode={visualSearchMode}
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
                 onClick={() => handleSelect('category', opt, FlowStep.STYLE_SELECT)}
               />
             ))}
           </div>
        ))}

        {/* Step 3: Style */}
        {(currentStep === FlowStep.STYLE_SELECT || currentStep === FlowStep.MOOD_SELECT || selection.stylePreset) && selection.category && renderSection("Aesthetic", "Define the visual language.", (
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

        {/* Step 4: Mood */}
        {(currentStep === FlowStep.MOOD_SELECT || selection.mood) && selection.stylePreset && renderSection("Context", "Where will this be worn?", (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {MOOD_OPTIONS.map(opt => (
               <SelectionCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.mood?.id === opt.id}
                 onClick={() => handleMoodSelect(opt)}
               />
             ))}
           </div>
        ))}

        {/* Step 5: Generation */}
        {(currentStep === FlowStep.GENERATION || currentStep === FlowStep.DETAIL) && (
          <div className="min-h-screen py-16 flex flex-col items-center border-t border-gray-100 mt-8">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-serif mb-2">
                    {generationStatus === 'generating' ? 'Creating Collection...' : 'Collection Ready'}
                </h2>
                <p className="text-brand-gray">AI is synthesizing trends and materials.</p>
             </div>
            
            {generationStatus === 'generating' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4 max-w-6xl">
                {[1,2,3].map(i => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4 max-w-6xl">
                {generatedLooks.map((look) => (
                  <div key={look.id} className="group relative">
                    <div 
                      onClick={() => handleLookSelect(look)}
                      className="cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-[3/4] overflow-hidden relative">
                          <img src={look.imageUrl} alt="Generated" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      </div>
                      <div className="p-6">
                          <h3 className="font-serif text-xl text-brand-black truncate">{look.info.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{look.info.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {currentStep === FlowStep.DETAIL && selectedLook && (
           <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-fade-in">
              <div className="max-w-7xl mx-auto p-4 md:p-12 flex flex-col lg:flex-row gap-16">
                  
                  <button 
                    onClick={() => setCurrentStep(FlowStep.GENERATION)}
                    className="absolute top-6 left-6 z-50 bg-white/90 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="material-icons text-brand-black">arrow_back</span>
                  </button>

                  {/* Left: Image */}
                  <div className="w-full lg:w-1/2">
                      <div className="sticky top-8">
                         <div className="rounded-xl overflow-hidden shadow-sm bg-gray-50">
                             <img src={selectedLook.imageUrl} alt="Detail" className="w-full h-auto object-cover" />
                         </div>
                         
                         {/* Voice Controls */}
                         <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="flex items-center justify-between mb-4">
                                 <div>
                                     <h3 className="font-serif text-lg font-bold">AI Design Assistant</h3>
                                     <p className="text-sm text-gray-500">Refine this look with your voice.</p>
                                 </div>
                                 <VoiceInput 
                                    isProcessing={generationStatus === 'generating'}
                                    onAudioRecorded={handleVoiceRefinement}
                                 />
                             </div>
                             {refinementPrompt && (
                                 <p className="text-xs text-gray-400 italic">Last edit: "{refinementPrompt}"</p>
                             )}
                         </div>
                      </div>
                  </div>

                  {/* Right: Info */}
                  <div className="w-full lg:w-1/2 pt-4 lg:pt-12 pb-20">
                       <span className="text-sm tracking-widest uppercase text-brand-gray block mb-4">{selectedLook.info.materials}</span>
                       <h1 className="text-5xl font-serif font-bold text-brand-black mb-6 leading-tight">{selectedLook.info.name}</h1>
                       <p className="text-lg text-gray-600 mb-10 leading-relaxed font-light">
                           {selectedLook.info.description}
                       </p>

                       <div className="grid grid-cols-2 gap-x-8 gap-y-12 mb-12">
                           <div>
                               <h4 className="font-bold text-sm uppercase text-brand-black mb-3 border-b border-gray-100 pb-2">Styling Notes</h4>
                               <p className="text-sm text-gray-600 leading-relaxed">{selectedLook.info.stylingTips}</p>
                           </div>
                           <div>
                               <h4 className="font-bold text-sm uppercase text-brand-black mb-3 border-b border-gray-100 pb-2">Design Specs</h4>
                               <ul className="space-y-3">
                                   <li className="flex justify-between text-sm">
                                       <span className="text-gray-500">Versatility</span>
                                       <span className="font-bold">{selectedLook.specs.versatility}/100</span>
                                   </li>
                                   <li className="flex justify-between text-sm">
                                       <span className="text-gray-500">Trend Factor</span>
                                       <span className="font-bold">{selectedLook.specs.trend}/100</span>
                                   </li>
                                   <li className="flex justify-between text-sm">
                                       <span className="text-gray-500">Comfort</span>
                                       <span className="font-bold">{selectedLook.specs.comfort}/100</span>
                                   </li>
                               </ul>
                           </div>
                       </div>

                       <div className="space-y-4">
                           <button 
                               onClick={() => handleVisualSearch(selectedLook.imageUrl, 'search')}
                               className="w-full py-4 bg-brand-black text-white text-center font-bold rounded hover:bg-gray-800 transition-colors shadow-xl flex items-center justify-center gap-3"
                           >
                               <span className="material-icons">shopping_search</span>
                               Find Similar Items Online
                           </button>
                           
                           <button 
                               onClick={() => handleVisualSearch(selectedLook.imageUrl, 'bespoke')}
                               className="w-full py-4 bg-white border border-brand-black text-brand-black text-center font-bold rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                           >
                               <span className="material-icons">architecture</span>
                               Request Bespoke Quote
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