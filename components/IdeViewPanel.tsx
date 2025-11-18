import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GeneratedCode, GeneratedFile } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { FileExplorer } from './FileExplorer';
import { FileTabs } from './FileTabs';
import { EditableCodeEditor } from './EditableCodeEditor';
import { Icons } from './icons';
import { WorkflowState } from '../types';
import JSZip from 'jszip';


interface IdeViewPanelProps {
    generatedCode: GeneratedCode;
    activeFile: string | null;
    setActiveFile: (file: string | null) => void;
    openFiles: string[];
    setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
    prdContent: string;
    handleCodeChange: (newCode: string) => void;
    handleFileSelect: (file: GeneratedFile) => void;
    handleDownloadAll: () => void;
    workflowState: WorkflowState;
    isMonacoReady: boolean;
    isAgentThinking: boolean;
    handleStopGeneration: () => void;
}

export const IdeViewPanel: React.FC<IdeViewPanelProps> = ({
    generatedCode,
    activeFile,
    setActiveFile,
    openFiles,
    setOpenFiles,
    prdContent,
    handleCodeChange,
    handleFileSelect,
    handleDownloadAll,
    workflowState,
    isMonacoReady,
    isAgentThinking,
    handleStopGeneration,
}) => {
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ideContainerRef = useRef<HTMLDivElement>(null);
  const layoutDropdownRef = useRef<HTMLDivElement>(null);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  
  const editorContent = useMemo(() => {
    if (!activeFile) return 'Select a file to view its content, or start a new project.';
    if (activeFile === 'PRD.md') return prdContent;
    const file = generatedCode.files.find(f => f.name === activeFile);
    return file ? file.content : `// File '${activeFile}' not found or is empty.`;
  }, [activeFile, prdContent, generatedCode]);

  const essentialFiles = useMemo(() => {
      const htmlFile = generatedCode.files.find(f => f.name.endsWith('index.html')) || generatedCode.files.find(f => f.name.endsWith('.html'));
      if (!htmlFile) return [];
      const linkedCss = [...htmlFile.content.matchAll(/<link[^>]*?href="([^"]+?\.css)"[^>]*?>/g)].map(match => match[1].replace(/^\.\//, ''));
      const linkedJs = [...htmlFile.content.matchAll(/<script[^>]*?src="([^"]+?\.js)"[^>]*?><\/script>/g)].map(match => match[1].replace(/^\.\//, ''));
      const essentialFileNames = new Set([htmlFile.name, ...linkedCss, ...linkedJs]);
      return generatedCode.files.filter(file => essentialFileNames.has(file.name));
  }, [generatedCode.files]);

  const debouncedEssentialFiles = useDebounce(essentialFiles, 300);

  useEffect(() => {
    if (iframeRef.current) {
        const htmlFile = debouncedEssentialFiles.find(f => f.name.endsWith('index.html')) || debouncedEssentialFiles.find(f => f.name.endsWith('.html'));
        if (htmlFile) {
            let processedContent = htmlFile.content;
            const cssLinks = [...processedContent.matchAll(/<link[^>]*?href="([^"]+?\.css)"[^>]*?>/g)];
            for (const match of cssLinks) {
                const linkTag = match[0];
                const cssPath = match[1].replace(/^\.\//, '');
                const cssFile = debouncedEssentialFiles.find(f => f.name === cssPath);
                if (cssFile) {
                    processedContent = processedContent.replace(linkTag, `<style>${cssFile.content}</style>`);
                }
            }
            const scriptTags = [...processedContent.matchAll(/<script[^>]*?src="([^"]+?\.js)"[^>]*?><\/script>/g)];
            for (const match of scriptTags) {
                const scriptTag = match[0];
                const jsPath = match[1].replace(/^\.\//, '');
                const jsFile = debouncedEssentialFiles.find(f => f.name === jsPath);
                if (jsFile) {
                    processedContent = processedContent.replace(scriptTag, `<script>${jsFile.content}</script>`);
                }
            }
            if (iframeRef.current.srcdoc !== processedContent) {
                iframeRef.current.srcdoc = processedContent;
            }
        } else {
            iframeRef.current.srcdoc = "<html><body>Waiting for index.html...</body></html>";
        }
    }
  }, [debouncedEssentialFiles]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && ideContainerRef.current) {
      const containerRect = ideContainerRef.current.getBoundingClientRect();
      const newEditorWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setEditorWidth(Math.max(15, Math.min(newEditorWidth, 85)));
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);
  
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target as Node)) {
        setIsLayoutDropdownOpen(false);
      }
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setIsDownloadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFileTab = useCallback((fileName: string) => {
    setActiveFile(fileName);
  }, [setActiveFile]);

  const handleCloseFile = useCallback((fileToClose: string) => {
    const fileIndex = openFiles.indexOf(fileToClose);
    const newOpenFiles = openFiles.filter(f => f !== fileToClose);
    if (activeFile === fileToClose) {
        if (newOpenFiles.length === 0) {
            setActiveFile(null);
        } else {
            const newIndex = Math.max(0, fileIndex - 1);
            setActiveFile(newOpenFiles[newIndex]);
        }
    }
    setOpenFiles(newOpenFiles);
  }, [openFiles, activeFile, setActiveFile, setOpenFiles]);
    
  return (
    <div className="flex flex-col w-full h-full min-h-0">
        <div className="flex-shrink-0 flex items-center justify-between bg-zinc-800/80 border-b border-zinc-800 h-10">
            <div className="flex items-center text-sm h-full">
                <button onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)} className="p-2 h-full text-slate-400 hover:bg-zinc-700 hover:text-white border-r border-zinc-700/50 transition-colors" title={isFileExplorerOpen ? 'Collapse file explorer' : 'Expand file explorer'}>
                    {/* FIX: Replaced non-existent Icons.ChevronsLeft with Icons.SidebarCollapse. */}
                    <Icons.SidebarCollapse className={`w-5 h-5 transition-transform duration-200 ${!isFileExplorerOpen && 'rotate-180'}`} />
                </button>
            </div>
            <div className="flex items-center gap-4 px-4">
                {isAgentThinking && (workflowState === 'CODE_GENERATION' || workflowState === 'REVIEW') && (
                    <button
                        onClick={handleStopGeneration}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors"
                    >
                        <Icons.StopCircle className="w-4 h-4" />
                        Stop Generation
                    </button>
                )}
                <div ref={layoutDropdownRef} className="relative">
                    <button onClick={() => setIsLayoutDropdownOpen(prev => !prev)} className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-slate-300 hover:bg-zinc-700 hover:text-white transition-colors"><Icons.Split className="w-5 h-5"/>Layout</button>
                    {isLayoutDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                            <button onClick={() => {setShowEditor(true); setShowPreview(false); setIsLayoutDropdownOpen(false);}} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-zinc-700"><Icons.PanelLeft className="w-4 h-4"/>Editor Only</button>
                            <button onClick={() => {setShowEditor(false); setShowPreview(true); setIsLayoutDropdownOpen(false);}} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-zinc-700"><Icons.PanelRight className="w-4 h-4"/>Preview Only</button>
                            <button onClick={() => {setShowEditor(true); setShowPreview(true); setIsLayoutDropdownOpen(false);}} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-zinc-700"><Icons.Split className="w-4 h-4"/>Split View</button>
                        </div>
                    )}
                </div>
                {generatedCode.files.length > 0 && workflowState === 'DELIVERY' && (
                    <div ref={downloadDropdownRef} className="relative">
                        <button onClick={() => setIsDownloadDropdownOpen(prev => !prev)} className="flex items-center justify-center px-3 py-1.5 bg-sky-600 text-white rounded-md text-sm font-medium hover:bg-sky-500 transition-colors">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download
                            <svg className="w-4 h-4 ml-1 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        </button>
                        {isDownloadDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                                <button onClick={() => { handleDownloadAll(); setIsDownloadDropdownOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-zinc-700">
                                    <Icons.Folder className="w-4 h-4 text-sky-400" /> Download All (.zip)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        <div className="flex-1 flex min-h-0">
            <FileExplorer files={generatedCode.files} activeFile={activeFile} onFileSelect={handleFileSelect} isOpen={isFileExplorerOpen} searchQuery={fileSearchQuery} onSearchChange={setFileSearchQuery} />
            <div ref={ideContainerRef} className="flex-1 flex min-h-0 bg-zinc-900">
                {showEditor && (
                    <div className="h-full flex flex-col" style={{ width: showPreview ? `${editorWidth}%` : '100%' }}>
                        <FileTabs openFiles={openFiles} activeFile={activeFile} onSelectFile={handleSelectFileTab} onCloseFile={handleCloseFile} />
                        <div className="flex-1 min-h-0 relative">
                           {isMonacoReady ? (
                                <div className="absolute inset-0">
                                    <EditableCodeEditor
                                        code={editorContent}
                                        onCodeChange={handleCodeChange}
                                        fileName={activeFile || 'untitled.txt'}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-zinc-900">Loading Editor...</div>
                            )}
                        </div>
                    </div>
                )}
                {showEditor && showPreview && (
                    <div onMouseDown={() => setIsResizing(true)} className="w-1.5 h-full cursor-col-resize bg-zinc-800 hover:bg-sky-500 transition-colors duration-200 flex-shrink-0" />
                )}
                {showPreview && (
                    <div className="h-full flex-1"><iframe ref={iframeRef} title="Website Preview" className="w-full h-full bg-white" /></div>
                )}
            </div>
        </div>
    </div>
  );
}