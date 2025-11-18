import React from 'react';
import { Icons } from './icons';

interface WelcomeScreenProps {
  onNewProject: () => void;
  onRunDemo: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = React.memo(({ onNewProject, onRunDemo }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-900">
        <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Dream To Reality</h1>
            <p className="text-lg text-slate-400 mb-8">
                Describe the website you want to build, and our team of AI agents will generate the code, review it, and deliver a complete project for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                    onClick={onNewProject}
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 transition-all transform hover:scale-105"
                >
                    <Icons.Plus className="w-5 h-5" />
                    Start a New Project
                </button>
                <button
                    onClick={onRunDemo}
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600 transition-all transform hover:scale-105"
                >
                    <Icons.Play className="w-5 h-5" />
                    Run a Demo Project
                </button>
            </div>
        </div>
    </div>
));