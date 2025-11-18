import React, { useRef, useEffect, useState } from 'react';
// FIX: Import AgentMessage and Agent from the centralized types.ts
import { AgentMessage, ChatFile, Agent } from '../types';
// FIX: Remove Agent from this import as it's now in types.ts
import { AgentIcon, Icons, FileIcon } from './icons';
import { WorkflowState } from '../types';
import { VoiceOverlay } from './VoiceOverlay';

interface ChatPanelProps {
    chatHistory: AgentMessage[];
    workflowState: WorkflowState;
    isAgentThinking: boolean;
    userInput: string;
    setUserInput: (value: string) => void;
    handleSendMessage: () => void;
    handleStopGeneration: () => void;
    currentAgent: Agent;
    handleRunDemo: () => void;
    handleStartNewProject: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileAttach: (e: React.ChangeEvent<HTMLInputElement>) => void;
    attachedFile: ChatFile | null;
    setAttachedFile: (file: ChatFile | null) => void;
    isComplexPrompt: boolean;
    // Prompt Enhancer props
    isEnhancingPrompt: boolean;
    handleEnhancePrompt: () => void;
    // Voice Chat Props
    isVoiceChatActive: boolean;
    handleToggleVoiceChat: () => void;
    currentUserTranscription: string;
    currentModelTranscription: string;
    isModelSpeaking: boolean;
    isMuted: boolean;
    handleToggleMute: () => void;
}

const AiThoughts: React.FC<{ thoughts: string }> = React.memo(({ thoughts }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mt-3 pt-3 border-t border-zinc-700/50">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors w-full"
                aria-expanded={isOpen}
            >
                <Icons.Brain className="w-3.5 h-3.5" />
                <span className="font-medium">View AI's Thoughts</span>
                <Icons.TriangleRight className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-2 p-2 bg-zinc-900/50 rounded-md text-xs text-slate-400 whitespace-pre-wrap font-mono border border-zinc-700/50">
                    {thoughts}
                </div>
            )}
        </div>
    );
});

