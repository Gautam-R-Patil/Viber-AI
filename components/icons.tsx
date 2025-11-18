import React from 'react';
// FIX: Import Agent type from the centralized types.ts file
import { Agent } from '../types';

// --- BASE ICONS ---
export const Icons = {
  // NEW ICONS
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48" {...props}>
      <path fill="#2196f3" d="M23.426,31.911l-1.719,3.936c-0.661,1.513-2.754,1.513-3.415,0l-1.719-3.936 c-1.529-3.503-4.282-6.291-7.716-7.815l-4.73-2.1c-1.504-0.668-1.504-2.855,0-3.523l4.583-2.034 c3.522-1.563,6.324-4.455,7.827-8.077l1.741-4.195c0.646-1.557,2.797-1.557,3.443,0l1.741,4.195 c1.503,3.622,4.305,6.514,7.827,8.077l4.583,2.034c1.504,0.668,1.504,2.855,0,3.523l-4.73,2.1 C27.708,25.62,24.955,28.409,23.426,31.911z"></path>
      <path fill="#7e57c2" d="M38.423,43.248l-0.493,1.131c-0.361,0.828-1.507,0.828-1.868,0l-0.493-1.131 c-0.879-2.016-2.464-3.621-4.44-4.5l-1.52-0.675c-0.822-0.365-0.822-1.56,0-1.925l1.435-0.638c2.027-0.901,3.64-2.565,4.504-4.65 l0.507-1.222c0.353-0.852,1.531-0.852,1.884,0l0.507,1.222c0.864,2.085,2.477,3.749,4.504,4.65l1.435,0.638 c0.822,0.365,0.822,1.56,0,1.925l-1.52,0.675C40.887,39.627,39.303,41.232,38.423,43.248z"></path>
    </svg>
  ),
  MemoryChip: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/artificial-intelligence.png" alt="AI Memory" {...props} />),
  Html: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48" {...props}><path fill="#E65100" d="M41,5H7l3,34l14,4l14-4L41,5L41,5z"></path><path fill="#FF6D00" d="M24 8L24 39.9 35.2 36.7 37.7 8z"></path><path fill="#FFF" d="M24,25v-4h8.6l-0.7,11.5L24,35.1v-4.2l4.1-1.4l0.3-4.5H24z M32.9,17l0.3-4H24v4H32.9z"></path><path fill="#EEE" d="M24,30.9v4.2l-7.9-2.6L15.7,27h4l0.2,2.5L24,30.9z M19.1,17H24v-4h-9.1l0.7,12H24v-4h-4.6L19.1,17z"></path></svg>),
  Css: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48" {...props}><path fill="#0277BD" d="M41,5H7l3,34l14,4l14-4L41,5L41,5z"></path><path fill="#039BE5" d="M24 8L24 39.9 35.2 36.7 37.7 8z"></path><path fill="#FFF" d="M33.1 13L24 13 24 17 28.9 17 28.6 21 24 21 24 25 28.4 25 28.1 29.5 24 30.9 24 35.1 31.9 32.5 32.6 21 32.6 21z"></path><path fill="#EEE" d="M24,13v4h-8.9l-0.3-4H24z M19.4,21l0.2,4H24v-4H19.4z M19.8,27h-4l0.3,5.5l7.9,2.6v-4.2l-4.1-1.4L19.8,27z"></path></svg>),
  GenericFile: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48" {...props}><path fill="#90CAF9" d="M40 45L8 45 8 3 30 3 40 13z"></path><path fill="#E1F5FE" d="M38.5 14L29 14 29 4.5z"></path></svg>),
  Folder: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>),
  X: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/ios-filled/50/multiply.png" alt="close" {...props} style={{ filter: 'invert(1)' }}/>),
  Brain: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/mind-map.png" alt="view thoughts" {...props} />),
  Microphone: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>),
  MicrophoneOff: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>),
  StopCircle: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>),
  Trash: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/ios-glyphs/30/trash--v1.png" alt="delete" {...props} style={{ filter: 'invert(0.8)' }}/>),

  // --- EXISTING ICONS ---
  Code: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>),
  Eye: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>),
  Send: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/send-letter--v1.png" alt="send" {...props} />),
  Paperclip: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/attach.png" alt="attach file" {...props} />),
  TriangleRight: (props: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10 17l5-5-5-5v10z"></path></svg>),
  TriangleDown: (props: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7 10l5 5 5-5H7z"></path></svg>),
  Image: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>),
  Video: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 8-6 4 6 4V8Z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>),
  SidebarCollapse: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/back--v1.png" alt="collapse" {...props} />),
  SidebarExpand: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/forward.png" alt="expand" {...props} />),
  User: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/user-male-circle--v3.png" alt="user" {...props} />),
  Manager: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/user-male-circle--v1.png" alt="manager" {...props} />),
  Frontend: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/fluency/48/coder-in-hoodie.png" alt="frontend" {...props} />),
  Reviewer: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/fluency/50/under-computer.png" alt="reviewer" {...props} />),
  Play: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/50/circled-play.png" alt="run demo" {...props} />),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0,0,256,256" {...props}>
      {/* FIX: Removed invalid SVG attributes (`fontFamily`, `fontWeight`, `fontSize`, and `textAnchor`) with value "none" to resolve TypeScript type error. */}
      <g fill="none" fillRule="nonzero" stroke="none" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="10" strokeDasharray="" strokeDashoffset="0" style={{mixBlendMode: 'normal'}}>
        <g transform="scale(5.33333,5.33333)">
          <path d="M44,24c0,11.045 -8.955,20 -20,20c-11.045,0 -20,-8.955 -20,-20c0,-11.045 8.955,-20 20,-20c11.045,0 20,8.955 20,20z" fill="#0757e6"></path>
          <path d="M21,14h6v20h-6z" fill="#ffffff"></path>
          <path d="M14,21h20v6h-20z" fill="#ffffff"></path>
        </g>
      </g>
    </svg>
  ),
  Logo: (props: React.HTMLProps<HTMLImageElement>) => (
    <img src="https://img.icons8.com/fluency-systems-filled/48/mind-map.png" alt="logo" {...props} style={{ filter: 'invert(1)' }}/>
  ),
  Search: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/view-file.png" alt="search" {...props} />),
  ClipboardList: (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>),
  PanelLeft: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/source-code.png" alt="editor" {...props} />),
  PanelRight: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/vision.png" alt="preview" {...props} />),
  Split: (props: React.HTMLProps<HTMLImageElement>) => (<img src="https://img.icons8.com/color/48/columns.png" alt="layout" {...props} />),
};

