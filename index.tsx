import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loader } from '@monaco-editor/react';

const MONACO_VERSION = '0.54.0';
// Base path to the Monaco editor CDN.
const MONACO_CDN_PATH = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}`;
const MONACO_VS_PATH = `${MONACO_CDN_PATH}/min/vs`;

/**
 * To fix worker loading issues in a no-build-step environment (like this one using import maps),
 * we must explicitly tell the Monaco loader where to find its worker scripts.
 *
 * The problem: The default loader logic, especially when bundled by services like esm.sh,
 * can generate incorrect paths for worker files (e.g., with hashes that don't exist on the CDN),
 * causing a "Failed to execute 'importScripts'" error.
 *
 * The solution: We define `window.MonacoEnvironment.getWorkerUrl`. This is a hook provided by the
 * Monaco Editor API that allows us to override the worker URL resolution. We return the
 * correct, full URL to the pre-built worker files on the official JSDelivr CDN.
 * This ensures the editor can always locate and load its necessary background scripts.
 */
(window as any).MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: any, label: string) {
    if (label === 'json') {
      return `${MONACO_VS_PATH}/language/json/json.worker.js`;
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return `${MONACO_VS_PATH}/language/css/css.worker.js`;
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return `${MONACO_VS_PATH}/language/html/html.worker.js`;
    }
    if (label === 'typescript' || label === 'javascript') {
      return `${MONACO_VS_PATH}/language/typescript/ts.worker.js`;
    }
    return `${MONACO_VS_PATH}/editor/editor.worker.js`;
  },
};


// Configure the loader to use the specified path for Monaco's assets.
loader.config({ paths: { vs: MONACO_VS_PATH } });

// To prevent "Duplicate definition of module" errors in environments that
// may re-evaluate this script, we ensure that the loader's init() method
// is only ever called once by using a global flag that stores the promise.
if (!(window as any).__MONACO_INIT_PROMISE__) {
  console.log('[Monaco Loader] Initializing...');
  // Store the promise in the global flag. The <Editor> component will
  // wait for this promise to resolve before mounting.
  const monacoInitPromise = loader.init();
  (window as any).__MONACO_INIT_PROMISE__ = monacoInitPromise;

  monacoInitPromise.then(() => {
      console.log('[Monaco Loader] Initialization complete.');
  }).catch((err: any) => {
      console.error('[Monaco Loader] Initialization failed:', err);
      // Reset the promise on failure to allow a retry if the app is reloaded.
      (window as any).__MONACO_INIT_PROMISE__ = undefined;
  });
}

// Render the React application immediately. The <Editor> component
// will handle its own loading state gracefully while waiting for
// the monaco instance to become available.
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  console.log('[React App] Application rendered.');
} else {
  console.error('[React App] Fatal: Could not find root element.');
}