export const ChatPanel: React.FC<ChatPanelProps> = React.memo(({
    chatHistory,
    workflowState,
    isAgentThinking,
    userInput,
    setUserInput,
    handleSendMessage,
    handleStopGeneration,
    currentAgent,
    handleRunDemo,
    handleStartNewProject,
    fileInputRef,
    handleFileAttach,
    attachedFile,
    setAttachedFile,
    isComplexPrompt,
    isEnhancingPrompt,
    handleEnhancePrompt,
    isVoiceChatActive,
    handleToggleVoiceChat,
    currentUserTranscription,
    currentModelTranscription,
    isModelSpeaking,
    isMuted,
    handleToggleMute,
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, currentUserTranscription, currentModelTranscription]);

    const isInputDisabled = isAgentThinking || isEnhancingPrompt || isVoiceChatActive || workflowState === 'DELIVERY';

    const getPlaceholderText = () => {
        if (workflowState === 'DELIVERY') return 'Project delivered. Start a new project to continue.';
        if (isEnhancingPrompt) return 'Enhancing your idea...';
        if (isAgentThinking) {
            if (workflowState === 'CODE_GENERATION' || workflowState === 'REVIEW') {
                return 'Frontend AI is generating code...';
            }
            return `${currentAgent} is responding...`;
        }
        return `Chat with the ${currentAgent} AI...`;
    };

    return (
        <div className="h-full flex flex-col bg-zinc-900 min-h-0 relative">
          {isVoiceChatActive && (
            <VoiceOverlay
              onClose={handleToggleVoiceChat}
              userTranscription={currentUserTranscription}
              modelTranscription={currentModelTranscription}
              isModelSpeaking={isModelSpeaking}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}
          <div className="flex-1 p-6 overflow-y-auto pb-40">
              <div className="space-y-6">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sky-400 flex-shrink-0"><AgentIcon agent={msg.agent} className="w-5 h-5" /></div>}
                    {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center font-bold text-white flex-shrink-0 order-2"><AgentIcon agent={msg.agent} className="w-5 h-5" /></div>}
                    <div className={`flex flex-col gap-1.5 max-w-xl ${msg.role === 'user' ? 'order-1 items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-400">{msg.agent}</span>
                           {msg.isVoiceMode && <Icons.Microphone className="w-3 h-3 text-slate-500" />}
                        </div>
                        <div className={`p-4 rounded-xl ${msg.isError ? 'bg-red-500/20 text-red-300' : (msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-slate-300')}`}>
                          {msg.file && (
                                <div className="mb-2 max-w-xs rounded-lg overflow-hidden">
                                    {msg.file.type.startsWith('image/') ? (
                                        <img src={msg.file.url} alt={msg.file.name} className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open(msg.file.url, '_blank')} />
                                    ) : msg.file.type.startsWith('video/') ? (
                                        <video src={msg.file.url} controls className="w-full h-auto" />
                                    ) : (
                                        <div className="p-2 bg-zinc-700 text-xs flex items-center gap-2 text-slate-300">
                                            <FileIcon name={msg.file.name} className="w-5 h-5" /> 
                                            <span>{msg.file.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                          {msg.isLoading ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm text-slate-400">Thinking</span>
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></div>
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          ) : msg.isGenerating ? (
                            <div className="flex flex-col text-sm space-y-2">
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span className="font-semibold">{isComplexPrompt ? "Thinking deeply..." : "Generating code..."}</span>
                                </div>
                                {isComplexPrompt && (
                                    <div className="pl-4 border-l-2 border-sky-500/50 text-xs text-slate-400">
                                        <p>Using <strong>Advanced AI Engine</strong> with an extended thinking budget to analyze your request. This allows for more thorough planning and better code quality.</p>
                                    </div>
                                )}
                            </div>
                          ) : ( <>
                              {msg.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>}
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-zinc-700/50"><h4 className="text-xs font-bold text-slate-400 mb-1.5">Sources:</h4><div className="space-y-1">{msg.sources.map((source, i) => (<a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="block text-xs text-sky-400 hover:underline truncate">{source.title || source.uri}</a>))}</div></div>
                              )}
                            </>)}
                          {msg.thoughts && <AiThoughts thoughts={msg.thoughts} />}
                        </div>
                    </div>
                  </div>
                ))}
                {workflowState === 'DELIVERY' && !isAgentThinking && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 border-t border-zinc-800 mt-8">
                        <button onClick={handleRunDemo} className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600 transition-colors"><Icons.Play className="w-5 h-5" />Run Demo Again</button>
                    </div>
                )}
                <div ref={chatEndRef} />
              </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900/90 to-transparent">
            <div className="max-w-4xl mx-auto">
                {attachedFile && (
                    <div className="p-2 bg-zinc-800 border-2 border-zinc-700/80 border-b-0 rounded-t-xl">
                        <div className="relative w-24 h-24 bg-zinc-700 rounded-md">
                            {attachedFile.type.startsWith('image/') ? (
                                <img src={attachedFile.url} alt={attachedFile.name} className="w-full h-full object-cover rounded-md" />
                            ) : attachedFile.type.startsWith('video/') ? (
                                <video src={attachedFile.url} className="w-full h-full object-cover rounded-md" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-1">
                                    <FileIcon name={attachedFile.name} className="w-8 h-8" />
                                    <span className="text-xs text-center break-all mt-1 leading-tight">{attachedFile.name}</span>
                                </div>
                            )}
                            <button
                                onClick={() => setAttachedFile(null)}
                                className="absolute -top-2 -right-2 bg-zinc-900 rounded-full p-0.5 text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
                                aria-label="Remove attached file"
                            >
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                <div className={`relative flex items-center w-full bg-zinc-800 border-2 border-zinc-700/80 focus-within:border-sky-500 shadow-lg ${attachedFile ? 'rounded-b-xl' : 'rounded-xl'} ${isAgentThinking || isEnhancingPrompt ? 'input-thinking' : ''} transition-all`}>
                    <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={getPlaceholderText()} className={`w-full bg-transparent text-white p-3 pl-4 ${isAgentThinking ? 'pr-28' : 'pr-48'} focus:outline-none resize-none ${attachedFile ? 'rounded-b-xl' : 'rounded-xl'}`} rows={1} disabled={isInputDisabled} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isAgentThinking ? (
                            <button
                                onClick={handleStopGeneration}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors"
                            >
                                <Icons.StopCircle className="w-4 h-4" />
                                Stop
                            </button>
                        ) : (
                            <>
                            <button onClick={handleEnhancePrompt} className="p-2 text-slate-400 hover:text-white transition-colors" title="Enhance prompt" disabled={isInputDisabled || !userInput.trim()}>
                                {isEnhancingPrompt ? <svg className="animate-spin h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <Icons.Sparkles className="w-5 h-5" />}
                            </button>
                            <div className="h-5 w-px bg-zinc-700 mx-1"></div>
                            <button onClick={handleToggleVoiceChat} className="p-2 text-slate-400 hover:text-white transition-colors" disabled={isInputDisabled}>
                                <Icons.Microphone className="w-5 h-5" />
                            </button>
                            <div className="h-5 w-px bg-zinc-700 mx-1"></div>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors" disabled={isInputDisabled}><Icons.Paperclip className="w-5 h-5" /></button>
                            <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" accept="image/*,video/*" />
                            <button onClick={handleSendMessage} className="p-2 text-slate-400 hover:text-white transition-colors" disabled={isInputDisabled || (!userInput.trim() && !attachedFile)}><Icons.Send className="w-5 h-5" /></button>
                            </>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
});
