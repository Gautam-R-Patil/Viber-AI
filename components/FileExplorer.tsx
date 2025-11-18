import React from 'react';
import { GeneratedFile } from '../types';
import { FileTree } from './FileTree';
import { Icons, FileIcon } from './icons';

interface FileExplorerProps {
    files: GeneratedFile[];
    activeFile: string | null;
    onFileSelect: (file: GeneratedFile) => void;
    isOpen: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = React.memo(({
    files, activeFile, onFileSelect, isOpen, searchQuery, onSearchChange
}) => {
    const prdFile = files.find(f => f.name === 'PRD.md');
    const otherFiles = files.filter(f => f.name !== 'PRD.md');

    return (
        <div className={`bg-zinc-900/50 transition-all duration-300 ease-in-out flex flex-col overflow-x-hidden ${isOpen ? 'w-64' : 'w-0'}`}>
            <div className="p-2 border-b border-zinc-800 h-10 flex items-center flex-shrink-0"><h2 className="text-sm font-semibold text-slate-300 px-2 whitespace-nowrap">File Explorer</h2></div>
            <div className="p-2 flex-shrink-0">
                <div className="relative">
                    <Icons.Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" placeholder="Search files..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="w-full bg-zinc-800 text-sm text-white pl-8 pr-8 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 border border-zinc-700" />
                    {searchQuery && (<button onClick={() => onSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" title="Clear search"><Icons.X className="w-4 h-4" /></button>)}
                </div>
            </div>
            {prdFile && (
                <div className="p-2 flex-shrink-0 border-b border-zinc-800/50">
                    <button
                    onClick={() => onFileSelect(prdFile)}
                    className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors duration-200 ${activeFile === prdFile.name ? 'bg-sky-500/30 text-sky-300 font-semibold' : 'text-slate-300 hover:bg-zinc-700/50'}`}
                    title="Product Requirements Document"
                    >
                    <FileIcon name={prdFile.name} className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate font-medium">{prdFile.name}</span>
                    </button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto min-h-0">
                <FileTree files={otherFiles} activeFile={activeFile} onFileSelect={onFileSelect} searchQuery={searchQuery} />
            </div>
        </div>
    );
});