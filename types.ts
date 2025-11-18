



export type GeneratedFileType = 'html' | 'css' | 'js' | 'md' | 'jpeg' | 'jpg' | 'png' | 'svg' | 'gif' | 'mp4';

export interface GeneratedFile {
  name: string;
  content: string;
  type: GeneratedFileType;
}

export interface GeneratedCode {
  files: GeneratedFile[];
}

export interface ChatFile {
  name:string;
  type: string;
  url: string; // Preview URL for images, or a generic placeholder
  data: string; // Base64 encoded data for API
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  file?: ChatFile;
  isLoading?: boolean;
  isGenerating?: boolean;
  isError?: boolean;
  sources?: GroundingSource[];
  onSelectVeoApiKey?: () => void;
  thoughts?: string;
  isVoiceMode?: boolean;
}

// FIX: Add Agent and AgentMessage types
export type Agent = 'User' | 'Manager' | 'Frontend' | 'Reviewer' | 'Backend' | 'Integration';

export interface AgentMessage extends ChatMessage {
  agent: Agent;
  apiContent?: string; // Add for preserving raw AI responses for context
}


// For API communication
export type ApiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
export interface ApiHistoryItem {
    role: 'user' | 'model';
    parts: ApiPart[];
}

// --- NEW ---
export interface KnowledgeBaseEntry {
  id: number; // Corresponds to the project ID
  title: string;
  summary: string; // AI-generated summary of the project
}
export type WorkflowState = 'WELCOME' | 'REQUIREMENT_GATHERING' | 'PLANNING' | 'PRD_REVIEW' | 'CODE_GENERATION' | 'REVIEW' | 'USER_REVIEW' | 'DELIVERY';
export const WORKFLOW_STATES: WorkflowState[] = ['REQUIREMENT_GATHERING', 'PLANNING', 'PRD_REVIEW', 'CODE_GENERATION', 'REVIEW', 'USER_REVIEW', 'DELIVERY'];

export interface ProjectState {
  id: number; // Using timestamp for unique ID
  title: string;
  workflowState: WorkflowState;
  chatHistory: AgentMessage[];
  generatedCode: GeneratedCode;
  prdContent: string;
  openFiles: string[];
  activeFile: string | null;
  isComplexPrompt: boolean;
}