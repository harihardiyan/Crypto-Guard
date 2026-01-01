
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import VisualFingerprint from './components/VisualFingerprint';
import { detectNetwork, splitAddress, sha256, isValidAddress } from './utils/crypto';
import { AddressCheck } from './types';

const EMOJI_POOL = [
  '🚀', '🛡️', '💎', '🔥', '🦊', '🐱', '🦄', '🌈', '🍀', '⭐', '🌙', '🌊', '🍄', '❄️', '🎸',
  '🦁', '🐯', '🐼', '🐨', '🐙', '🦋', '☀️', '🌍', '⚡', '⚓', '🛸', '👑', '🔮', '🧬', '🧪'
];

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [referenceValue, setReferenceValue] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [currentCheck, setCurrentCheck] = useState<AddressCheck | null>(null);
  const [currentEmojis, setCurrentEmojis] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Safe Storage Access
  const [addressBook, setAddressBook] = useState<Record<string, { addedAt: number; label?: string }>>(() => {
    try {
      const saved = localStorage.getItem('crypto_guard_v3_book');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load address book", e);
      return {};
    }
  });

  const [history, setHistory] = useState<AddressCheck[]>(() => {
    try {
      const saved = localStorage.getItem('crypto_guard_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // Security States
  const [trustScore, setTrustScore] = useState(0);
  const [unlockKey, setUnlockKey] = useState(''); 
  const [securityStatus, setSecurityStatus] = useState<'safe' | 'warning' | 'compromised'>('safe');

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('crypto_guard_v3_book', JSON.stringify(addressBook));
  }, [addressBook]);

  useEffect(() => {
    localStorage.setItem('crypto_guard_history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  // Toast Auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Integrity Check: Feature Detection
  useEffect(() => {
    const hasSubtle = !!(window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function');
    const hasClipboard = !!(navigator.clipboard && typeof navigator.clipboard.writeText === 'function');
    if (!hasSubtle || !hasClipboard) {
      setSecurityStatus('compromised');
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const generateUniqueEmojis = useCallback(async (address: string) => {
    const hash = await sha256(address);
    const result = [];
    for (let i = 0; i < 4; i++) {
      const segment = hash.substring(i * 4, (i * 4) + 4);
      const index = parseInt(segment, 16) % EMOJI_POOL.length;
      result.push(EMOJI_POOL[index]);
    }
    return result;
  }, []);

  const handleAnalyze = useCallback(async (address: string) => {
    const trimmed = address.trim();
    if (!trimmed || trimmed.length < 4) {
      setCurrentCheck(null);
      return;
    }

    const valid = isValidAddress(trimmed);
    const network = detectNetwork(trimmed);
    const { prefix, middle, suffix } = splitAddress(trimmed);
    const emojis = await generateUniqueEmojis(trimmed);
    setCurrentEmojis(emojis);

    const newCheck: AddressCheck = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      address: trimmed,
      timestamp: Date.now(),
      isSuspicious: !valid,
      prefix,
      middle,
      suffix,
      fingerprint: trimmed,
      network
    };

    setCurrentCheck(newCheck);
    setUnlockKey('');
    
    setHistory(prev => {
      const filtered = prev.filter(h => h.address !== trimmed);
      return [newCheck, ...filtered].slice(0, 10);
    });
    
    if (addressBook[trimmed]) {
      setTrustScore(100);
    } else if (valid) {
      setTrustScore(85);
    } else {
      setTrustScore(25);
    }
  }, [addressBook, generateUniqueEmojis]);

  // Debounced Effect for typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue) handleAnalyze(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, handleAnalyze]);

  const toggleTrust = (address: string) => {
    if (addressBook[address]) {
      const newBook = { ...addressBook };
      delete newBook[address];
      setAddressBook(newBook);
      showToast("Alamat dihapus dari daftar terpercaya", "info");
      setTrustScore(85);
    } else {
      setAddressBook(prev => ({
        ...prev,
        [address]: { addedAt: Date.now() }
      }));
      showToast("Alamat ditandai sebagai TERPERCAYA", "success");
      setTrustScore(100);
    }
  };

  const onManualPaste = (e: React.ClipboardEvent, target: 'input' | 'ref') => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (target === 'input') {
      setInputValue(pastedText);
    } else if (target === 'ref') {
      setReferenceValue(pastedText);
    }
  };

  const handlePaste = async (target: 'input' | 'ref') => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) throw new Error();
      const text = await navigator.clipboard.readText();
      if (target === 'input') {
        setInputValue(text);
      } else {
        setReferenceValue(text);
      }
    } catch (err) {
      showToast("Gunakan Shortcut Ctrl+V", "error");
    }
  };

  const copyToClipboard = async (text: string) => {
    const tailInput = unlockKey.trim().toLowerCase();
    const tailAddr = text.slice(-3).toLowerCase();
    
    if (tailInput !== tailAddr) {
      showToast("Karakter verifikasi tidak cocok!", "error");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      showToast("Berhasil Disalin ke Clipboard!", "success");
    } catch (err) {
      showToast("Gagal menyalin secara otomatis.", "error");
    }
  };

  const exportConfig = () => {
    const config = { version: "3.6", ignoreCase, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-guard-v3.6-config.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast("Konfigurasi Berhasil Diekspor", "success");
  };

  const renderedDiff = useMemo(() => {
    if (!referenceValue || !inputValue) return null;
    const ref = ignoreCase ? referenceValue.toLowerCase() : referenceValue;
    const inp = ignoreCase ? inputValue.toLowerCase() : inputValue;
    const maxLength = Math.max(referenceValue.length, inputValue.length);
    const diffElements = [];

    for (let i = 0; i < maxLength; i++) {
      const charRef = ref[i];
      const charInp = inp[i];
      const originalChar = inputValue[i] || '';

      if (charRef === charInp) {
        diffElements.push(<span key={i} className="text-slate-400">{originalChar}</span>);
      } else {
        diffElements.push(
          <span key={i} className="text-red-500 font-black underline bg-red-500/20 px-0.5 rounded">
            {originalChar || ' '}
          </span>
        );
      }
    }
    return diffElements;
  }, [referenceValue, inputValue, ignoreCase]);

  if (securityStatus === 'compromised') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-center">
        <div className="max-w-md bg-red-950/20 p-10 rounded-[3rem] border border-red-500/30">
          <i className="fas fa-shield-slash text-6xl text-red-500 mb-6"></i>
          <h1 className="text-3xl font-black text-white mb-4">RESTRICTED ENVIRONMENT</h1>
          <p className="text-slate-400 text-sm mb-8">API Keamanan tidak tersedia di konteks ini (misal: non-HTTPS). Harap gunakan lingkungan yang aman.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold">Refresh Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8 bg-[#020617] selection:bg-emerald-500/30">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-10 duration-300 flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : toast.type === 'error' ? 'bg-red-950/80 border-red-500 text-red-300' : 'bg-slate-900/90 border-slate-700 text-slate-300'}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-circle-check' : toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`}></i>
          <span className="text-sm font-bold uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i className="fas fa-shield-halved text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">CRYPTO GUARD <span className="text-emerald-500 font-mono text-lg">v3.6</span></h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Active Anti-Poisoning Protection</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportConfig} className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 text-xs font-black uppercase hover:border-slate-600 transition-all">
              <i className="fas fa-file-export mr-2"></i> Export
            </button>
            <button 
              onClick={() => setShowCompare(!showCompare)}
              className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase transition-all ${showCompare ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
            >
              {showCompare ? 'Close Compare' : 'Compare Mode'}
            </button>
          </div>
        </header>

        {history.length > 0 && (
          <div className="mb-8 animate-in fade-in duration-500">
            <p className="text-[10px] font-black text-slate-600 uppercase mb-3 tracking-widest">Quick Access History</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {history.map((h) => (
                <button 
                  key={h.id}
                  onClick={() => { setInputValue(h.address); handleAnalyze(h.address); }}
                  className="shrink-0 bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-2xl flex items-center gap-3 transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] ${addressBook[h.address] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950 text-slate-600'}`}>
                    <i className={`fas ${addressBook[h.address] ? 'fa-check-circle' : 'fa-wallet'}`}></i>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-slate-300">...{h.address.slice(-8)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showCompare && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 relative">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">Ref Address (Explorer/Source)</label>
              <input 
                type="text"
                value={referenceValue}
                onChange={(e) => setReferenceValue(e.target.value)}
                onPaste={(e) => onManualPaste(e, 'ref')}
                placeholder="Paste original address here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 mono text-sm outline-none focus:border-emerald-500/30"
              />
              <button onClick={() => handlePaste('ref')} className="absolute right-10 top-1/2 translate-y-1 text-slate-600"><i className="fas fa-paste"></i></button>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 relative">
              <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">Copy Result (Target)</label>
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPaste={(e) => onManualPaste(e, 'input')}
                placeholder="Paste copied address here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 mono text-sm outline-none focus:border-emerald-500/30"
              />
              <button onClick={() => handlePaste('input')} className="absolute right-10 top-1/2 translate-y-1 text-slate-600"><i className="fas fa-paste"></i></button>
            </div>
            
            <div className="md:col-span-2 flex items-center gap-4 px-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Case Sensitivity:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={ignoreCase} onChange={() => setIgnoreCase(!ignoreCase)} className="sr-only" />
                  <div className={`w-8 h-4 rounded-full transition-colors ${ignoreCase ? 'bg-emerald-600' : 'bg-slate-700'}`}></div>
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${ignoreCase ? 'translate-x-4' : ''}`}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Ignore Case (Checksums)</span>
              </label>
            </div>

            {(referenceValue || inputValue) && (
              <div className={`md:col-span-2 p-6 rounded-3xl border transition-all ${((ignoreCase ? referenceValue.toLowerCase() : referenceValue) === (ignoreCase ? inputValue.toLowerCase() : inputValue)) ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <i className={`fas ${((ignoreCase ? referenceValue.toLowerCase() : referenceValue) === (ignoreCase ? inputValue.toLowerCase() : inputValue)) ? 'fa-circle-check text-emerald-500' : 'fa-triangle-exclamation text-red-500'} text-xl`}></i>
                  <p className="font-black uppercase tracking-widest text-sm">
                    {((ignoreCase ? referenceValue.toLowerCase() : referenceValue) === (ignoreCase ? inputValue.toLowerCase() : inputValue)) ? 'Address Identity Match' : 'CRITICAL: ADDRESS MISMATCH DETECTED!'}
                  </p>
                </div>
                {renderedDiff && (
                  <div className="p-5 bg-black/40 rounded-2xl mono text-lg break-all border border-white/5">
                    {renderedDiff}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="relative group mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[2.6rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-slate-900 p-2 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row gap-2 shadow-2xl">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPaste={(e) => onManualPaste(e, 'input')}
              placeholder="Enter or paste address..."
              className="flex-1 bg-transparent border-none outline-none px-8 py-6 mono text-lg md:text-2xl"
            />
            <button onClick={() => handlePaste('input')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all">
               Paste Input
            </button>
          </div>
        </div>

        {currentCheck && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center shadow-xl relative overflow-hidden">
                <VisualFingerprint address={currentCheck.address} size={6} />
                <div className="mt-8 grid grid-cols-4 gap-2 w-full">
                  {currentEmojis.map((emoji, i) => (
                    <div key={i} className="aspect-square bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-2xl shadow-inner group hover:border-emerald-500/50 transition-all">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="mt-8 w-full bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 border-dashed">
                   <p className="text-[10px] text-emerald-500 font-black uppercase mb-4 tracking-widest text-center">🛡️ Manual Identity Check</p>
                   <div className="flex flex-col gap-4">
                      <div className="text-center">
                        <span className="text-xs text-slate-500">Verify last 3 chars:</span>
                        <span className="ml-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 font-mono font-black rounded uppercase">...{currentCheck.address.slice(-3)}</span>
                      </div>
                      <input 
                        type="text"
                        maxLength={3}
                        value={unlockKey}
                        onChange={(e) => setUnlockKey(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl py-3 text-center font-black mono text-xl focus:border-emerald-500 outline-none transition-all uppercase"
                        placeholder="???"
                      />
                   </div>
                </div>
                <button 
                  onClick={() => copyToClipboard(currentCheck.address)}
                  disabled={unlockKey.toLowerCase() !== currentCheck.address.slice(-3).toLowerCase()}
                  className={`mt-6 w-full p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all ${unlockKey.toLowerCase() === currentCheck.address.slice(-3).toLowerCase() ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                >
                  <i className={`fas ${unlockKey.toLowerCase() === currentCheck.address.slice(-3).toLowerCase() ? 'fa-lock-open' : 'fa-lock'}`}></i>
                  {unlockKey.toLowerCase() === currentCheck.address.slice(-3).toLowerCase() ? 'Secure Copy' : 'Unlock Access'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center"><i className="fas fa-microchip text-emerald-400"></i></div>
                      <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">Safety Analysis</h3>
                   </div>
                   <span className="px-4 py-1 bg-slate-950 rounded-full border border-slate-800 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                      {currentCheck.network}
                   </span>
                </div>
                <div className="space-y-10">
                  <div className="relative group/addr">
                    <div className="flex flex-wrap justify-center gap-0.5 p-10 bg-black/40 rounded-[2rem] border border-slate-800 mono text-3xl break-all leading-tight shadow-inner transition-colors group-hover/addr:border-emerald-500/20">
                      <span className="text-slate-600">{currentCheck.prefix}</span>
                      <span className="text-emerald-500 font-black">{currentCheck.middle}</span>
                      <span className="text-slate-600">{currentCheck.suffix}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Confidence Level</p>
                          <span className={`text-3xl font-black ${trustScore > 80 ? 'text-emerald-400' : trustScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>{trustScore}%</span>
                        </div>
                        <button 
                          onClick={() => toggleTrust(currentCheck.address)}
                          className={`mt-4 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${addressBook[currentCheck.address] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-white'}`}
                        >
                          {addressBook[currentCheck.address] ? 'Remove from Trusted' : 'Mark as Trusted'}
                        </button>
                     </div>
                     <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800">
                        <p className="text-[10px] font-black text-slate-600 uppercase mb-2">Format Status</p>
                        <div className="flex items-center gap-2">
                           <i className={`fas ${currentCheck.isSuspicious ? 'fa-circle-xmark text-red-500' : 'fa-circle-check text-emerald-500'}`}></i>
                           <span className="text-sm font-black text-white uppercase">{currentCheck.isSuspicious ? 'Heuristic Fail' : 'Verified Format'}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-8 flex items-start gap-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                 <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-fingerprint text-emerald-400 text-2xl"></i>
                 </div>
                 <div>
                    <h4 className="font-black text-emerald-300 uppercase tracking-widest text-sm mb-2">Zero-Trust Clipboard</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                       Pendeteksian malware aktif: Gunakan shortcut <span className="text-white font-bold">Ctrl+V</span> untuk menghindari manipulasi API oleh ekstensi browser berbahaya. Alamat Anda diverifikasi secara lokal menggunakan SHA-256.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}
        <footer className="text-center text-slate-800 text-[10px] uppercase font-black tracking-[0.5em] pb-10 border-t border-slate-900 pt-10">
           &copy; {new Date().getFullYear()} CRYPTO GUARD &bull; SECURE LOCAL ENVIRONMENT
        </footer>
      </div>
    </div>
  );
};

export default App;
