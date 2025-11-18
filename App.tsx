import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { generateWebsiteCodeStream, getAgentResponse, getAgentResponseStream, connectLiveSession, createBlob, summarizeProjectForMemory, enhancePrompt } from './services/geminiService';
// FIX: Import Agent and AgentMessage from types.ts
import { GeneratedCode, ChatMessage, ChatFile, ApiHistoryItem, ApiPart, GeneratedFile, GroundingSource, AgentMessage, Agent, ProjectState, WorkflowState, KnowledgeBaseEntry } from './types';
import { managerSystemInstruction } from './prompts/agents/manager';
import { reviewerSystemInstruction } from './prompts/agents/reviewer';
import { voiceSystemInstruction } from './prompts/agents/voice';

import { WelcomeScreen } from './components/WelcomeScreen';
import { WorkflowSidebar } from './components/WorkflowSidebar';
import { ChatPanel } from './components/ChatPanel';
import { IdeViewPanel } from './components/IdeViewPanel';
import { EditableCodeEditor } from './components/EditableCodeEditor';
// FIX: Removed 'LiveSession' from import as it is not an exported member of '@google/genai'.
// FIX: Added 'FunctionDeclaration' and 'Type' for function calling.
import { LiveServerMessage, FunctionDeclaration, Type, Tool } from '@google/genai';

// FIX: AgentMessage interface has been moved to types.ts to be shared across components.

const samplePrd = `
# PRD: Personal Portfolio Website

## 1. Objectives
To create a modern, single-page personal portfolio website to showcase my skills, projects, and contact information to potential employers or clients.

## 2. Target Audience
Recruiters, hiring managers, and potential clients in the tech industry.

## 3. Feature List
-   A navigation bar with links to Home, About, Projects, and Contact sections.
-   A hero section with a headline, a short bio, and a call-to-action button.
-   An "About Me" section with a more detailed description of skills and experience.
-   A "Projects" section displaying project cards, each with an image, title, description, and link.
-   A simple "Contact Me" section with links to social/professional profiles (e.g., GitHub, LinkedIn).
-   A footer with copyright information.

## 4. Design & Style Guide
-   **Aesthetic:** Clean, modern, professional, minimalist.
-   **Color Palette:** A dark theme using shades of gray/charcoal, with a vibrant accent color (like electric blue or teal) for links, buttons, and highlights.
-   **Typography:** A clean, readable sans-serif font (e.g., Inter, Lato) for all text. Use different font weights to establish hierarchy.
-   **Layout:** Use flexbox and grid for a responsive layout that works on desktop and mobile.

## 5. Proposed File Structure
-   index.html
-   css/style.css
`;

// --- MAIN CONTENT COMPONENT (Refactored) ---
// This component was moved outside of the main App component to prevent it from being
// redefined on every render. This solves the bug where the chat input would lose focus
// on every keystroke because the entire component tree was being re-mounted.
interface MainContentPanelProps {
  currentProject: ProjectState | undefined;
  updateCurrentProject: (updates: Partial<ProjectState>) => void;
  handleNewProject: () => void;
  handleRunDemo: () => void;
  showIdeView: boolean;
  setShowIdeView: (show: boolean) => void;
  isMonacoReady: boolean;
  isAgentThinking: boolean;
  userInput: string;
  setUserInput: (value: string) => void;
  handleSendMessage: () => void;
  handleStopGeneration: () => void;
  currentAgent: Agent;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileAttach: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachedFile: ChatFile | null;
  setAttachedFile: (file: ChatFile | null) => void;
  handlePrdDecision: (approved: boolean) => void;
  // Prompt Enhancer Props
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

const MainContentPanel: React.FC<MainContentPanelProps> = ({
  currentProject, updateCurrentProject, handleNewProject, handleRunDemo, showIdeView,
  setShowIdeView, isMonacoReady, isAgentThinking, userInput, setUserInput,
  handleSendMessage, handleStopGeneration, currentAgent, fileInputRef, handleFileAttach, attachedFile, setAttachedFile,
  handlePrdDecision, isEnhancingPrompt, handleEnhancePrompt, isVoiceChatActive, handleToggleVoiceChat, currentUserTranscription, currentModelTranscription, isModelSpeaking,
  isMuted, handleToggleMute,
}) => {
    if (!currentProject || currentProject.workflowState === 'WELCOME') {
        // FIX: Renamed 'onStartNew' to 'onNewProject' to match the prop definition in WelcomeScreenProps.
        return <WelcomeScreen onNewProject={handleNewProject} onRunDemo={handleRunDemo} />;
    }
    
    if (currentProject.workflowState === 'PRD_REVIEW') {
        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-900"><h2 className="text-lg font-semibold">Product Requirements Document Review</h2><p className="text-sm text-slate-400">Review the generated requirements. You can edit the document directly. When ready, approve it to proceed.</p></div>
                <div className="flex-1 min-h-0"><EditableCodeEditor code={currentProject.prdContent} onCodeChange={(content) => updateCurrentProject({ prdContent: content })} fileName="PRD.md" /></div>
                <div className="flex-shrink-0 p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end items-center gap-4">
                    <span className="text-sm text-slate-400">Does this look right?</span>
                    <button onClick={() => handlePrdDecision(false)} className="px-4 py-2 rounded-md bg-zinc-600 hover:bg-zinc-500 transition-colors text-white font-medium">Request Changes</button>
                    <button onClick={() => handlePrdDecision(true)} className="px-6 py-2 rounded-md bg-sky-600 hover:bg-sky-500 transition-colors font-semibold text-white">Approve & Generate Code</button>
                </div>
            </div>
        );
    }