// --- ANIMATED CHECKMARK ---
export const AnimatedCheckmark: React.FC = React.memo(() => (
    <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle className="checkmark-circle" strokeWidth="2" cx="12" cy="12" r="10" />
        <path className="checkmark-check" strokeWidth="2.5" d="M8 12l3 3 5-5" />
    </svg>
));

// --- AGENT & FILE ICONS ---
// FIX: The Agent type definition has been moved to types.ts

export const AgentIcon: React.FC<{agent: Agent, className?: string}> = ({ agent, className = "w-5 h-5" }) => {
    switch(agent) {
        case 'User': return <Icons.User className={className} />;
        case 'Manager': return <Icons.Manager className={className} />;
        case 'Frontend': return <Icons.Frontend className={className} />;
        case 'Reviewer': return <Icons.Reviewer className={className} />;
        default: return <Icons.Code className={className} />;
    }
}

export const FileIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-5 h-5" }) => {
    const extension = name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'html': return <Icons.Html className={className} />;
        case 'css': return <Icons.Css className={className} />;
        case 'js':
        case 'jsx':
            return <img src="https://img.icons8.com/color/48/javascript--v1.png" alt="JavaScript" className={className} />;
        case 'ts':
        case 'tsx':
            return <img src="https://img.icons8.com/color/48/typescript.png" alt="TypeScript" className={className} />;
        case 'json':
            return <img src="https://img.icons8.com/color/48/json.png" alt="JSON" className={className} />;
        case 'md':
            return <img src="https://img.icons8.com/color/48/markdown.png" alt="Markdown" className={className} />;
        case 'jpeg':
        case 'jpg':
        case 'png':
        case 'svg':
        case 'gif':
            return <Icons.Image className={className} />;
        case 'mp4': return <Icons.Video className={className} />;
        default: return <Icons.GenericFile className={className} />;
    }
};