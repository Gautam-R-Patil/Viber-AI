import React, { useMemo } from 'react';
import { Icons } from './icons';

interface VoiceOverlayProps {
  onClose: () => void;
  userTranscription: string;
  modelTranscription: string;
  isModelSpeaking: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  onClose,
  userTranscription,
  modelTranscription,
  isModelSpeaking,
  isMuted,
  onToggleMute,
}) => {
  const { statusText, animationClass, orbColor, isThinking } = useMemo(() => {
    if (isMuted) {
      return {
        statusText: 'Muted',
        animationClass: '',
        orbColor: 'bg-zinc-600',
        isThinking: false,
      };
    }
    if (isModelSpeaking) {
      return {
        statusText: 'AI is speaking...',
        animationClass: 'animate-[speak-glow_2s_ease-in-out_infinite]',
        orbColor: 'bg-teal-500',
        isThinking: false,
      };
    }
    if (userTranscription) {
      return {
        statusText: 'Listening...',
        animationClass: 'animate-[pulse-glow_2.5s_ease-in-out_infinite]',
        orbColor: 'bg-sky-500',
        isThinking: false,
      };
    }
    // Default state: idle/thinking
    return {
      statusText: 'Ready to listen...',
      animationClass: 'animate-[think-swirl_3s_linear_infinite]',
      orbColor: 'bg-violet-500',
      isThinking: true,
    };
  }, [isModelSpeaking, userTranscription, isMuted]);

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-opacity duration-300 animate-fade-in">
      <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${animationClass} ${orbColor}`}>
        <div className={isThinking ? 'animate-[counter-swirl_3s_linear_infinite]' : ''}>
           {isMuted ? (
              <Icons.MicrophoneOff className="w-16 h-16 text-white/80" />
           ) : (
              <Icons.Microphone className="w-16 h-16 text-white/80" />
           )}
        </div>
      </div>

      <p className="mt-8 text-2xl font-semibold text-white tracking-wide">{statusText}</p>
      
      <div className="mt-4 h-16 w-full max-w-2xl text-center px-4">
        <p className="text-lg text-slate-300 truncate transition-opacity duration-300">
          <span className="font-semibold text-slate-100">You: </span>
          {userTranscription || <span className="text-slate-500">...</span>}
        </p>
        <p className="mt-1 text-lg text-slate-300 truncate transition-opacity duration-300">
          <span className="font-semibold text-slate-100">AI: </span>
          {modelTranscription || <span className="text-slate-500">...</span>}
        </p>
      </div>

      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          onClick={onToggleMute}
          className={`flex items-center justify-center w-20 h-20 rounded-full transition-all transform hover:scale-105 shadow-lg ${isMuted ? 'bg-zinc-600 text-white' : 'bg-zinc-700/80 text-slate-300 hover:bg-zinc-600'}`}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <Icons.MicrophoneOff className="w-8 h-8" /> : <Icons.Microphone className="w-8 h-8" />}
        </button>

        <button
          onClick={onClose}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition-all transform hover:scale-105 shadow-lg"
          aria-label="Stop voice chat"
        >
          <Icons.StopCircle className="w-6 h-6" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
};