    if (['CODE_GENERATION', 'REVIEW', 'USER_REVIEW', 'DELIVERY'].includes(currentProject.workflowState)) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0 flex items-center justify-between bg-zinc-900 border-b border-zinc-800 p-2"><div className="text-sm font-semibold text-slate-300 px-2">{currentProject.workflowState.replace(/_/g, ' ')}</div><div><button onClick={() => setShowIdeView(!showIdeView)} className="px-3 py-1.5 bg-zinc-700 text-white rounded-md text-sm font-medium hover:bg-zinc-600 transition-colors">{showIdeView ? 'Show Chat' : 'Show Code & Preview'}</button></div></div>
                <div className="flex-1 min-h-0 transition-opacity duration-300">
                  {showIdeView ? (
                     <IdeViewPanel 
                        generatedCode={currentProject.generatedCode}
                        activeFile={currentProject.activeFile}
                        setActiveFile={(file) => updateCurrentProject({ activeFile: file })}
                        openFiles={currentProject.openFiles}
                        setOpenFiles={(files) => updateCurrentProject({ openFiles: typeof files === 'function' ? files(currentProject.openFiles) : files })}
                        prdContent={currentProject.prdContent}
                        handleCodeChange={(newCode) => {
                            if (!currentProject.activeFile) return;
                            if (currentProject.activeFile === 'PRD.md') {
                                updateCurrentProject({ prdContent: newCode });
                            } else {
                                updateCurrentProject({
                                    generatedCode: {
                                        ...currentProject.generatedCode,
                                        files: currentProject.generatedCode.files.map(f =>
                                            f.name === currentProject.activeFile ? { ...f, content: newCode } : f
                                        ),
                                    },
                                });
                            }
                        }}
                        handleFileSelect={(file) => {
                            const fileName = file.name;
                            if (!currentProject.openFiles.includes(fileName)) {
                                updateCurrentProject({ openFiles: [...currentProject.openFiles, fileName] });
                            }
                            updateCurrentProject({ activeFile: fileName });
                        }}
                        handleDownloadAll={() => {
                            // This logic is complex and better handled in the main App component
                        }}
                        workflowState={currentProject.workflowState}
                        isMonacoReady={isMonacoReady}
                        isAgentThinking={isAgentThinking}
                        handleStopGeneration={handleStopGeneration}
                     />
                  ) : (
                    <ChatPanel
                      chatHistory={currentProject.chatHistory}
                      workflowState={currentProject.workflowState}
                      isAgentThinking={isAgentThinking}
                      userInput={userInput}
                      setUserInput={setUserInput}
                      handleSendMessage={handleSendMessage}
                      handleStopGeneration={handleStopGeneration}
                      currentAgent={currentAgent}
                      handleRunDemo={handleRunDemo}
                      handleStartNewProject={handleNewProject}
                      fileInputRef={fileInputRef}
                      handleFileAttach={handleFileAttach}
                      attachedFile={attachedFile}
                      setAttachedFile={setAttachedFile}
                      isComplexPrompt={currentProject.isComplexPrompt}
                      isEnhancingPrompt={isEnhancingPrompt}
                      handleEnhancePrompt={handleEnhancePrompt}
                      isVoiceChatActive={isVoiceChatActive}
                      handleToggleVoiceChat={handleToggleVoiceChat}
                      currentUserTranscription={currentUserTranscription}
                      currentModelTranscription={currentModelTranscription}
                      isModelSpeaking={isModelSpeaking}
                      isMuted={isMuted}
                      handleToggleMute={handleToggleMute}
                  />
                  )}
                </div>
            </div>
        );
    }
    
    return <ChatPanel
        chatHistory={currentProject.chatHistory}
        workflowState={currentProject.workflowState}
        isAgentThinking={isAgentThinking}
        userInput={userInput}
        setUserInput={setUserInput}
        handleSendMessage={handleSendMessage}
        handleStopGeneration={handleStopGeneration}
        currentAgent={currentAgent}
        handleRunDemo={handleRunDemo}
        handleStartNewProject={handleNewProject}
        fileInputRef={fileInputRef}
        handleFileAttach={handleFileAttach}
        attachedFile={attachedFile}
        setAttachedFile={setAttachedFile}
        isComplexPrompt={currentProject.isComplexPrompt}
        isEnhancingPrompt={isEnhancingPrompt}
        handleEnhancePrompt={handleEnhancePrompt}
        isVoiceChatActive={isVoiceChatActive}
        handleToggleVoiceChat={handleToggleVoiceChat}
        currentUserTranscription={currentUserTranscription}
        currentModelTranscription={currentModelTranscription}
        isModelSpeaking={isModelSpeaking}
        isMuted={isMuted}
        handleToggleMute={handleToggleMute}
    />;
}

// Helper to convert chat messages to the API format, prioritizing raw `apiContent`
// to ensure agent commands are preserved in the conversation history for the model.
const msgToApiHistoryItem = (msg: AgentMessage): ApiHistoryItem => {
    const textForApi = msg.apiContent ?? msg.content;
    const parts: ApiPart[] = [];

    if (textForApi) {
        parts.push({ text: textForApi });
    }
    if (msg.file) {
        parts.push({ inlineData: { mimeType: msg.file.type, data: msg.file.data } });
    }
    // API requires at least one part. This case should not be hit with current
    // UI logic (send button is disabled), but it's a safe fallback.
    if (parts.length === 0) {
        parts.push({ text: '' });
    }
    
    return { role: msg.role, parts };
};


