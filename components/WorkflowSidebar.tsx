import React, { useState } from 'react';
import { Icons, AnimatedCheckmark } from './icons';
import { ProjectState, WorkflowState, WORKFLOW_STATES } from '../types';


interface WorkflowSidebarProps {
  projects: ProjectState[];
  currentProjectId: number | null;
  onNewProject: () => void;
  onSelectProject: (id: number) => void;
  onDeleteProject: (id: number) => void;
  currentWorkflowState: WorkflowState;
  isComplex: boolean;
  onComplexPromptChange: (isComplex: boolean) => void;
  knowledgeBaseSize: number;
  onClearMemory: () => void;
}

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = React.memo(({
    projects, currentProjectId, onNewProject, onSelectProject, onDeleteProject,
    currentWorkflowState, isComplex, onComplexPromptChange, knowledgeBaseSize, onClearMemory
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isWorkflowOpen, setIsWorkflowOpen] = useState(true);
    const currentIndex = WORKFLOW_STATES.indexOf(currentWorkflowState);

    return (
    <div className="relative flex-shrink-0 h-full">
        <aside className={`h-full bg-zinc-950 flex flex-col border-r border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0' : 'w-64'}`}>
            {/* Fixed-width inner container to prevent content reflow during animation */}
            <div className="w-64 p-4 flex flex-col flex-1 min-h-0">
                <h1 className="text-xl font-bold text-white mb-4 flex items-center flex-shrink-0"><Icons.Logo className="w-6 h-6 mr-2" /> Viber AI</h1>
      
                <div className="mb-4 flex-shrink-0">
                    <button 
                    onClick={onNewProject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 transition-all text-sm"
                    >
                    <Icons.Plus className="w-4 h-4" />
                    New Project
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 pr-1 -mr-2">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">History</h2>
                    <div className="space-y-1.5">
                    {projects.map(project => (
                        <div key={project.id} className="group relative">
                        <button
                            onClick={() => onSelectProject(project.id)}
                            className={`w-full text-left text-sm px-3 py-2 rounded-md truncate transition-colors ${project.id === currentProjectId ? 'bg-zinc-700/60 font-semibold text-white' : 'text-slate-400 hover:bg-zinc-800/80 hover:text-slate-200'}`}
                            title={project.title}
                        >
                            {project.title}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                            title="Delete project"
                        >
                            <Icons.Trash className="w-4 h-4"/>
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
                
                <div className="mb-4 flex-shrink-0">
                    <button 
                    onClick={() => setIsWorkflowOpen(!isWorkflowOpen)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 py-1 rounded-md hover:bg-zinc-800/80 transition-colors"
                    aria-expanded={isWorkflowOpen}
                    >
                    <span>Workflow</span>
                    <Icons.TriangleDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isWorkflowOpen ? '' : '-rotate-90'}`} />
                    </button>
                    <div className={`folder-content ${isWorkflowOpen ? 'open' : ''}`}>
                    <nav className="space-y-2">
                        {WORKFLOW_STATES.map((state, index) => {
                        const isActive = index === currentIndex;
                        const isCompleted = index < currentIndex;
                        return (
                            <div key={state} className={`flex items-center p-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-sky-500/20' : !isCompleted ? 'hover:bg-zinc-800' : ''}`}>
                            <div className="w-4 h-4 mr-3 flex items-center justify-center flex-shrink-0">
                                {isCompleted ? <AnimatedCheckmark /> : (
                                    <div className={`w-full h-full rounded-full border-2 transition-colors duration-200 flex items-center justify-center ${isActive ? 'border-sky-400' : 'border-slate-500'}`}>
                                    {isActive && <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>}
                                    </div>
                                )}
                            </div>
                            <span className={`text-sm font-medium ${ isActive ? 'text-sky-300' : isCompleted ? 'text-slate-500 line-through' : 'text-slate-400' }`}>{state.replace(/_/g, ' ')}</span>
                            </div>
                        );
                        })}
                    </nav>
                    </div>
                </div>

                <div className="mt-auto space-y-3 flex-shrink-0">
                    <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icons.MemoryChip className="w-5 h-5"/>
                                <span className="text-sm font-medium text-white">AI Memory</span>
                            </div>
                            <span className="text-sm font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">{knowledgeBaseSize}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">The AI learns from completed projects to improve its suggestions.</p>
                        {knowledgeBaseSize > 0 && (
                            <button onClick={onClearMemory} className="mt-3 w-full text-center text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 py-1 rounded transition-colors">
                                Clear Memory
                            </button>
                        )}
                    </div>

                    <div className="p-3 bg-zinc-900/70 rounded-lg border border-zinc-800">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-medium text-white">Thinking Mode</span>
                            <div className="relative">
                                <input type="checkbox" checked={isComplex} onChange={(e) => onComplexPromptChange(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </div>
                        </label>
                        <p className="text-xs text-slate-400 mt-2">For complex prompts. Takes longer but yields better results.</p>
                    </div>
                </div>
            </div>
        </aside>
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-8 -right-3 z-20 w-6 h-10 bg-zinc-800 border-2 border-zinc-700 rounded-r-md flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
            {isCollapsed ? <Icons.SidebarExpand className="w-5 h-5" /> : <Icons.SidebarCollapse className="w-5 h-5" />}
        </button>
    </div>
  );
});