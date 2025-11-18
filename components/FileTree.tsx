import React, { useState, useMemo, useEffect } from 'react';
import { GeneratedFile } from '../types';
import { FileIcon, Icons } from './icons';

// --- Helper function for highlighting search matches ---
const HighlightedName: React.FC<{ name: string; query: string }> = React.memo(({ name, query }) => {
    if (!query) {
        return <span className="truncate">{name}</span>;
    }
    const index = name.toLowerCase().indexOf(query);
    if (index === -1) {
        return <span className="truncate">{name}</span>;
    }
    const before = name.substring(0, index);
    const match = name.substring(index, index + query.length);
    const after = name.substring(index + query.length);

    return (
        <span className="truncate">
            {before}
            <span className="bg-sky-500/40 text-sky-200 rounded-[3px] px-0.5">
                {match}
            </span>
            {after}
        </span>
    );
});


// --- File Item Component ---
const FileItem: React.FC<{
    file: GeneratedFile;
    activeFile: string | null;
    onFileSelect: (file: GeneratedFile) => void;
    query: string;
}> = ({ file, activeFile, onFileSelect, query }) => (
    <div>
        <button
            onClick={() => onFileSelect(file)}
            className={`w-full flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors duration-200 ${activeFile === file.name ? 'bg-sky-500/30 text-sky-300 font-semibold' : 'text-slate-300 hover:bg-zinc-700/50'}`}
        >
            <FileIcon name={file.name} className="w-4 h-4 mr-2 flex-shrink-0" />
            <HighlightedName name={file.name.split('/').pop()!} query={query} />
        </button>
    </div>
);

// --- Folder Item Component ---
const FolderItem: React.FC<{
    name: string;
    children: React.ReactNode[];
    isOpen: boolean;
    onToggle: () => void;
    query: string;
}> = ({ name, children, isOpen, onToggle, query }) => (
    <div>
        <button
            onClick={onToggle}
            className="w-full flex items-center text-left px-2 py-1.5 text-sm font-semibold text-slate-300 hover:bg-zinc-700/50 rounded-md transition-colors duration-200"
        >
            {isOpen ? <Icons.TriangleDown className="w-4 h-4 mr-2 flex-shrink-0" /> : <Icons.TriangleRight className="w-4 h-4 mr-2 flex-shrink-0" />}
            <Icons.Folder className="w-5 h-5 mr-1.5 flex-shrink-0 text-sky-400" />
            <HighlightedName name={name} query={query} />
        </button>
        <div className={`folder-content ${isOpen ? 'open' : ''}`}>
            <div className="pl-4 border-l border-zinc-700 ml-2.5">
                {children}
            </div>
        </div>
    </div>
);


// --- Main FileTree Component ---
interface FileTreeProps {
    files: GeneratedFile[];
    activeFile: string | null;
    onFileSelect: (file: GeneratedFile) => void;
    searchQuery: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, activeFile, onFileSelect, searchQuery }) => {
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
    const lowerCaseQuery = searchQuery.toLowerCase();

    const tree = useMemo(() => {
      const root: { [key: string]: any } = {};
      files.forEach(file => {
        file.name.split('/').reduce((acc, name, index, arr) => {
          if (!acc[name]) {
            acc[name] = {};
          }
          if (index === arr.length - 1) {
            acc[name].__file = file;
          }
          return acc[name];
        }, root);
      });
      return root;
    }, [files]);

    useEffect(() => {
        const allFolderPaths = new Set<string>();
        files.forEach(file => {
            const parts = file.name.split('/');
            if (parts.length > 1) {
                for (let i = 0; i < parts.length - 1; i++) {
                    allFolderPaths.add(parts.slice(0, i + 1).join('/'));
                }
            }
        });

        if (lowerCaseQuery) {
            const expandedFolders = new Set<string>();
            files.forEach(file => {
                if (file.name.toLowerCase().includes(lowerCaseQuery)) {
                    const parts = file.name.split('/');
                    if (parts.length > 1) {
                        for (let i = 0; i < parts.length - 1; i++) {
                            expandedFolders.add(parts.slice(0, i + 1).join('/'));
                        }
                    }
                }
            });
            setOpenFolders(expandedFolders);
        } else {
            setOpenFolders(allFolderPaths);
        }
    }, [files, lowerCaseQuery]);

    const toggleFolder = (path: string) => {
        setOpenFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };
    
    const renderTree = (node: any, path = ''): React.ReactNode[] => {
      return Object.entries(node)
        .sort(([a], [b]) => {
          const aIsFile = !!node[a].__file;
          const bIsFile = !!node[b].__file;
          if (aIsFile === bIsFile) return a.localeCompare(b);
          return aIsFile ? 1 : -1;
        })
        .map(([name, childNode]: [string, any]) => {
          const currentPath = path ? `${path}/${name}` : name;
          const isFile = !!childNode.__file;
  
          if (isFile) {
             if (lowerCaseQuery && !childNode.__file.name.toLowerCase().includes(lowerCaseQuery)) {
                return null;
             }
             return <FileItem key={currentPath} file={childNode.__file} activeFile={activeFile} onFileSelect={onFileSelect} query={lowerCaseQuery} />;
          } 
          
          const children = renderTree(childNode, currentPath);
          if (lowerCaseQuery && children.every(c => c === null) && !name.toLowerCase().includes(lowerCaseQuery)) {
              return null;
          }

          return (
            <FolderItem
              key={currentPath}
              name={name}
              isOpen={openFolders.has(currentPath)}
              onToggle={() => toggleFolder(currentPath)}
              query={lowerCaseQuery}
            >
              {children}
            </FolderItem>
          );
        }).filter(Boolean) as React.ReactNode[];
    };
  
    const renderedNodes = renderTree(tree);

    return (
        <div className="p-2 space-y-0.5">
            {files.length > 0 ? (
                renderedNodes.length > 0 ? (
                    renderedNodes
                ) : (
                    searchQuery && (
                        <div className="px-2 py-4 text-center text-sm text-slate-500">
                            <p>No files found for "{searchQuery}"</p>
                        </div>
                    )
                )
            ) : (
                <div className="px-2 py-4 text-center text-sm text-slate-500">
                    <p>No files generated yet.</p>
                </div>
            )}
        </div>
    );
};