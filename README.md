# Viber AI: Your Autonomous Engineering Team

> ### Replit is your co-pilot. **Viber AI is your entire engineering team.**

Viber AI transforms the web development process by providing a fully autonomous team of AI agents that turn your ideas into reality. Simply describe your vision through text or voice, and our Manager AI will orchestrate a seamless workflow—from gathering requirements and drafting a professional PRD to generating, reviewing, and delivering high-quality code.

---

## 🚀 Video Demo

Watch our complete workflow in action, from a simple voice prompt to a fully functional website.

**[INSERT YOUTUBE/LOOM DEMO LINK HERE]**

---

## ✨ Features & Project Lifecycle

Our platform simulates a real-world software development lifecycle, managed and executed entirely by a team of specialized AI agents. Here’s a detailed breakdown of each phase:

### 1. Requirement Gathering

*   **What you see:** The process begins with a conversation. You can talk or type to our **Manager AI**, which asks intelligent, clarifying questions to understand your project's goals, features, and design.
    <br>
    *(`[INSERT GIF OF VOICE/TEXT REQUIREMENT GATHERING HERE]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** `REQUIREMENT_GATHERING`
    *   **Process:** The Manager AI (a high-level conversational LLM) initiates the conversation, prompting for project details. It uses its advanced NLP capabilities to understand your input, identify key information, and ask clarifying questions. It can also use Google Search to research industry trends or technologies to ask more intelligent questions, uncovering hidden requirements.
    *   **Tech Stack Interaction:**
        *   **Natural Language Processing (NLP):** Understands user input, extracts key entities (e.g., "e-commerce," "photo gallery"), and manages the conversation.
        *   **Google Search Integration:** Gathers external context to enrich its understanding and formulate better questions.
        *   **Internal Context Management:** Stores gathered requirements in a structured format for the next phase.

### 2. Planning (PRD Creation)

*   **What you see:** Once enough information is gathered, the Manager AI synthesizes it into a professional **Product Requirements Document (PRD)**. You can review and even edit this document directly in the built-in IDE to ensure it perfectly captures your vision.
    <br>
    *(`[INSERT GIF OF PRD REVIEW AND APPROVAL HERE]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** Transitions to `PRD_DRAFTING`.
    *   **Process:** The Manager AI programmatically constructs the PRD, ensuring all sections are populated with detailed, actionable information, including asset queries and a precise file structure.
    *   **Tech Stack Interaction:**
        *   **Structured Data Generation:** Converts its internal representation of requirements into the specified Markdown format.
        *   **Output Command:** Issues a `[CREATE_PRD]` command with the complete Markdown content, triggering the UI to switch to the PRD review screen.

### 3. PRD Review

*   **What you see:** You approve the PRD or request changes. Your approval kicks off the next stage.
*   **What's happening behind the scenes:**
    *   **Manager AI State:** `PRD_REVIEW`
    *   **Process:** The Manager AI waits for your feedback. If you request changes, it updates its internal plan. If you approve, it prepares to delegate the project to the Frontend AI.
    *   **Tech Stack Interaction:**
        *   **User Input Parsing (NLP):** Interprets your feedback on the PRD to identify modifications or approvals.

### 4. Code Generation

*   **What you see:** With the approved PRD as a guide, the **Frontend AI** gets to work. The IDE view appears, and you can watch the files being created and populated in real-time.
    <br>
    *(`[INSERT GIF OF LIVE CODE GENERATION STREAMING INTO THE IDE HERE]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** Transitions to `CODE_GENERATING`.
    *   **Process:** The Manager AI synthesizes the approved PRD into a highly detailed and comprehensive prompt for the Frontend AI. This prompt acts as a complete instruction set for code creation.
    *   **Tech Stack Interaction:**
        *   **Prompt Engineering:** Crafts an optimized prompt for the Frontend AI, translating the PRD's specifications into executable instructions.
        *   **Inter-AI Communication:** Issues the `[GENERATE]` command, handing off the project to the Frontend AI.

### 5. Internal Quality Check

*   **What you see:** Once the code is generated, the **Reviewer AI** steps in. You'll see a message in the chat as the Reviewer AI performs its audit and provides a verdict.
    <br>
    *(`[INSERT GIF OF REVIEWER AI CHAT MESSAGE AND FEEDBACK HERE]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** `CODE_REVIEW_PENDING_EXTERNAL`.
    *   **Process:** The generated code is automatically passed to the Reviewer AI for an in-depth, automated quality and accessibility audit.
    *   **Tech Stack Interaction:**
        *   **Automated Code Analysis:** The Reviewer AI checks for HTML semantics, CSS best practices, JavaScript functionality, accessibility (WCAG), and compliance with the PRD.
        *   **Feedback Mechanism:** The Reviewer AI provides structured feedback: `[REVIEW_APPROVED]` or `[REVIEW_REJECTED]` with specific issues if rejected. If rejected, the Manager AI formulates a new `[GENERATE]` prompt for the Frontend AI, incorporating the reviewer's fixes.

### 6. User Review & Iteration

*   **What you see:** After passing the internal review, the code and a live preview are presented to you. You can request changes (e.g., "change the primary color to green"), and the AI team will rapidly implement your feedback.
    <br>
    *(`[INSERT GIF OF USER REQUESTING A CHANGE AND THE APP REGENERATING THE CODE]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** `CODE_REVIEW_PENDING_USER`.
    *   **Process:** The Manager AI enters a feedback loop, processing your requests for modifications.
    *   **Tech Stack Interaction:**
        *   **Iterative Prompt Generation:** If changes are requested, the Manager AI creates a new `[GENERATE]` prompt for the Frontend AI, combining the original PRD with your new requests. This initiates another round of generation and internal review.

### 7. Final Delivery

*   **What you see:** Once you're completely satisfied, give your final approval. The project is marked as complete, and you can download all the generated files as a `.zip` archive.
    <br>
    *(`[INSERT GIF OF FINAL WEBSITE PREVIEW AND DOWNLOAD BUTTON HERE]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** Transitions to `PROJECT_COMPLETE`.
    *   **Process:** The Manager AI acknowledges your final approval and packages the final code, making it ready for download.
    *   **Tech Stack Interaction:**
        *   **Final Confirmation:** Issues the `[PROJECT_COMPLETE]` command, signaling the end of the project lifecycle.

### 8. Project History & Access

*   **What you see:** All your completed projects are automatically saved. You can browse a history of all your past work, review their PRDs, and view the final code files at any time.
    <br>
    *(`[INSERT GIF OF A USER SCROLLING THROUGH A DASHBOARD OF PAST PROJECTS]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Manager AI State:** `VIEWING_HISTORY`.
    *   **Process:** Upon project completion, all relevant artifacts (final PRD, code files, feedback logs) are archived. The UI provides access to search and retrieve these past projects.
    *   **Tech Stack Interaction:**
        *   **Persistent Storage:** Uses browser `localStorage` to securely store project artifacts.
        *   **Data Retrieval:** Fetches and displays the project list and details upon user request.

### 9. Cross-Platform Desktop Access

*   **What you see:** Use our platform directly from your desktop! We offer downloadable apps for both Windows (.exe) and macOS (.app) so you can manage your projects in a dedicated, native environment.
    <br>
    *(`[INSERT GIF OF THE APP ICON ON A DESKTOP AND DOCK]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Process:** The core web application is packaged into native desktop installers for Windows and macOS, providing the same functionality as the web platform in a standalone app.
    *   **Tech Stack Interaction:**
        *   **Cross-Platform Framework (e.g., Electron):** Wraps the web application into a native desktop shell.
        *   **Auto-Update Mechanism:** The desktop apps can check for and install updates automatically.

### 10. Adaptive AI Learning & Optimization (AI Memory)

*   **What you see:** Our AI team learns from every project you complete. By analyzing your past projects, feedback, and code revisions, the system gets smarter and applies these "learned skills" to new projects, improving quality, speed, and understanding of your preferences over time.
    <br>
    *(`[INSERT GIF OF AI LEARNING FLOWCHART]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Process:** The system asynchronously analyzes completed projects from the project history. It identifies patterns in user requests, common feedback, and successful code structures.
    *   **Tech Stack Interaction:**
        *   **Pattern Analysis:** Identifies correlations between PRD requirements, generated code, and final user approval.
        *   **Model Fine-Tuning:** The "learned skills" are used to create new training data and prompt refinements for the Manager and Frontend AIs, improving future performance.

### 11. Inline AI Code Assistance

*   **What you see:** Get real-time help while you code! As you're editing files, our AI proactively suggests code completions, optimizations, and bug fixes right where you're typing.
    <br>
    *(`[INSERT GIF OF INLINE AI CODE SUGGESTIONS]`)*
    <br>
*   **What's happening behind the scenes:**
    *   **Process:** While you edit, a specialized, low-latency AI model monitors the code context and provides real-time, inline suggestions.
    *   **Tech Stack Interaction:**
        *   **Code Editor Integration:** Built directly into the Monaco Editor.
        *   **Low-Latency Code LLM:** Uses a small, fast, code-specialized model optimized for rapid, context-aware suggestions.

---

## 🧠 Behind the Scenes: Our Multi-LLM Architecture

Our platform leverages a sophisticated multi-LLM architecture, strategically deploying different models based on the specific task requirements for optimal performance and efficiency.

*   **General-Purpose Conversational LLMs (Manager AI):**
    *   **Criteria:** High conversational fluency, strong reasoning, and excellent planning skills.
    *   **When Used:** For user interaction (`REQUIREMENT_GATHERING`), document creation (`PRD_DRAFTING`), and overall project management.

*   **Code-Generation Optimized LLMs (Frontend AI):**
    *   **Criteria:** Deep understanding of programming languages, adherence to coding standards, and strong prompt following.
    *   **When Used:** During `CODE_GENERATION` to write the website's source code.

*   **Code-Analysis & Review Optimized LLMs (Reviewer AI):**
    *   **Criteria:** Expertise in identifying code quality issues, accessibility standards (WCAG), and compliance with the PRD.
    *   **When Used:** During the `REVIEW` phase to audit the generated code.

This multi-model approach allows us to combine the strengths of various AI agents, ensuring that each phase of your project benefits from the most appropriate and effective intelligence, leading to superior outcomes.

---

## 🤖 Meet the AI Team

-   **Manager AI:** The lead product manager. It interacts with you, creates the PRD, and delegates tasks to the other agents.
-   **Frontend AI:** The expert developer. It writes high-quality HTML, Tailwind CSS, and JavaScript based on the PRD.
-   **Reviewer AI:** The QA engineer. It audits the code for correctness, accessibility, and best practices, ensuring a high-quality final product.

---

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript, Tailwind CSS, Monaco Editor
-   **AI & Language Models:**
    -   **Google Gemini 2.5 Flash:** For fast, conversational responses and standard code generation.
    -   **Google Gemini 2.5 Pro:** Used in "Thinking Mode" for complex projects requiring deeper reasoning.
    -   **Google Gemini 2.5 Flash Native Audio:** Powers our real-time, low-latency voice chat for requirement gathering.
-   **Utilities:** `jszip` for downloading project files.

---

## 📂 Project Structure

The project is organized to clearly separate concerns, making it easy to understand and navigate.

```
.
├── public/
│   └── index.css       # Global base styles
├── src/
│   ├── components/     # Reusable React components (UI building blocks)
│   │   ├── ChatPanel.tsx
│   │   ├── EditableCodeEditor.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── IdeViewPanel.tsx
│   │   ├── VoiceOverlay.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── WorkflowSidebar.tsx
│   │   └── ...
│   ├── hooks/          # Custom React hooks
│   │   └── useDebounce.ts
│   ├── prompts/        # System instructions and prompts for the AI agents
│   │   └── agents/
│   │       ├── frontend.ts
│   │       ├── manager.ts
│   │       ├── reviewer.ts
│   │       └── voice.ts
│   ├── services/       # Modules for interacting with external APIs
│   │   └── geminiService.ts # Core logic for all Gemini API calls
│   ├── App.tsx         # Main application component, manages state and workflow
│   ├── index.tsx       # Entry point of the React application
│   └── types.ts        # Centralized TypeScript type definitions
├── index.html          # Main HTML file
├── metadata.json       # Project metadata for the hosting platform
└── README.md           # You are here!
```

---

## ▶️ How to Run

This project is built to run seamlessly on Replit.

1.  **Add your API Key:** Go to the "Secrets" tab and add your Google AI Studio API key with the name `API_KEY`.
2.  **Hit Run:** Click the "Run" button at the top. The application will install dependencies and start the development server automatically.