// --- AUDIO DECODING UTILITIES ---
// This must be defined at a scope accessible by the component, or imported.
/** Decodes a Base64 string into raw audio bytes. */
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that the browser can play.
 * The browser's native `decodeAudioData` is for file formats like MP3/WAV, not raw streams.
 */
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


// --- MAIN APP COMPONENT ---
export default function App() {
  // --- STATE MANAGEMENT ---
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [attachedFile, setAttachedFile] = useState<ChatFile | null>(null);
  const [showIdeView, setShowIdeView] = useState(false);
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  
  // Voice Chat State
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [currentUserTranscription, setCurrentUserTranscription] = useState('');
  const [currentModelTranscription, setCurrentModelTranscription] = useState('');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [triggerPrdGeneration, setTriggerPrdGeneration] = useState(false);
  
  // --- REFS FOR ASYNC OPERATIONS & CALLBACKS ---
  // Refs for state that needs to be accessed in callbacks without causing re-renders
  const projectsRef = useRef(projects);
  const currentProjectIdRef = useRef(currentProjectId);
  const knowledgeBaseRef = useRef(knowledgeBase);
  const isMutedRef = useRef(isMuted);
  const isGenerationCancelledRef = useRef(false);

  // Refs to hold the latest versions of our core async functions to prevent
  // dependency cycles in useCallbacks and avoid stale closures.
  const generateCodeRef = useRef<(prompt: string, history: AgentMessage[], projectId: number) => Promise<void>>();
  const reviewCodeRef = useRef<(code: GeneratedCode, history: AgentMessage[], projectId: number) => Promise<void>>();
  const handleAgentResponseRef = useRef<(history: ApiHistoryItem[], projectId?: number) => Promise<void>>();

  // Refs for managing Web Audio API and Media Streams
  const liveSessionPromiseRef = useRef<ReturnType<typeof connectLiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextAudioStartTimeRef = useRef(0);
  const userTranscriptionRef = useRef('');
  const modelTranscriptionRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE SYNCHRONIZATION WITH REFS ---
  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { currentProjectIdRef.current = currentProjectId; }, [currentProjectId]);
  useEffect(() => { knowledgeBaseRef.current = knowledgeBase; }, [knowledgeBase]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);
  
  const isAnyAgentWorking = useMemo(() => 
    isAgentThinking || isEnhancingPrompt || (currentProject?.chatHistory.some(m => m.isLoading || m.isGenerating) ?? false),
    [isAgentThinking, isEnhancingPrompt, currentProject?.chatHistory]
  );

  // --- LOCAL STORAGE & PROJECT MANAGEMENT ---
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('ai-team-chat-history');
      if (savedProjects) {
        const parsedProjects: ProjectState[] = JSON.parse(savedProjects);
        if (parsedProjects.length > 0) {
          setProjects(parsedProjects);
        }
      }
      const savedKnowledge = localStorage.getItem('ai-team-knowledge-base');
      if (savedKnowledge) {
        setKnowledgeBase(JSON.parse(savedKnowledge));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    const debounceSave = setTimeout(() => {
      if (projects.length > 0) {
        localStorage.setItem('ai-team-chat-history', JSON.stringify(projects));
      } else {
        localStorage.removeItem('ai-team-chat-history');
      }
    }, 500);
    return () => clearTimeout(debounceSave);
  }, [projects]);

  useEffect(() => {
    const debounceSave = setTimeout(() => {
        localStorage.setItem('ai-team-knowledge-base', JSON.stringify(knowledgeBase));
    }, 500);
    return () => clearTimeout(debounceSave);
  }, [knowledgeBase]);
  
  const updateProjectById = useCallback((projectId: number, updates: Partial<ProjectState> | ((p: ProjectState) => Partial<ProjectState>)) => {
    setProjects(prevProjects => {
      return prevProjects.map(p => {
        if (p.id === projectId) {
            const actualUpdates = typeof updates === 'function' ? updates(p) : updates;
            return { ...p, ...actualUpdates };
        }
        return p;
      });
    });
  }, []);

  const updateCurrentProject = useCallback((updates: Partial<ProjectState> | ((p: ProjectState) => Partial<ProjectState>)) => {
    const currentId = currentProjectIdRef.current;
    if (currentId === null) return;
    updateProjectById(currentId, updates);
  }, [updateProjectById]);

  const handleNewProject = useCallback(() => {
    const newProject: ProjectState = {
      id: Date.now(),
      title: 'New Project',
      workflowState: 'REQUIREMENT_GATHERING',
      chatHistory: [],
      generatedCode: { files: [] },
      prdContent: '',
      openFiles: [],
      activeFile: null,
      isComplexPrompt: false,
    };
    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    setShowIdeView(false);
    setUserInput('');
    setAttachedFile(null);
  }, []);

  const handleDeleteProject = useCallback((idToDelete: number) => {
    setProjects(prev => {
      const newProjects = prev.filter(p => p.id !== idToDelete);
      if (currentProjectId === idToDelete) {
        if (newProjects.length > 0) {
          setCurrentProjectId(newProjects[0].id);
        } else {
          setCurrentProjectId(null);
        }
      }
      return newProjects;
    });
  }, [currentProjectId]);

  const handleClearMemory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the AI's memory? This cannot be undone.")) {
      setKnowledgeBase([]);
    }
  }, []);

  const learnFromProject = useCallback(async (projectId: number) => {
    const knowledgeBase = knowledgeBaseRef.current;
    if (knowledgeBase.some(k => k.id === projectId)) return;

    const project = projectsRef.current.find(p => p.id === projectId);
    if (!project) return;
    
    try {
        const summary = await summarizeProjectForMemory(project);
        const newMemoryEntry: KnowledgeBaseEntry = { id: project.id, title: project.title, summary };
        setKnowledgeBase(prev => [...prev, newMemoryEntry]);
    } catch (error) {
        console.error(`Failed to learn from project ${projectId}:`, error);
    }
  }, []);


  useEffect(() => {
    const monacoPromise = (window as any).__MONACO_INIT_PROMISE__;
    if (monacoPromise) {
        monacoPromise.then(() => setIsMonacoReady(true)).catch((err: any) => console.error("[App] Monaco initialization promise failed:", err));
    }
  }, []);
  
  useEffect(() => {
    if (triggerPrdGeneration) {
      setTriggerPrdGeneration(false);
      const project = projectsRef.current.find(p => p.id === currentProjectIdRef.current);
      if (project) {
        handleAgentResponseRef.current?.(project.chatHistory.map(msgToApiHistoryItem), project.id);
      }
    }
  }, [triggerPrdGeneration]);

  const currentAgent = useMemo((): Agent => {
    const state = currentProject?.workflowState;
    switch (state) {
      case 'WELCOME': case 'REQUIREMENT_GATHERING': case 'PLANNING': case 'PRD_REVIEW': case 'USER_REVIEW': return 'Manager';
      case 'CODE_GENERATION': return 'Frontend';
      case 'REVIEW': return 'Reviewer';
      default: return 'User';
    }
  }, [currentProject]);

  const handleToggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  const stopVoiceChat = useCallback(async () => {
    setIsVoiceChatActive(false);
    setIsModelSpeaking(false);
    setIsMuted(false);

    liveSessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing live session:", e));
    liveSessionPromiseRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    if (scriptProcessorRef.current) {
        // FIX: Passing argument 0 to satisfy older/quirky Web Audio API implementations that may not support the no-argument version, based on similar `stop(0)` fixes.
        (scriptProcessorRef.current as any).disconnect(0);
    }
    scriptProcessorRef.current = null;

    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      // FIX: Passing a non-standard argument 0 to satisfy a quirky Web Audio API implementation that throws an "Expected 1 arguments, but got 0" error, matching similar fixes in this file.
      await (inputAudioContextRef.current as any).close(0);
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      // FIX: Passing a non-standard argument 0 to satisfy a quirky Web Audio API implementation that throws an "Expected 1 arguments, but got 0" error, matching similar fixes in this file.
      await (outputAudioContextRef.current as any).close(0);
    }

    // FIX: The `.stop()` method is called with one argument `0` to stop immediately, which is valid.
    audioSourcesRef.current.forEach(source => (source as any).stop(0));
    audioSourcesRef.current.clear();
    nextAudioStartTimeRef.current = 0;

    userTranscriptionRef.current = ''; modelTranscriptionRef.current = '';
    setCurrentUserTranscription(''); setCurrentModelTranscription('');
  }, []);

  const startVoiceChat = useCallback(async () => {
      if (isVoiceChatActive) return;
      setIsVoiceChatActive(true);

      try {
          mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          nextAudioStartTimeRef.current = 0;

          const endConversationTool: FunctionDeclaration = { name: 'endConversationAndCreatePrd', description: 'Ends the voice conversation and begins the PRD creation process.', parameters: { type: Type.OBJECT, properties: { summary: { type: Type.STRING, description: 'A comprehensive summary of all user requirements.' } }, required: ['summary'] } };
          const tools: Tool[] = [{ functionDeclarations: [endConversationTool] }];

          liveSessionPromiseRef.current = connectLiveSession(voiceSystemInstruction, {
              onopen: () => {
                  if (!mediaStreamRef.current || !inputAudioContextRef.current) return;
                  const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                  scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                  scriptProcessorRef.current.onaudioprocess = (e) => {
                      if (isMutedRef.current) return;
                      liveSessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: createBlob(e.inputBuffer.getChannelData(0)) }));
                  };
                  source.connect(scriptProcessorRef.current);
                  scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
              },
              onmessage: async (message: LiveServerMessage) => {
                  if (message.toolCall) {
                    for (const fc of message.toolCall.functionCalls) {
                      if (fc.name === 'endConversationAndCreatePrd' && fc.args.summary) {
                        liveSessionPromiseRef.current?.then(session => session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "OK" } }] }));
                        await stopVoiceChat();
                        setTriggerPrdGeneration(true);
                        return;
                      }
                    }
                  }

                  if (message.serverContent?.outputTranscription) {
                      modelTranscriptionRef.current += message.serverContent.outputTranscription.text;
                      setCurrentModelTranscription(modelTranscriptionRef.current);
                  } else if (message.serverContent?.inputTranscription) {
                      userTranscriptionRef.current += message.serverContent.inputTranscription.text;
                      setCurrentUserTranscription(userTranscriptionRef.current);
                  }

                  if (message.serverContent?.turnComplete) {
                      setIsModelSpeaking(false);
                      const fullInput = userTranscriptionRef.current.trim();
                      const fullOutput = modelTranscriptionRef.current.trim();
                      
                      const newMessages: AgentMessage[] = [];
                      if (fullInput) newMessages.push({ agent: 'User', role: 'user', content: fullInput, isVoiceMode: true });
                      if (fullOutput) newMessages.push({ agent: currentAgent, role: 'model', content: fullOutput, isVoiceMode: true });
                      
                      if (newMessages.length > 0) updateCurrentProject(p => ({ chatHistory: [...p.chatHistory, ...newMessages] }));
                      
                      userTranscriptionRef.current = ''; modelTranscriptionRef.current = '';
                      setCurrentUserTranscription(''); setCurrentModelTranscription('');
                  }

                  const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                  if (base64Audio && outputAudioContextRef.current) {
                      setIsModelSpeaking(true);
                      nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, outputAudioContextRef.current.currentTime);
                      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                      const source = outputAudioContextRef.current.createBufferSource();
                      source.buffer = audioBuffer;
                      source.connect(outputAudioContextRef.current.destination);
                      source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                      source.start(nextAudioStartTimeRef.current);
                      nextAudioStartTimeRef.current += audioBuffer.duration;
                      audioSourcesRef.current.add(source);
                  }
                  
                  if (message.serverContent?.interrupted) {
                    setIsModelSpeaking(false);
                    // FIX: The error "Expected 1 arguments, but got 0" suggests the environment's Web Audio API types are outdated. Passing 0 to stop() means "stop immediately" and satisfies older implementations.
                    audioSourcesRef.current.forEach(source => (source as any).stop(0));
                    audioSourcesRef.current.clear();
                    nextAudioStartTimeRef.current = 0;
                  }
              },
              onerror: (e: ErrorEvent) => { console.error('Live session error:', e); stopVoiceChat(); },
              onclose: (_e: CloseEvent) => { console.log('Live session closed.'); },
          }, tools);
      } catch (error) {
          console.error("Failed to start voice chat:", error);
          alert(`Could not start voice chat. Error: ${error instanceof Error ? error.message : 'Unknown'}`);
          stopVoiceChat();
      }
  }, [isVoiceChatActive, stopVoiceChat, currentAgent, updateCurrentProject]);
  
  const handleToggleVoiceChat = useCallback(() => { isVoiceChatActive ? stopVoiceChat() : startVoiceChat(); }, [isVoiceChatActive, startVoiceChat, stopVoiceChat]);

  // --- CORE AI WORKFLOW FUNCTIONS ---

  const reviewCode = useCallback(async (code: GeneratedCode, historySoFar: AgentMessage[], projectId: number) => {
      const project = projectsRef.current.find(p => p.id === projectId);
      if (!project) {
        console.error(`reviewCode could not find project with ID: ${projectId}`);
        return;
      }

      updateProjectById(projectId, { workflowState: 'REVIEW' });
      const reviewerMessagePlaceholder: AgentMessage = { agent: 'Reviewer', role: 'model', content: '', isLoading: true };
      updateProjectById(projectId, { chatHistory: [...historySoFar, reviewerMessagePlaceholder] });

      const codeFilesString = code.files.map(f => `\`\`\`${f.name}\n${f.content}\n\`\`\``).join('\n\n');
      const reviewerPrompt = `Here is the PRD:\n\n${project.prdContent}\n\nAnd here is the generated code:\n\n${codeFilesString}`;
      
      try {
          const response = await getAgentResponse([{ role: 'user', parts: [{text: reviewerPrompt}] }], reviewerSystemInstruction);
          const isApproved = response.rawText.includes('[REVIEW_APPROVED]');
          const rejectionFeedback = response.text.replace('[REVIEW_REJECTED]', '').trim();
          
          const reviewerResponseMessage: AgentMessage = {
              agent: 'Reviewer', role: 'model', thoughts: response.thoughts,
              content: isApproved ? "Code passed all checks. The project is now ready for your review." : `Review found issues:\n${rejectionFeedback}`,
              apiContent: response.rawText,
          };
          const nextHistory = [...historySoFar, reviewerResponseMessage];
          
          if (isApproved) {
            updateProjectById(projectId, { chatHistory: nextHistory, workflowState: 'USER_REVIEW' });
            await handleAgentResponseRef.current?.(nextHistory.map(msgToApiHistoryItem), projectId);
          } else {
            const managerFixingMessage: AgentMessage = { agent: 'Manager', role: 'model', content: "The Reviewer AI found some issues. I'm sending it back to our Frontend AI for corrections." };
            const historyForGenerator = [...nextHistory, managerFixingMessage];
            updateProjectById(projectId, { chatHistory: historyForGenerator, workflowState: 'CODE_GENERATION' });

            const fixPrompt = `The previous code generation was rejected by the reviewer. Please fix the following issues and regenerate ALL the files. Do not apologize, just provide the corrected code.\n\n**Reviewer Feedback:**\n${rejectionFeedback}\n\n---\n\n**Original Product Requirements Document (for context):**\n${project.prdContent}`;
            setTimeout(() => generateCodeRef.current?.(fixPrompt, historyForGenerator, projectId), 0);
          }
      } catch (error) {
          console.error("Review error:", error);
          const errorMessage: AgentMessage = { agent: 'Reviewer', role: 'model', content: `Review error: ${error instanceof Error ? error.message : ''}`, isError: true };
          updateProjectById(projectId, { chatHistory: [...historySoFar, errorMessage], workflowState: 'DELIVERY' });
          if (currentProjectIdRef.current === projectId) setShowIdeView(true);
      }
  }, [updateProjectById]);

  const generateCode = useCallback(async (prompt: string, historySoFar: AgentMessage[], projectId: number) => {
    isGenerationCancelledRef.current = false;
    const initialProjectState = projectsRef.current.find(p => p.id === projectId);
    if (!initialProjectState) return;

    const frontendMessage: AgentMessage = { agent: 'Frontend', role: 'model', content: '', isGenerating: true };
    updateProjectById(projectId, { chatHistory: [...historySoFar, frontendMessage] });
    if (currentProjectIdRef.current === projectId) setShowIdeView(true);
    updateProjectById(projectId, p => ({ openFiles: ['PRD.md', ...p.openFiles.filter(f => f !== 'PRD.md')] }));
    
    const tempFiles = new Map<string, GeneratedFile>(initialProjectState.generatedCode.files.map(f => [f.name, f]));

    try {
        const stream = generateWebsiteCodeStream(prompt, initialProjectState.isComplexPrompt);
        for await (const chunk of stream) {
            if (isGenerationCancelledRef.current) break;
            if ('thoughts' in chunk) {
                updateProjectById(projectId, p => ({ chatHistory: p.chatHistory.map(m => m.isGenerating ? { ...m, thoughts: chunk.thoughts } : m) }));
            } else {
                tempFiles.set(chunk.name, chunk);
                updateProjectById(projectId, { generatedCode: { files: Array.from(tempFiles.values()) } });
                if (chunk.name.endsWith('.html')) {
                    updateProjectById(projectId, p => p.openFiles.includes(chunk.name) ? {} : { openFiles: [...p.openFiles, chunk.name] });
                }
            }
        }

        if (isGenerationCancelledRef.current) {
            console.log('Code generation stopped by user.');
            return;
        }

        const finalCode = { files: Array.from(tempFiles.values()) };
        
        const activeFileUpdate = (p: ProjectState) => {
          if (p.activeFile && tempFiles.has(p.activeFile)) return p.activeFile;
          const mainHtml = finalCode.files.find(f => f.name === 'index.html') || finalCode.files.find(f => f.name.endsWith('.html'));
          return mainHtml?.name ?? finalCode.files[0]?.name ?? null;
        }
        updateProjectById(projectId, p => ({ generatedCode: finalCode, activeFile: activeFileUpdate(p) }));
        
        const finalGenMessage: AgentMessage = { ...frontendMessage, isGenerating: false, content: 'Code generation complete. Sending for review.' };
        const historyWithGenMessage = [...historySoFar, finalGenMessage];
        updateProjectById(projectId, { chatHistory: historyWithGenMessage });
        await reviewCodeRef.current?.(finalCode, historyWithGenMessage, projectId);
    } catch (error) {
        console.error("Code generation error:", error);
        const errorMessage: AgentMessage = { agent: 'Frontend', role: 'model', content: `Code generation error: ${error instanceof Error ? error.message : ''}`, isError: true };
        updateProjectById(projectId, p => ({ chatHistory: p.chatHistory.map(m => m.isGenerating ? errorMessage : m), workflowState: 'PRD_REVIEW' }));
    }
  }, [updateProjectById]);
  
  const handleAgentResponse = useCallback(async (history: ApiHistoryItem[], projectId?: number) => {
      isGenerationCancelledRef.current = false;
      const activeProjectId = projectId ?? currentProjectIdRef.current;
      if (activeProjectId === null) {
          setIsAgentThinking(false);
          return;
      }
      
      const projectForThisTurn = projectsRef.current.find(p => p.id === activeProjectId);
      if (!projectForThisTurn) {
          setIsAgentThinking(false);
          return;
      }

      setIsAgentThinking(true);

      const agentForThisTurn = ((): Agent => {
          const state = projectForThisTurn.workflowState;
          switch (state) {
            case 'WELCOME': case 'REQUIREMENT_GATHERING': case 'PLANNING': case 'PRD_REVIEW': case 'USER_REVIEW': return 'Manager';
            case 'CODE_GENERATION': return 'Frontend';
            case 'REVIEW': return 'Reviewer';
            default: return 'User';
          }
      })();
      
      if (history.length > 0) {
        const agentMessagePlaceholder: AgentMessage = { agent: agentForThisTurn, role: 'model', content: '', isLoading: true };
        updateProjectById(activeProjectId, p => ({ chatHistory: [...p.chatHistory, agentMessagePlaceholder] }));
      }
      
      let fullResponseText = ''; let sources: GroundingSource[] | undefined;
      
      let systemInstruction = managerSystemInstruction;
      const knowledgeBase = knowledgeBaseRef.current;
      if (agentForThisTurn === 'Manager' && knowledgeBase.length > 0) {
          const knowledgePreamble = `**Previous Project Knowledge Base:**\n${knowledgeBase.map(k => `*   **Project: "${k.title}"**\n    *   Summary: ${k.summary}`).join('\n\n')}\n\n---\n\n`;
          systemInstruction = knowledgePreamble + managerSystemInstruction;
      }
      
      const tools = agentForThisTurn === 'Manager' ? [{googleSearch: {}}] : undefined;

      try {
          const stream = getAgentResponseStream(history, systemInstruction, tools);
          for await (const chunk of stream) {
              if (isGenerationCancelledRef.current) break;
              if (chunk.sources && !sources) sources = chunk.sources;
              fullResponseText += chunk.textChunk;
              
              updateProjectById(activeProjectId, p => ({ 
                chatHistory: p.chatHistory.map(m => m.isLoading ? { ...m, content: fullResponseText, sources, ...(chunk.thoughts && !m.thoughts && { thoughts: chunk.thoughts }) } : m)
              }));
          }

          if (isGenerationCancelledRef.current) {
              console.log('Agent response stopped by user.');
              return;
          }
          
          const finalRawResponse = fullResponseText;
          const generateMatch = finalRawResponse.match(/\[GENERATE\]\s*([\s\S]*)/);
          const completeMatch = finalRawResponse.match(/\[PROJECT_COMPLETE\]\s*([\s\S]*)/);
          const prdMatch = finalRawResponse.match(/\[CREATE_PRD\]\s*([\s\S]*)/);
          
          if (prdMatch) {
              const prdContent = prdMatch[1];
              const titleMatch = prdContent.match(/^(?:# PRD:|\*\*Project Title:\*\*|Project Title:)\s*(.*)/im);
              const newTitle = titleMatch ? titleMatch[1].trim() : "Generated Project";

              updateProjectById(activeProjectId, p => {
                const historyWithoutPlaceholder = p.chatHistory.filter(m => !m.isLoading);
                const finalMessage: AgentMessage = { agent: 'Manager', role: 'model', content: "I'm drafting the Product Requirements Document (PRD)...", sources, apiContent: finalRawResponse };
                return {
                  title: p.title === 'New Project' ? newTitle : p.title,
                  prdContent: prdContent,
                  workflowState: 'PRD_REVIEW',
                  activeFile: 'PRD.md',
                  openFiles: ['PRD.md', ...p.openFiles],
                  chatHistory: [...historyWithoutPlaceholder, finalMessage]
                };
              });
          } else if (generateMatch) {
              updateProjectById(activeProjectId, p => {
                const historyWithoutPlaceholder = p.chatHistory.filter(m => !m.isLoading);
                const managerMessageText = "Great! I'm handing off to our Frontend AI to start building.";
                const finalMessage: AgentMessage = { agent: 'Manager', role: 'model', content: managerMessageText, sources, apiContent: finalRawResponse };
                const historyForGenerator = [...historyWithoutPlaceholder, finalMessage];
                setTimeout(() => generateCodeRef.current?.(generateMatch[1], historyForGenerator, activeProjectId), 0);
                return {
                  chatHistory: historyForGenerator,
                  workflowState: 'CODE_GENERATION'
                }
              });
          } else if (completeMatch) {
              learnFromProject(activeProjectId);
              updateProjectById(activeProjectId, p => {
                const historyWithoutPlaceholder = p.chatHistory.filter(m => !m.isLoading);
                const finalMessage: AgentMessage = { agent: 'Manager', role: 'model', content: completeMatch[1].trim() || "Project is complete!", apiContent: finalRawResponse };
                if (currentProjectIdRef.current === activeProjectId) setShowIdeView(true);
                return {
                  chatHistory: [...historyWithoutPlaceholder, finalMessage],
                  workflowState: 'DELIVERY'
                }
              });
          } else {
              updateProjectById(activeProjectId, p => ({
                chatHistory: p.chatHistory.map(m => m.isLoading || (history.length === 0 && m.role === 'model') ? { ...m, isLoading: false, content: finalRawResponse, apiContent: finalRawResponse, sources } : m)
              }));
          }
      } catch (error) {
          console.error("Agent error:", error);
          const errorMessage: AgentMessage = { agent: agentForThisTurn, role: 'model', content: `Error: ${error instanceof Error ? error.message : ''}`, isError: true };
          updateProjectById(activeProjectId, p => ({ chatHistory: [...p.chatHistory.filter(m => !m.isLoading), errorMessage] }));
      } finally {
          setIsAgentThinking(false);
      }
  }, [updateProjectById, learnFromProject]);

  // Update refs on every render to ensure they are always fresh for callbacks
  useEffect(() => {
    generateCodeRef.current = generateCode;
    reviewCodeRef.current = reviewCode;
    handleAgentResponseRef.current = handleAgentResponse;
  });

  useEffect(() => {
    const isNewProject = currentProject && currentProject.chatHistory.length === 0 && !isAgentThinking && currentProject.workflowState === 'REQUIREMENT_GATHERING';
    if (isNewProject) {
        const agentMessagePlaceholder: AgentMessage = { agent: 'Manager', role: 'model', content: '', isLoading: true };
        updateCurrentProject({ chatHistory: [agentMessagePlaceholder] });
        handleAgentResponseRef.current?.([], currentProject.id);
    }
  }, [currentProject, isAgentThinking, updateCurrentProject]);

  const handleSendMessage = useCallback(async () => {
    if ((!userInput.trim() && !attachedFile) || !currentProject) return;
    const userMessage: AgentMessage = { agent: 'User', role: 'user', content: userInput, ...(attachedFile && { file: attachedFile }) };
    const newChatHistory = [...currentProject.chatHistory, userMessage];
    updateCurrentProject({ chatHistory: newChatHistory });
    setUserInput('');
    setAttachedFile(null);
    await handleAgentResponseRef.current?.(newChatHistory.map(msgToApiHistoryItem));
  }, [userInput, attachedFile, currentProject, updateCurrentProject]);
  
  const handleEnhancePrompt = useCallback(async () => {
      if (!userInput.trim() || isEnhancingPrompt) return;
      setIsEnhancingPrompt(true);
      try {
          const enhanced = await enhancePrompt(userInput);
          setUserInput(enhanced);
      } catch (error) {
          console.error("Failed to enhance prompt:", error);
          // Optionally, inform the user about the failure
      } finally {
          setIsEnhancingPrompt(false);
      }
  }, [userInput, isEnhancingPrompt]);

  const handleStopGeneration = useCallback(() => {
    console.log("Stopping generation...");
    isGenerationCancelledRef.current = true;
    setIsAgentThinking(false);

    // If stopping during code generation/review, switch back to the chat view
    // to show the confirmation message and allow the user to continue the conversation.
    const project = projectsRef.current.find(p => p.id === currentProjectIdRef.current);
    if (project && (project.workflowState === 'CODE_GENERATION' || project.workflowState === 'REVIEW')) {
        setShowIdeView(false);
    }

    updateCurrentProject(p => {
        const stopMessage: AgentMessage = {
            agent: 'Manager',
            role: 'model',
            content: 'Operation cancelled by the user.',
        };

        const newChatHistory = [
            ...p.chatHistory.filter(m => !m.isLoading && !m.isGenerating),
            stopMessage,
        ];

        // Revert to a state where the user can give new instructions to the Manager AI.
        const newWorkflowState = (p.workflowState === 'CODE_GENERATION' || p.workflowState === 'REVIEW')
            ? 'USER_REVIEW'
            : p.workflowState;

        return {
            chatHistory: newChatHistory,
            workflowState: newWorkflowState,
        };
    });
  }, [updateCurrentProject, setShowIdeView]);

  const handlePrdDecision = useCallback((approved: boolean) => {
      if (!currentProject) return;
      const message = approved ? "The PRD is approved. Please proceed." : "I have feedback on the PRD.";
      const userMessage: AgentMessage = { agent: 'User', role: 'user', content: message };
      const newHistory = [...currentProject.chatHistory, userMessage];
      const apiHistory = newHistory.map(msgToApiHistoryItem);
      
      updateCurrentProject({ chatHistory: newHistory, workflowState: 'USER_REVIEW' });
      setShowIdeView(false);
      handleAgentResponseRef.current?.(apiHistory);
  }, [currentProject, updateCurrentProject]);

  const handleRunDemo = useCallback(async () => {
    const demoStartMessage: AgentMessage = { agent: 'Manager', role: 'model', content: "Demo initiated with a sample portfolio PRD." };
    const historyForGenerator = [demoStartMessage];
    
    const newDemoProject: ProjectState = {
      id: Date.now(),
      title: "Demo Project",
      workflowState: 'CODE_GENERATION',
      chatHistory: historyForGenerator,
      generatedCode: { files: [] },
      prdContent: samplePrd,
      openFiles: [],
      activeFile: null,
      isComplexPrompt: false,
    };
    
    setProjects(prev => [newDemoProject, ...prev]);
    setCurrentProjectId(newDemoProject.id);
    setShowIdeView(false);
    setUserInput('');
    setAttachedFile(null);
    
    const frontendPrompt = `Generate a website based on this PRD:\n\n${samplePrd}`;
    setTimeout(() => generateCodeRef.current?.(frontendPrompt, historyForGenerator, newDemoProject.id), 0);
  }, []);

  return (
    <main className="flex h-screen bg-zinc-900 text-white font-sans">
      <WorkflowSidebar 
        projects={projects}
        currentProjectId={currentProjectId}
        onNewProject={handleNewProject}
        onSelectProject={setCurrentProjectId}
        onDeleteProject={handleDeleteProject}
        currentWorkflowState={currentProject?.workflowState || 'WELCOME'} 
        isComplex={currentProject?.isComplexPrompt || false}
        onComplexPromptChange={(isComplex) => updateCurrentProject({isComplexPrompt: isComplex})} 
        knowledgeBaseSize={knowledgeBase.length}
        onClearMemory={handleClearMemory}
      />
      <div className="flex-1 flex flex-col min-h-0">
          <MainContentPanel
            currentProject={currentProject}
            updateCurrentProject={updateCurrentProject}
            handleNewProject={handleNewProject}
            handleRunDemo={handleRunDemo}
            showIdeView={showIdeView}
            setShowIdeView={setShowIdeView}
            isMonacoReady={isMonacoReady}
            isAgentThinking={isAnyAgentWorking}
            userInput={userInput}
            setUserInput={setUserInput}
            handleSendMessage={handleSendMessage}
            handleStopGeneration={handleStopGeneration}
            currentAgent={currentAgent}
            fileInputRef={fileInputRef}
            handleFileAttach={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64Data = (event.target?.result as string).split(',')[1];
                setAttachedFile({ name: file.name, type: file.type, url: URL.createObjectURL(file), data: base64Data });
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            handlePrdDecision={handlePrdDecision}
            isEnhancingPrompt={isEnhancingPrompt}
            handleEnhancePrompt={handleEnhancePrompt}
            isVoiceChatActive={isVoiceChatActive}
            handleToggleVoiceChat={handleToggleVoiceChat}
            currentUserTranscription={currentUserTranscription}
            currentModelTranscription={currentModelTranscription}
            isModelSpeaking={isModelSpeaking}
            isMuted={isMuted}
            handleToggleMute={handleToggleMute}
          />
      </div>
    </main>
  );
}