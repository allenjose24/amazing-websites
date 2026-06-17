import React from 'react';
import { GooeyText } from './components/ui/gooey-text-morphing';
import { ArrowRight, Lock, Sparkles, Layers, Cpu } from 'lucide-react';

export default function LandingPage({ onLogin }) {
  // The categories of your amazing websites vault
  const vaultCategories = [
    "UI / UX Design",
    "Animations",
    "GitHub Repos",
    "AI Tools",
    "Typography",
    "Inspiration"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center overflow-hidden relative">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Main Hero Section */}
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-4xl w-full">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
          <Sparkles size={14} className="text-blue-400" />
          <span>The Ultimate Resource Vault</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-400 mb-4">
          Curated collection for
        </h1>

        {/* The Gooey Morphing Text Component */}
        <div className="h-[80px] md:h-[120px] w-full flex items-center justify-center mb-8">
          <GooeyText
            texts={vaultCategories}
            morphTime={1.2}
            cooldownTime={1.5}
            textClassName="text-white" /* Removed the broken CSS gradient! */
          />
        </div>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12">
          A highly-secured, private database of the internet's most amazing websites, tools, and front-end engineering resources.
        </p>

        {/* Call to Action Button */}
        <button 
          onClick={onLogin}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-transform active:scale-95"
        >
          <Lock size={18} />
          Access the Vault
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>

      </div>

      {/* Bottom Feature Bar */}
      <div className="absolute bottom-10 w-full flex justify-center gap-8 text-gray-500 text-sm font-medium border-t border-white/5 pt-8 z-10 px-4 flex-wrap">
        <span className="flex items-center gap-2"><Layers size={16}/> 150+ Resources</span>
        <span className="flex items-center gap-2"><Cpu size={16}/> Claude Automation</span>
        <span className="flex items-center gap-2"><Lock size={16}/> Zero-Trust Security</span>
      </div>
    </div>
  );
}