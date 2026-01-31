
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TabType, HistoryItem } from './types.ts';
import { SINHALA_MAPPINGS } from './constants.tsx';
import { smartTransliterate, fixGrammar } from './services/geminiService.ts';
import { transliterate } from './utils/sinhalaEngine.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.EDITOR);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('helatype_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [language, setLanguage] = useState<'SI' | 'EN'>('SI');
  const [helpSearch, setHelpSearch] = useState('');
  
  useEffect(() => {
    if (language === 'SI' && inputText) {
        setOutputText(transliterate(inputText));
    } else if (language === 'EN') {
        setOutputText(inputText);
    } else {
        setOutputText('');
    }
  }, [inputText, language]);

  useEffect(() => {
    localStorage.setItem('helatype_history', JSON.stringify(history));
  }, [history]);

  const handleSmartSave = async () => {
    if (!outputText.trim()) return;
    setIsProcessing(true);
    try {
      // AI generates a context-aware label for the save
      const label = await fixGrammar(`Summarize this text into 2-3 Sinhala words for a title: "${outputText.substring(0, 100)}"`);
      const newItem: HistoryItem = { 
        id: Date.now().toString(), 
        text: outputText, 
        timestamp: Date.now() 
      };
      setHistory(prev => [newItem, ...prev]);
      alert(`වැඩේ Save වුණා! Title: ${label}`);
    } catch (err) {
      // Fallback save if AI fails
      const newItem: HistoryItem = { 
        id: Date.now().toString(), 
        text: outputText, 
        timestamp: Date.now() 
      };
      setHistory(prev => [newItem, ...prev]);
      alert("වැඩේ Save වුණා!");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const filteredMappings = useMemo(() => {
    if (!helpSearch) return SINHALA_MAPPINGS;
    const s = helpSearch.toLowerCase();
    return SINHALA_MAPPINGS.filter(m => 
      m.english.toLowerCase().includes(s) || 
      m.sinhala.includes(s)
    );
  }, [helpSearch]);

  const downloadAsFile = () => {
    const element = document.createElement("a");
    const file = new Blob([outputText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "HelaType_Master_Export.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-orange-500/40">
      {/* Top Banner */}
      <header className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-8 gap-6 px-4">
        <div className="flex flex-col items-center md:items-start group cursor-default">
            <h1 className="text-5xl font-black tracking-tighter text-white flex items-center gap-4">
                <span className="bg-gradient-to-tr from-orange-600 to-amber-400 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 group-hover:rotate-12 transition-transform duration-500">
                    <i className="fas fa-feather-pointed text-3xl"></i>
                </span>
                HelaType <span className="text-orange-500">Master</span>
            </h1>
            <p className="text-[11px] font-black text-slate-500 tracking-[10px] uppercase mt-4 ml-1 opacity-70">Sinhala Pro Suite</p>
        </div>

        <div className="flex items-center gap-4 glass p-2 rounded-3xl border-white/10 shadow-2xl">
            <button 
                onClick={() => setLanguage('SI')} 
                className={`px-8 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${language === 'SI' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'text-slate-500 hover:text-white'}`}
            >
                Singlish
            </button>
            <button 
                onClick={() => setLanguage('EN')} 
                className={`px-8 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${language === 'EN' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-500 hover:text-white'}`}
            >
                English
            </button>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 pb-44">
        
        {/* Left Side: Main View */}
        <div className="lg:col-span-8 h-full">
            <div className="glass-dark rounded-[4rem] p-10 md:p-14 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.7)] border border-white/5 relative flex flex-col min-h-[750px]">
                
                {/* Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2.5 rounded-[2.5rem] mb-12 w-fit border border-white/5">
                    {[
                        { id: TabType.EDITOR, label: 'Editor', icon: 'fa-keyboard' },
                        { id: TabType.HELP, label: 'Search Help', icon: 'fa-magnifying-glass' },
                        { id: TabType.HISTORY, label: 'Saved Vault', icon: 'fa-box-archive' },
                        { id: TabType.AI_TOOLS, label: 'AI Power', icon: 'fa-wand-magic-sparkles' }
                    ].map((t) => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-8 py-4 rounded-[1.8rem] text-[14px] font-black transition-all flex items-center gap-4 ${activeTab === t.id ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-2xl' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <i className={`fas ${t.icon} text-base`}></i> {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === TabType.EDITOR && (
                    <div className="flex-1 flex flex-col space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        {/* Input Area */}
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={language === 'SI' ? "මෙතන සිංග්ලිෂ් වලින් ටයිප් කරන්න (උදා: oya)..." : "Type English text..."}
                                className="w-full h-44 bg-transparent text-4xl font-semibold focus:outline-none resize-none placeholder:text-slate-800 leading-tight text-slate-100 no-scrollbar"
                                autoFocus
                            />
                            {inputText && (
                                <button onClick={() => setInputText('')} className="absolute -top-4 -right-4 w-12 h-12 rounded-full glass flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 transition-all">
                                    <i className="fas fa-xmark text-xl"></i>
                                </button>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative h-px w-full">
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                             {isProcessing && <div className="absolute inset-0 bg-orange-500/50 animate-pulse blur-md"></div>}
                        </div>

                        {/* Output Display */}
                        <div className="flex-1 relative bg-black/40 rounded-[3.5rem] p-12 border border-white/5 shadow-2xl">
                            <div className="flex items-center justify-between mb-10">
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[6px] flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    Master Sinhala Unicode
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-green-500/50 uppercase tracking-widest">Safe Output</span>
                                    <i className="fas fa-shield-check text-green-500/30"></i>
                                </div>
                            </div>
                            <div className="text-6xl md:text-7xl sinhala-font font-black text-white leading-[1.3] min-h-[18rem] break-words">
                                {outputText || <span className="opacity-5 italic font-medium">Text will appear here...</span>}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-6 pt-12 mt-auto border-t border-white/5">
                            <div className="flex gap-5">
                                <button 
                                    onClick={handleSmartSave} 
                                    disabled={!outputText || isProcessing}
                                    className="h-24 px-14 rounded-[2.5rem] bg-orange-600 hover:bg-orange-500 text-white text-lg font-black shadow-[0_25px_60px_-10px_rgba(234,88,12,0.5)] transition-all flex items-center gap-5 active:scale-95 disabled:opacity-20"
                                >
                                    <i className="fas fa-file-shield text-2xl"></i> SMART SAVE
                                </button>
                                <button 
                                    onClick={downloadAsFile}
                                    disabled={!outputText}
                                    className="h-24 w-24 rounded-[2.5rem] glass hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center disabled:opacity-10"
                                >
                                    <i className="fas fa-download text-2xl"></i>
                                </button>
                            </div>
                            
                            <button 
                                onClick={copyToClipboard} 
                                disabled={!outputText}
                                className={`h-24 px-20 rounded-[2.5rem] font-black text-xl transition-all shadow-[0_30px_70px_-10px_rgba(0,0,0,0.5)] flex items-center gap-6 active:scale-95 ${copySuccess ? 'bg-green-600 text-white' : 'bg-white text-slate-950 hover:bg-slate-50 hover:scale-105'}`}
                            >
                                {copySuccess ? <><i className="fas fa-check-double text-3xl"></i> READY!</> : <><i className="fas fa-copy text-3xl"></i> COPY TO WORD</>}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === TabType.HELP && (
                    <div className="flex flex-col h-full animate-in fade-in duration-600">
                        <div className="relative mb-12">
                            <i className="fas fa-search absolute left-10 top-1/2 -translate-y-1/2 text-slate-500 text-2xl"></i>
                            <input 
                                type="text"
                                value={helpSearch}
                                onChange={(e) => setHelpSearch(e.target.value)}
                                placeholder="අකුර හෝ ඉංග්‍රීසි අකුර ගහන්න (Search Alphabet)..."
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-[2.5rem] pl-24 pr-12 text-2xl text-white focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 overflow-y-auto max-h-[500px] pr-6 no-scrollbar pb-16">
                            {filteredMappings.length > 0 ? filteredMappings.map((m, i) => (
                                <div key={i} className="glass p-10 rounded-[3rem] border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center group cursor-pointer hover:-translate-y-3 shadow-xl">
                                    <span className="text-6xl sinhala-font text-white mb-6 font-black group-hover:scale-125 transition-transform duration-500">{m.sinhala}</span>
                                    <span className="text-[14px] font-black text-orange-500/40 uppercase tracking-[4px] group-hover:text-orange-500 transition-colors">{m.english}</span>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 text-center opacity-20">
                                    <i className="fas fa-ghost text-7xl mb-6"></i>
                                    <p className="text-xl font-black uppercase tracking-widest">No matching letters</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-auto p-12 rounded-[3.5rem] bg-gradient-to-br from-indigo-600/10 to-blue-600/10 border border-blue-500/20 flex items-center gap-10">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-blue-500/20 flex items-center justify-center text-blue-400 text-3xl shrink-0">
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <div>
                                <h4 className="text-blue-400 font-black text-[14px] uppercase tracking-[6px] mb-3">Typing Mastery</h4>
                                <p className="text-slate-400 text-base leading-relaxed italic font-medium">
                                    Mahaprana (බර) letters use Capital letters. Sanyaka (සඤ්ඤක) use 'n' before the letter (e.g., 'nG' for 'ඟ'). Use double vowels for long sounds (e.g., 'aa' for 'ආ').
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === TabType.HISTORY && (
                    <div className="space-y-8 animate-in fade-in duration-600 h-full pb-20">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[500px] opacity-10">
                                <i className="fas fa-folder-tree text-[120px] mb-12"></i>
                                <p className="text-2xl font-black uppercase tracking-[20px]">Vault is Empty</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[600px] no-scrollbar pr-4">
                                {history.map(item => (
                                    <div key={item.id} className="glass p-10 rounded-[3.5rem] border border-white/5 hover:bg-white/10 transition-all group relative overflow-hidden shadow-2xl">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-bold text-slate-600 mt-1">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <button 
                                                onClick={() => setHistory(h => h.filter(i => i.id !== item.id))} 
                                                className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:scale-110"
                                            >
                                                <i className="fas fa-trash-can text-sm"></i>
                                            </button>
                                        </div>
                                        <p className="sinhala-font text-white text-3xl line-clamp-3 mb-10 leading-snug font-bold">{item.text}</p>
                                        <button 
                                            onClick={() => {setOutputText(item.text); setInputText(''); setActiveTab(TabType.EDITOR);}}
                                            className="w-full py-5 rounded-3xl bg-white/5 text-slate-400 font-black text-xs uppercase tracking-[4px] hover:bg-white text-slate-950 transition-all shadow-xl"
                                        >
                                            RESTORE TO EDITOR
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === TabType.AI_TOOLS && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-600">
                         {[
                            { name: 'Official Letter AI', desc: 'Convert simple speech into formal Sinhala for government or work letters.', icon: 'fa-briefcase', color: 'blue', action: async () => {
                                if (!outputText) return alert("මුලින්ම යමක් ලියන්න");
                                setIsProcessing(true);
                                const res = await fixGrammar(`Translate and rewrite this Sinhala text into a highly formal letter format suitable for a workplace: "${outputText}"`);
                                setOutputText(res);
                                setIsProcessing(false);
                            }},
                            { name: 'Grammar Shield', desc: 'Fix spelling, grammar and natural flow instantly using AI.', icon: 'fa-user-shield', color: 'green', action: async () => {
                                if (!outputText) return alert("මුලින්ම යමක් ලියන්න");
                                setIsProcessing(true);
                                const res = await fixGrammar(outputText);
                                setOutputText(res);
                                setIsProcessing(false);
                            }},
                            { name: 'Social Post AI', desc: 'Make your text more engaging for Facebook and WhatsApp.', icon: 'fa-share-nodes', color: 'orange', action: async () => {
                                if (!outputText) return alert("මුලින්ම යමක් ලියන්න");
                                setIsProcessing(true);
                                const res = await fixGrammar(`Make this Sinhala text engaging and friendly for a social media post: "${outputText}"`);
                                setOutputText(res);
                                setIsProcessing(false);
                            }},
                            { name: 'Engage Transcriber', desc: 'Translate your Sinhala thoughts to perfect English.', icon: 'fa-language', color: 'purple', action: async () => {
                                if (!outputText) return alert("මුලින්ම යමක් ලියන්න");
                                setIsProcessing(true);
                                const res = await smartTransliterate(`Translate this Sinhala to English: "${outputText}"`);
                                setOutputText(res);
                                setIsProcessing(false);
                            }}
                         ].map(item => (
                            <button key={item.name} onClick={item.action} className="glass p-12 rounded-[3.5rem] hover:bg-white/10 transition-all text-left border border-white/10 group relative overflow-hidden shadow-2xl">
                                <div className={`w-20 h-20 rounded-[1.8rem] bg-${item.color}-500/20 text-${item.color}-400 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <i className={`fas ${item.icon} text-3xl`}></i>
                                </div>
                                <h4 className="font-black text-3xl text-white mb-4 leading-tight">{item.name}</h4>
                                <p className="text-base text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                <div className={`absolute -bottom-10 -right-10 w-40 h-40 bg-${item.color}-500/5 rounded-full blur-3xl`}></div>
                            </button>
                         ))}
                    </div>
                )}
            </div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="glass-dark rounded-[4rem] p-12 shadow-3xl border border-white/10 relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[120px] group-hover:bg-orange-500/20 transition-all duration-1000"></div>
                <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-[10px] mb-12 opacity-50">System Architecture</h3>
                
                <div className="space-y-12 relative z-10">
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 rounded-[2.2rem] bg-white/5 flex items-center justify-center text-orange-500 border border-white/10 shadow-inner">
                            <i className="fas fa-microchip text-4xl"></i>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-500 tracking-widest uppercase mb-2">Engine Unit</p>
                            <p className="text-3xl font-black text-white">Local-X4</p>
                            <p className="text-[11px] text-green-500 font-black mt-2 tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                OPTIMIZED
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 rounded-[2.2rem] bg-white/5 flex items-center justify-center text-blue-400 border border-white/10 shadow-inner">
                            <i className="fas fa-brain text-4xl"></i>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-slate-500 tracking-widest uppercase mb-2">AI Neural Net</p>
                            <p className="text-3xl font-black text-white">Gemini 3</p>
                            <p className="text-[11px] text-blue-500 font-black mt-2 tracking-widest">CONNECTED</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-12 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Reliability Score</span>
                        <span className="text-white">99.9%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                        <div className="w-[99%] h-full bg-gradient-to-r from-orange-500 to-amber-400"></div>
                    </div>
                </div>
            </div>

            <div className="glass-dark rounded-[4rem] p-12 shadow-3xl border border-white/10 flex-1">
                <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-[10px] mb-12 opacity-50">Live Shortcuts</h3>
                <div className="grid grid-cols-2 gap-6">
                    {[
                        { en: 'amma', si: 'අම්ම' },
                        { en: 'nG', si: 'ඟ' },
                        { en: 'K', si: 'ඛ' },
                        { en: 'aa', si: 'ආ' },
                        { en: 'u', si: 'උ' },
                        { en: 'L', si: 'ළ' }
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col items-center bg-white/5 p-10 rounded-[3rem] border border-white/5 hover:bg-white/10 transition-all cursor-help group shadow-2xl">
                            <span className="text-5xl sinhala-font text-white font-black mb-5 group-hover:scale-110 transition-transform duration-500">{m.si}</span>
                            <span className="text-[13px] font-black text-slate-700 uppercase tracking-widest group-hover:text-orange-500 transition-colors">{m.en}</span>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => setActiveTab(TabType.HELP)}
                    className="w-full mt-12 py-6 rounded-3xl glass text-[12px] font-black text-slate-500 uppercase tracking-[8px] hover:text-white hover:bg-orange-500/10 transition-all border-white/10"
                >
                    Expand All
                </button>
            </div>
        </div>
      </main>

      {/* Control Hub Navigation */}
      <nav className="fixed bottom-14 glass p-4 rounded-[4rem] flex gap-4 shadow-[0_60px_160px_rgba(0,0,0,1)] border border-white/20 z-50 transform hover:scale-105 transition-all duration-700">
         {[
            { id: TabType.EDITOR, icon: 'fa-feather' },
            { id: TabType.HELP, icon: 'fa-magnifying-glass' },
            { id: TabType.HISTORY, icon: 'fa-box-archive' },
            { id: TabType.AI_TOOLS, icon: 'fa-wand-magic-sparkles' }
         ].map((item) => (
            <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-24 h-24 rounded-[2.8rem] flex items-center justify-center transition-all duration-500 ${activeTab === item.id ? 'bg-gradient-to-tr from-orange-600 to-amber-400 text-white shadow-[0_15px_40px_rgba(234,88,12,0.6)] scale-110 -translate-y-2' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
            >
                <i className={`fas ${item.icon} text-3xl`}></i>
            </button>
         ))}
      </nav>

      <footer className="mt-auto pb-48 text-center opacity-10 text-[11px] font-black uppercase tracking-[20px] text-white">
        Precision Engineering • HelaType Ecosystem
      </footer>
    </div>
  );
};

export default App;
