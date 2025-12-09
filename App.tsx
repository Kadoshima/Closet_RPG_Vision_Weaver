import React, { useState, useEffect, useRef } from 'react';
import { 
  FlowStep, SelectionState, CardOption, GeneratedItem, ClosetItem, GenerationStatus,
  RPGStats
} from './types';
import { 
  GENDER_OPTIONS, CATEGORY_OPTIONS, SUB_CATEGORY_OPTIONS, 
  STYLE_PRESETS, MOOD_OPTIONS 
} from './constants';
import { RPGCard } from './components/RPGCard';
import { ClosetSidebar } from './components/ClosetSidebar';
import { VoiceInput } from './components/VoiceInput';
import { generateItemImage, generateLoreAndStats, generateFromVoice } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [selection, setSelection] = useState<SelectionState>({});
  const [currentStep, setCurrentStep] = useState<FlowStep>(FlowStep.GENDER_SELECT);
  
  // Closet
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  
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

  const startGeneration = async () => {
    setCurrentStep(FlowStep.GENERATION);
    setGenerationStatus('generating');
    scrollToBottom();

    const basePrompt = `
      ${selection.gender?.label} ${selection.stylePreset?.label} ${selection.mood?.label} 
      ${selection.subCategory?.label || selection.category?.label}.
      Design style: ${selection.stylePreset?.description}.
      Atmosphere: ${selection.mood?.description}.
      High fantasy RPG item card art style but photorealistic texture.
    `;

    // Generate 4 variations
    const promises = Array(4).fill(0).map(async (_, i) => {
      // Small variation in seed/prompt if possible, but for now just same prompt 
      // relying on model temperature
      const imageUrl = await generateItemImage(`${basePrompt} variation ${i+1}`);
      const closetContext = closetItems.length > 0 
        ? `${closetItems[0].analysis.color} ${closetItems[0].analysis.style} ${closetItems[0].analysis.material} item`
        : undefined;

      const { stats, lore, compatibility } = await generateLoreAndStats(
        `${selection.subCategory?.label} ${selection.stylePreset?.label}`,
        closetContext
      );

      return {
        id: `gen-${Date.now()}-${i}`,
        imageUrl,
        stats,
        lore,
        compatibilityScore: compatibility
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
    
    const context = `A ${selection.gender?.label} ${selection.subCategory?.label}, style: ${selection.stylePreset?.label}`;
    const { modification } = await generateFromVoice(audioBase64, context);
    
    setRefinementPrompt(modification);
    
    // Regenerate image based on refinement
    const newImage = await generateItemImage(`${context}. Modification: ${modification}. Maintain consistency with previous design but apply change.`);
    
    setSelectedProduct(prev => prev ? {
        ...prev,
        imageUrl: newImage,
        lore: { ...prev.lore, flavorText: `Reforged with the essence of "${modification}". ${prev.lore.flavorText}` }
    } : null);
    
    setGenerationStatus('complete');
  };

  // --- Render Helpers ---

  const renderProgress = () => {
    const steps = [
      { key: 'gender', label: selection.gender?.label, active: true },
      { key: 'category', label: selection.category?.label, active: !!selection.gender },
      { key: 'subCategory', label: selection.subCategory?.label, active: !!selection.category },
      { key: 'style', label: selection.stylePreset?.label, active: !!selection.subCategory },
      { key: 'mood', label: selection.mood?.label, active: !!selection.stylePreset },
    ];

    return (
      <div className="fixed top-0 left-0 w-full z-30 bg-rpg-dark/90 backdrop-blur-md border-b border-slate-700 p-4 shadow-lg flex gap-2 overflow-x-auto scrollbar-hide">
        {steps.map((s, i) => (
           s.label ? (
             <div key={i} className="flex items-center">
                <span className="px-3 py-1 bg-rpg-panel border border-rpg-gold text-rpg-gold rounded-full text-xs font-mono uppercase whitespace-nowrap">
                  {s.label}
                </span>
                {i < steps.length - 1 && <span className="mx-2 text-slate-600">›</span>}
             </div>
           ) : null
        ))}
        <button 
          className="ml-auto bg-rpg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-amber-500 transition-colors"
          onClick={() => window.location.reload()}
        >
          Reset Quest
        </button>
      </div>
    );
  };

  const renderSection = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="min-h-[50vh] py-12 flex flex-col items-center animate-fade-in px-4">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-serif text-white mb-2 tracking-wide drop-shadow-lg">{title}</h2>
        <p className="text-slate-400 font-mono text-sm">{subtitle}</p>
        <div className="h-1 w-24 bg-rpg-accent mx-auto mt-4 rounded-full" />
      </div>
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-rpg-dark text-slate-200 pb-32 pt-20">
      {renderProgress()}
      
      {/* Sidebar */}
      <ClosetSidebar 
        isOpen={isClosetOpen} 
        onToggle={() => setIsClosetOpen(!isClosetOpen)}
        closetItems={closetItems}
        onItemAdd={(item) => setClosetItems([...closetItems, item])}
      />

      <div className="container mx-auto max-w-5xl">
        
        {/* Step 1: Gender */}
        {renderSection("Identify Target", "Who is this equipment for?", (
          <div className="grid grid-cols-3 gap-6">
            {GENDER_OPTIONS.map(opt => (
              <RPGCard 
                key={opt.id} 
                option={opt} 
                selected={selection.gender?.id === opt.id}
                onClick={() => handleSelect('gender', opt, FlowStep.CATEGORY_SELECT)}
              />
            ))}
          </div>
        ))}

        {/* Step 2: Category */}
        {currentStep !== FlowStep.GENDER_SELECT && renderSection("Select Class", "What type of gear do you need?", (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {CATEGORY_OPTIONS.map(opt => (
               <RPGCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.category?.id === opt.id}
                 onClick={() => handleSelect('category', opt, FlowStep.SUB_CATEGORY_SELECT)}
               />
             ))}
           </div>
        ))}

        {/* Step 3: Sub Category */}
        {(currentStep === FlowStep.SUB_CATEGORY_SELECT || selection.subCategory) && selection.category && renderSection("Refine Class", "Specific specialization", (
           <div className="grid grid-cols-3 gap-4">
             {SUB_CATEGORY_OPTIONS[selection.category.id]?.map(opt => (
               <RPGCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.subCategory?.id === opt.id}
                 onClick={() => handleSelect('subCategory', opt, FlowStep.STYLE_PRESET)}
               />
             ))}
           </div>
        ))}

        {/* Step 4: Style */}
        {(currentStep === FlowStep.STYLE_PRESET || selection.stylePreset) && renderSection("Choose Archetype", "Define the aesthetic form", (
           <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             {STYLE_PRESETS.map(opt => (
               <RPGCard 
                 key={opt.id} 
                 option={opt} 
                 selected={selection.stylePreset?.id === opt.id}
                 onClick={() => handleSelect('stylePreset', opt, FlowStep.MOOD_SELECT)}
                 compact
               />
             ))}
           </div>
        ))}

        {/* Step 5: Mood */}
        {(currentStep === FlowStep.MOOD_SELECT || selection.mood) && renderSection("Infuse Essence", "Select the atmospheric vibe", (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {MOOD_OPTIONS.map(opt => (
               <RPGCard 
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
          <div className="min-h-screen py-12 flex flex-col items-center">
            <h2 className="text-3xl font-serif text-rpg-magic mb-8 animate-pulse-slow">
              {generationStatus === 'generating' ? 'Forging Equipment...' : 'Forge Complete'}
            </h2>
            
            {generationStatus === 'generating' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[3/4] bg-slate-800 animate-pulse rounded border border-slate-600"></div>
                ))}
              </div>
            )}

            {generationStatus === 'complete' && !selectedProduct && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-4">
                {generatedOptions.map((item) => (
                  <div key={item.id} className="group relative">
                    <div 
                      onClick={() => handleProductSelect(item)}
                      className="cursor-pointer bg-slate-900 border-2 border-slate-600 hover:border-rpg-magic transition-all rounded overflow-hidden relative"
                    >
                      <img src={item.imageUrl} alt="Generated" className="w-full aspect-[3/4] object-cover" />
                      
                      {/* Stats Overlay */}
                      <div className="absolute bottom-0 left-0 w-full bg-black/80 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                        <div className="text-xs font-mono text-rpg-gold mb-1">{item.lore.title}</div>
                        {item.compatibilityScore !== undefined && (
                          <div className="text-xs text-green-400">Sync: {item.compatibilityScore}%</div>
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
          <div className="fixed inset-0 z-50 bg-rpg-dark/95 overflow-y-auto">
             <div className="max-w-6xl mx-auto p-4 md:p-12 flex flex-col md:flex-row gap-8">
               
               {/* Left: Image & Vibe */}
               <div className="flex-1">
                 <button 
                    onClick={() => setCurrentStep(FlowStep.GENERATION)}
                    className="mb-4 text-slate-400 hover:text-white flex items-center gap-2"
                 >
                   ← Back to Forge
                 </button>
                 <div className="border-4 border-double border-rpg-gold p-1 bg-black shadow-2xl relative">
                    <img src={selectedProduct.imageUrl} className="w-full h-auto" />
                    {refinementPrompt && (
                        <div className="absolute top-2 left-2 bg-rpg-magic/80 text-white text-xs px-2 py-1 rounded">
                            Mod: {refinementPrompt}
                        </div>
                    )}
                 </div>

                 {/* Vibe Sound Search */}
                 <div className="mt-8 bg-slate-800/50 p-6 rounded-lg border border-slate-600 text-center">
                    <h3 className="text-rpg-gold font-serif text-xl mb-2">Vibe Refinement</h3>
                    <p className="text-sm text-slate-400 mb-4">Speak an onomatopoeia or instruction to reshape the item.</p>
                    <VoiceInput 
                        isProcessing={generationStatus === 'generating'}
                        onAudioRecorded={handleVoiceRefinement}
                    />
                 </div>
               </div>

               {/* Right: Lore & Stats */}
               <div className="flex-1 space-y-8">
                 <div>
                   <h1 className="text-4xl font-serif font-bold text-white mb-2">{selectedProduct.lore.title}</h1>
                   <div className="flex items-center gap-2 mb-4">
                     <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs uppercase tracking-widest rounded">
                        Element: {selectedProduct.lore.element}
                     </span>
                     {selectedProduct.compatibilityScore !== undefined && (
                        <span className={`px-2 py-0.5 text-black text-xs font-bold uppercase tracking-widest rounded ${
                            selectedProduct.compatibilityScore > 70 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                            Closet Sync: {selectedProduct.compatibilityScore}%
                        </span>
                     )}
                   </div>
                   <p className="text-lg text-slate-300 italic font-serif leading-relaxed border-l-4 border-rpg-accent pl-4">
                     "{selectedProduct.lore.flavorText}"
                   </p>
                   <p className="mt-4 text-slate-400 text-sm">
                     {selectedProduct.lore.description}
                   </p>
                 </div>

                 {/* Stats Radar/Bars */}
                 <div className="bg-slate-800 p-6 rounded border border-slate-700">
                    <h3 className="text-rpg-gold font-mono uppercase text-sm mb-4 border-b border-slate-600 pb-2">Item Statistics</h3>
                    <div className="space-y-3">
                        {Object.entries(selectedProduct.stats).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-4">
                                <span className="w-24 text-right text-xs uppercase font-bold text-slate-400">{key}</span>
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-rpg-accent to-rpg-gold" 
                                        style={{ width: `${val}%` }}
                                    />
                                </div>
                                <span className="w-8 text-xs font-mono text-white">{val}</span>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Purchase / Order Actions */}
                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <button className="py-4 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white font-serif text-lg rounded transition-colors flex flex-col items-center">
                        <span>Find Similar</span>
                        <span className="text-xs text-slate-400 font-sans">Amazon / EC</span>
                    </button>
                    <button className="py-4 bg-rpg-gold hover:bg-amber-400 text-black font-serif font-bold text-lg rounded shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex flex-col items-center">
                        <span>Craft Custom</span>
                        <span className="text-xs font-sans opacity-70">Generate 3D & Specs</span>
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
