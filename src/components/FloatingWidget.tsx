import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Camera, X, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export function FloatingWidget({ onSendMessage }: { onSendMessage: (text: string, image?: string) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? prev + ' ' + transcript : transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setError("Microphone permission denied. Open the app in a new tab (top right icon) to grant permission and use voice input.");
        } else {
          setError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    setError(null);
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setError("Speech recognition is not supported in this browser.");
        return;
      }
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err: any) {
        console.error(err);
        setError("Failed to start voice input.");
      }
    }
  };

  const handleCaptureScreen = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setError("Screen capture is not supported in this browser or environment.");
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.5);
      
      // Stop sharing
      track.stop();
      
      // Send image + text
      await handleSend(base64Image);
    } catch (err: any) {
      console.error('Error capturing screen:', err);
      if (err.name === 'SecurityError' || err.message?.includes('permissions policy')) {
        setError("Screen capture is disallowed by permissions policy in the preview iframe. Open the app in a new tab (top right icon) to capture your screen.");
      } else if (err.name === 'NotAllowedError') {
        setError("Screen capture permission was denied.");
      } else {
        setError("Could not capture screen. Try opening the app in a new tab.");
      }
    }
  };

  const handleSend = async (imageString?: string) => {
    if (!input.trim() && !imageString) return;
    
    setIsSending(true);
    setError(null);
    try {
        await onSendMessage(input, imageString);
        setInput('');
    } catch (err: any) {
        console.error(err);
        setError("Failed to send message.");
    } finally {
        setIsSending(false);
        if (!imageString) {
          setIsOpen(false);
        }
    }
  };

  return (
    <motion.div 
      drag 
      dragMomentum={false}
      initial={{ x: window.innerWidth - 80, y: window.innerHeight - 80 }}
      className="fixed z-50 flex flex-col items-end"
      style={{ touchAction: "none" }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 bg-surface border border-border shadow-xl rounded-xl p-4 w-72 flex flex-col gap-4 font-sans text-foreground"
            // Prevent dragging the widget when interacting with the form
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="font-bold tracking-tight">FinSight Mini</span>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="relative text-[11px] bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl leading-normal flex gap-1.5 items-start">
                <span className="flex-1">{error}</span>
                <button 
                  onClick={() => setError(null)} 
                  className="text-red-500 hover:text-red-700 flex-shrink-0 mt-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <textarea 
               value={input}
               onChange={e => setInput(e.target.value)}
               placeholder="How can I help?"
               className="w-full h-24 bg-[#F3F1EB] border-none p-3 text-sm italic resize-none focus:ring-1 focus:ring-[#1A1A1A] outline-none"
            />
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={toggleListen}
                  className={cn("p-2 rounded-full transition-colors", isListening ? "bg-red-100 text-red-600" : "bg-[#F3F1EB] text-[#1A1A1A] hover:bg-[#E5E2D9]")}
                  title="Voice Input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleCaptureScreen}
                  className="p-2 rounded-full bg-[#F3F1EB] text-[#1A1A1A] hover:bg-[#E5E2D9] transition-colors"
                  title="Capture Screen"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => handleSend()}
                disabled={isSending || (!input.trim())}
                className="bg-[#1A1A1A] text-white px-4 py-2 text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
              >
                {isSending ? '...' : 'Send'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#1A1A1A] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </motion.div>
  );
}
