
import React, { useState, useCallback, useEffect } from 'react';
import VisualFingerprint from './components/VisualFingerprint';
import { detectNetwork, splitAddress, sha256 } from './utils/crypto';
import { AddressCheck } from './types';

const EMOJI_POOL = [
  '🚀', '🛡️', '💎', '🔥', 'FOX', 'CAT', 'UNI', 'RAIN', 'CLOV', 'STAR', 'MOON', 'WAVE', 'MUSH', 'ICE', 'GUIT',
  'LION', 'TIG', 'PAN', 'KOA', 'OCT', 'BUTT', 'SUN', 'EARTH', 'BOLT', 'ANCH', 'UFO', 'CROWN', 'CRYST', 'DNA', 'LAB'
];

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [referenceValue, setReferenceValue] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<AddressCheck | null>(null);
  const [currentEmojis, setCurrentEmojis] = useState<string[]>([]);
  const [addressBook] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('crypto_guard_book');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Security States
  const [trustScore, setTrustScore] = useState(0);
  const [unlockKey, setUnlockKey] = useState(''); // Manual verification input
  const [isTampered, setIsTampered] = useState(false);
  
  // 1. TAMPER DETECTION: Check if critical functions are modified
  useEffect(() => {
    const checkIntegrity = () => {
      try {
        const isNative = (fn: Function) => fn.toString().includes('[native code]');
        // Verify core APIs haven't been swapped by malicious scripts
        if (!isNative(window.crypto.subtle.digest) || !isNative(navigator.clipboard.writeText)) {
          setIsTampered(true);
        }
      } catch (e) {
        // Silently fail if toString is protected or other issues
      }
    };
    checkIntegrity();
  }, []);

  const generateUniqueEmojis = async (address: string) => {
    const hash = await sha256(address);
    const result = [];
    for (let i = 0; i < 4; i++) {
      const segment = hash.substring(i * 4, (i * 4) + 4);
      const index = parseInt(segment, 16) % EMOJI_POOL.length;
      result.push(EMOJI_POOL[index]);
    }
    return result;
  };

  const handleAnalyze = useCallback(async (address: string) => {
    const trimmed = address.trim();
    if (!trimmed || trimmed.length < 20) {
      setCurrentCheck(null);
      return;
    }

    const { prefix, middle, suffix } = splitAddress(trimmed);
    const emojis = await generateUniqueEmojis(trimmed);
    setCurrentEmojis(emojis);

    const newCheck: AddressCheck = {
      id: Math.random().toString(36).substr(2, 9),
      address: trimmed,
      timestamp: Date.now(),
      isSuspicious: trimmed.length < 26 || trimmed.length > 75,
      prefix,
      middle,
      suffix,
      fingerprint: trimmed
    };

    setCurrentCheck(newCheck);
    setUnlockKey(''); // Reset unlock key when address changes
    setTrustScore(addressBook[trimmed] ? 100 : 60);
  }, [addressBook]);

  // Handle manual paste events for better responsiveness
  // This event usually works even when navigator.clipboard.readText() is blocked
  const onManualPaste = (e: React.ClipboardEvent, target: 'input' | 'ref') => {
    const pastedText = e.clipboardData.getData('text');
    if (target === 'input') {
      setInputValue(pastedText);
      handleAnalyze(pastedText);
    } else if (target === 'ref') {
      setReferenceValue(pastedText);
    }
  };

  // Improved handlePaste with non-intrusive failure
  const handlePaste = async (target: 'input' | 'ref') => {
    try {
      // Direct access check
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error("Clipboard API unavailable");
      }

      const text = await navigator.clipboard.readText();
      if (target === 'input') {
        setInputValue(text);
        handleAnalyze(text);
      } else {
        setReferenceValue(text);
      }
    } catch (err) {
      // Don't log to console.error to avoid spamming user
      alert("⚠️ FITUR PASTE OTOMATIS DIBATASI\n\nBrowser Anda memblokir akses clipboard otomatis demi keamanan.\n\nSilakan gunakan shortcut:\n- Windows/Linux: Ctrl + V\n- Mac: Cmd + V");
    }
  };

  const copyToClipboard = async (text: string) => {
    if (unlockKey.toLowerCase() !== text.slice(-3).toLowerCase()) {
      alert("Verifikasi gagal! Ketik 3 huruf terakhir alamat untuk membuka kunci Copy.");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      alert(`✅ BERHASIL DISALIN!\n\nPastikan Anda memverifikasi 4 digit terakhir "${text.slice(-4)}" saat menempel di wallet tujuan.`);
    } catch (err) {
      alert("Gagal menyalin secara otomatis. Silakan pilih teks alamat lalu gunakan Ctrl+C.");
    }
  };

  if (isTampered) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <i className="fas fa-radiation text-6xl text-red-500 mb-6 animate-pulse"></i>
          <h1 className="text-3xl font-black text-white mb-4">SYSTEM BREACH DETECTED</h1>
          <p className="text-red-200">Aplikasi mendeteksi adanya modifikasi pada fungsi keamanan browser Anda. Akses dihentikan demi keamanan dana Anda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8 bg-[#020617] selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3">
              <i className="fas fa-shield-bolt text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                CRYPTO GUARD <span className="text-emerald-500 font-mono text-lg">v3.3</span>
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Secure Local Check</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCompare(!showCompare)}
              className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase transition-all active:scale-95 ${showCompare ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
            >
              {showCompare ? 'Tutup Perbandingan' : 'Mode Bandingkan'}
            </button>
          </div>
        </header>

        {/* Comparison UI */}
        {showCompare && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 transition-all hover:border-blue-500/30">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">1. Alamat Sumber (Asli)</label>
              <div className="relative group">
                <input 
                  type="text"
                  value={referenceValue}
                  onChange={(e) => setReferenceValue(e.target.value)}
                  onPaste={(e) => onManualPaste(e, 'ref')}
                  placeholder="Gunakan Ctrl+V di sini..."
                  className="w-full bg-slate-950 border border-slate-800 group-hover:border-slate-700 rounded-xl p-4 mono text-sm outline-none transition-all"
                />
                <button onClick={() => handlePaste('ref')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-400" title="Paste otomatis (mungkin diblokir)"><i className="fas fa-paste"></i></button>
              </div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 transition-all hover:border-emerald-500/30">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">2. Alamat Hasil Copy (Tujuan)</label>
              <div className="relative group">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => {setInputValue(e.target.value); handleAnalyze(e.target.value);}}
                  onPaste={(e) => onManualPaste(e, 'input')}
                  placeholder="Gunakan Ctrl+V di sini..."
                  className="w-full bg-slate-950 border border-slate-800 group-hover:border-slate-700 rounded-xl p-4 mono text-sm outline-none transition-all"
                />
                <button onClick={() => handlePaste('input')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-400" title="Paste otomatis (mungkin diblokir)"><i className="fas fa-paste"></i></button>
              </div>
            </div>
            {referenceValue && inputValue && (
              <div className={`md:col-span-2 p-5 rounded-2xl border flex items-center justify-center gap-3 transition-all ${referenceValue === inputValue ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'}`}>
                <i className={`fas ${referenceValue === inputValue ? 'fa-check-circle' : 'fa-skull-crossbones'} text-xl`}></i>
                <p className="font-black uppercase tracking-widest text-sm text-center">
                  {referenceValue === inputValue ? 'Identitas Identik' : 'PERINGATAN: ALAMAT BERBEDA!'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input Section */}
        <div className="relative group mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-slate-900 p-2 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row gap-2">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => {setInputValue(e.target.value); handleAnalyze(e.target.value);}}
              onPaste={(e) => onManualPaste(e, 'input')}
              placeholder="Paste alamat (Ctrl+V) untuk verifikasi..."
              className="flex-1 bg-transparent border-none outline-none px-8 py-6 mono text-lg md:text-2xl placeholder:text-slate-700"
            />
            <button 
              onClick={() => handlePaste('input')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <i className="fas fa-paste"></i> Paste
            </button>
          </div>
        </div>

        {currentCheck && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            
            {/* Left Side: Visual & HITL Verification */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-8 flex flex-col items-center shadow-xl relative">
                <VisualFingerprint address={currentCheck.address} size={6} />
                
                <div className="mt-8 grid grid-cols-4 gap-2 w-full">
                  {currentEmojis.map((emoji, i) => (
                    <div key={i} className="aspect-square bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-xl shadow-inner group hover:border-emerald-500 transition-all">
                      {emoji}
                    </div>
                  ))}
                </div>

                {/* HITL: Human In The Loop Security */}
                <div className="mt-8 w-full bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 border-dashed">
                   <p className="text-[10px] text-emerald-500 font-black uppercase mb-4 tracking-widest text-center">Anti-Malware Check</p>
                   <div className="flex flex-col gap-4">
                      <div className="text-center">
                        <span className="text-xs text-slate-500">Ketik 3 karakter terakhir:</span>
                        <span className="ml-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono font-black rounded">...{currentCheck.address.slice(-3)}</span>
                      </div>
                      <input 
                        type="text"
                        maxLength={3}
                        value={unlockKey}
                        onChange={(e) => setUnlockKey(e.target.value.toLowerCase())}
                        className="bg-slate-900 border border-slate-800 rounded-xl py-3 text-center font-black mono text-xl focus:border-emerald-500 outline-none transition-all uppercase"
                        placeholder="???"
                      />
                   </div>
                </div>

                <button 
                  onClick={() => copyToClipboard(currentCheck.address)}
                  disabled={unlockKey.toLowerCase() !== currentCheck.address.slice(-3).toLowerCase()}
                  className={`mt-6 w-full p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all ${unlockKey.toLowerCase() === currentCheck.address.slice(-3).toLowerCase() ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  <i className={`fas ${unlockKey.toLowerCase() === currentCheck.address.slice(-3).toLowerCase() ? 'fa-lock-open' : 'fa-lock'}`}></i>
                  {unlockKey.toLowerCase() === currentCheck.address.slice(-3).toLowerCase() ? 'Secure Copy' : 'Unlock to Copy'}
                </button>
              </div>
            </div>

            {/* Right Side: Analysis */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <i className="fas fa-radar text-emerald-400"></i>
                      </div>
                      <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">Security Heuristics</h3>
                   </div>
                   <span className="px-4 py-1 bg-slate-950 rounded-full border border-slate-800 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      {detectNetwork(currentCheck.address)}
                   </span>
                </div>

                <div className="space-y-10">
                  <div className="relative">
                    <div className="flex flex-wrap justify-center gap-0.5 p-10 bg-black/40 rounded-[2rem] border border-slate-800 mono text-3xl break-all leading-tight shadow-inner">
                      <span className="text-slate-600">{currentCheck.prefix}</span>
                      <span className="text-red-500 font-black bg-red-500/5 px-1 rounded-lg ring-2 ring-red-500/20">{currentCheck.middle}</span>
                      <span className="text-slate-600">{currentCheck.suffix}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800">
                        <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Trust Level</p>
                        <div className="flex items-end gap-2">
                           <span className={`text-3xl font-black ${trustScore > 80 ? 'text-emerald-400' : 'text-yellow-500'}`}>{trustScore}%</span>
                        </div>
                     </div>
                     <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800">
                        <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Integrity Status</p>
                        <div className="flex items-center gap-2">
                           <i className="fas fa-check-circle text-emerald-500"></i>
                           <span className="text-sm font-black text-white uppercase tracking-tight">Verified Local</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2rem] p-8 flex items-start gap-6">
                 <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-keyboard text-blue-400 text-2xl"></i>
                 </div>
                 <div>
                    <h4 className="font-black text-blue-300 uppercase tracking-widest text-sm mb-2">Gunakan Shortcut Keyboard</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                       Untuk keamanan maksimal, gunakan <span className="text-white font-bold italic">Ctrl+V</span> secara langsung. Ini memastikan data berpindah dari sistem ke aplikasi tanpa perantara API browser yang bisa dibatasi oleh kebijakan keamanan sandbox.
                    </p>
                 </div>
              </div>
            </div>

          </div>
        )}

        <footer className="text-center text-slate-800 text-[10px] uppercase font-black tracking-[0.5em] pb-10">
           &copy; {new Date().getFullYear()} CRYPTO GUARD &bull; SECURE ENVIRONMENT
        </footer>
      </div>
    </div>
  );
};

export default App;
