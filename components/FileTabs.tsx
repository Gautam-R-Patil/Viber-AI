import React from 'react';
import { FileIcon, Icons } from './icons';

interface FileTabsProps {
    openFiles: string[];
    activeFile: string | null;
    onSelectFile: (name: string) => void;
    onCloseFile: (name: string) => void;
}

export const FileTabs: React.FC<FileTabsProps> = React.memo(({ openFiles, activeFile, onSelectFile, onCloseFile }) => (
    <div className="flex-shrink-0 flex bg-zinc-800/80 border-b border-zinc-800 h-10 overflow-x-auto">
        {openFiles.map((fileName, index) => (
            <div key={`${fileName}-${index}`}
                onClick={() => onSelectFile(fileName)}
                className={`flex-shrink-0 flex items-center px-4 cursor-pointer border-r border-zinc-700/50 transition-colors ${activeFile === fileName ? 'bg-zinc-900 text-sky-400' : 'text-slate-400 hover:bg-zinc-700/50 hover:text-white'}`}>
                <FileIcon name={fileName} className="w-4 h-4 mr-2" />
                <span className="truncate text-sm">{fileName.split('/').pop()}</span>
                <button onClick={(e) => { e.stopPropagation(); onCloseFile(fileName); }} className="ml-3 p-0.5 rounded hover:bg-zinc-600/50 text-slate-500 hover:text-white"><Icons.X className="w-4 h-4" /></button>
            </div>
        ))}
    </div>
));
