import React, { useRef, useMemo, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { getCodeSuggestions } from '../services/geminiService';
import type * as monaco from 'monaco-editor';

/**
 * A mapping from common file extensions to Monaco Editor's language identifiers.
 * This ensures that files are opened with the correct syntax highlighting.
 */
const getMonacoLanguage = (extension?: string): string => {
    switch (extension?.toLowerCase()) {
        case 'html': return 'html';
        case 'css': return 'css';
        case 'js': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'jsx': return 'javascript';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'py': return 'python';
        case 'java': return 'java';
        case 'sh': return 'shell';
        case 'rb': return 'ruby';
        case 'sql': return 'sql';
        case 'xml': return 'xml';
        case 'yaml': return 'yaml';
        case 'yml': return 'yaml';
        default: return 'plaintext';
    }
};


interface EditableCodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  /** The full file name (e.g., 'index.html') to provide context for AI suggestions. */
  fileName: string;
}

/**
 * A wrapper around the Monaco Editor that provides a consistent editing experience.
 * It handles language detection for syntax highlighting and updates its content
 * when the active file changes. It also integrates Gemini for AI code suggestions.
 */
export const EditableCodeEditor: React.FC<EditableCodeEditorProps> = ({ code, onCodeChange, fileName }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const completionProviderRef = useRef<monaco.IDisposable | null>(null);

  const language = useMemo(() => fileName?.split('.').pop(), [fileName]);
  const monacoLanguage = useMemo(() => getMonacoLanguage(language), [language]);

  /**
   * Callback executed when the editor is first mounted.
   * It stores the editor and monaco instances for later use.
   */
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  /**
   * Effect to register our custom AI completion provider.
   * It re-registers the provider if the file (and thus language) changes.
   */
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !fileName) {
      return;
    }

    // Dispose previous provider to avoid duplicates
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }
    
    let isSuggesting = false; // Flag to prevent concurrent API calls

    completionProviderRef.current = monaco.languages.registerCompletionItemProvider(monacoLanguage, {
      triggerCharacters: ['.', ' ', '(', "'", '"', '`', '\n'], // Trigger on common characters
      provideCompletionItems: async (model, position) => {
        if (isSuggesting) {
            return { suggestions: [] };
        }
        
        const codeBeforeCursor = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });

        // Avoid sending requests for very short snippets or on every keystroke in an empty file.
        if (codeBeforeCursor.trim().length < 10) {
            return { suggestions: [] };
        }
        
        isSuggesting = true;
        try {
            const suggestions = await getCodeSuggestions(codeBeforeCursor, fileName);

            if (!suggestions || suggestions.length === 0) {
                return { suggestions: [] };
            }
            
            // Monaco requires a range for the replacement. If we're completing a word,
            // we need to find the word's start to replace it correctly.
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const monacoSuggestions: monaco.languages.CompletionItem[] = suggestions.map((s, i) => ({
                label: {
                  label: s,
                  description: 'AI Suggestion'
                },
                insertText: s,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: range,
                detail: `Gemini suggestion ${i + 1}`,
                sortText: `z-${i}` // Try to push AI suggestions below standard ones
            }));

            return { suggestions: monacoSuggestions, incomplete: true };
        } catch (error) {
            // Silently fail to not disrupt user experience
            // console.error("Failed to provide completion items:", error);
            return { suggestions: [] };
        } finally {
            isSuggesting = false;
        }
      }
    });

    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, [monacoLanguage, fileName]);

  /**
   * This effect ensures that syntax highlighting is updated imperatively whenever the active file changes.
   * This is more reliable than relying solely on the declarative `language` prop, especially
   * when the editor component itself doesn't re-mount.
   */
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  }, [monacoLanguage]);

  const handleEditorChange = (value: string | undefined) => {
    onCodeChange(value || '');
  };

  return (
    <div className="relative w-full h-full bg-zinc-900" role="application">
        <Editor
            height="100%"
            language={monacoLanguage}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                contextmenu: true,
                fontFamily: '"Fira Code", "Fira Mono", monospace',
                lineHeight: 24,
                padding: { top: 16, bottom: 16 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: { other: true, comments: true, strings: true },
                ariaLabel: 'Code Editor',
            }}
        />
    </div>
  );
};