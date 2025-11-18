
# PRD: Manager AI's Project Workflow

**Welcome to the future of web development! Our platform streamlines the entire website creation process, transforming your vision into a live site with unparalleled efficiency. As the central Manager AI, I orchestrate a team of specialized AI agents – from frontend coders to quality assurance reviewers – guiding your project from initial concept to final deployment. We handle all the complexities, ensuring a high-quality, fully functional website delivered faster and more seamlessly than ever before, allowing you to focus purely on your creative ideas.**

## 1. Project Title
Manager AI's Project Workflow: From Prompt to Completion

## 2. Objectives
To clearly define and document the operational process of the Manager AI, demonstrating how it interprets user requests, manages project phases, and coordinates tasks to deliver a finished web development project. This PRD serves to provide transparency and ensure a consistent, high-quality project management experience for the user.

## 3. Target Audience
Users interacting with the Manager AI who wish to understand the underlying process and structure of project management from initiation to completion, as well as judges evaluating the platform's capabilities.

## 4. Feature List / Project Workflow Phases

The Manager AI's workflow is broken down into the following distinct phases and capabilities, describing how a project progresses from initial idea to final delivery:

### 4.1. Requirement Gathering

*   **Simple Explanation:** This is where we start! You tell me all about your website idea – its purpose, who it's for, what features you need, and how you want it to look. I'll ask questions to make sure I understand everything clearly.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** `REQUIREMENT_GATHERING`
    *   **Process:** The Manager AI (a high-level, general-purpose LLM, often a large conversational model) initiates the conversation, greeting the user and prompting for project details. It maintains a conversational flow, asking clarifying questions. It actively listens to user input, identifying key information and potential ambiguities. It may proactively use Google Search to research industry trends, specific technologies, or domain contexts to ask more intelligent and relevant questions, thereby uncovering hidden requirements or suggesting best practices.
    *   **Tech Stack Interaction:**
        *   **Natural Language Processing (NLP):** Used to understand user input, extract entities (e.g., "bakery," "e-commerce," "photo gallery"), identify intent, and manage conversational flow. This is primarily handled by the Manager AI's core LLM capabilities.
        *   **Google Search Integration:** The Manager AI executes `google_search.search()` queries to gather external context, inform questioning, and enrich understanding of the user's domain or requested features.
        *   **Internal Knowledge Base/Context Management:** Stores and organizes gathered requirements, user preferences, and project objectives in a structured format for later PRD generation.

### 4.2. Planning (PRD Creation)

*   **Simple Explanation:** Once I have a good grasp of your vision, I'll organize all that information into a detailed document called a Product Requirements Document (PRD). This document acts as our blueprint, outlining everything we agreed upon.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** Transitions from `REQUIREMENT_GATHERING` to `PRD_DRAFTING` once sufficient requirements are gathered.
    *   **Process:** Based on the aggregated and refined requirements, the Manager AI programmatically constructs the PRD. It ensures all mandatory sections are populated with detailed, clear, and actionable information, including specific image/video asset queries and a precise file structure.
    *   **Tech Stack Interaction:**
        *   **Structured Data Generation:** The Manager AI converts its internal representation of requirements into the specified Markdown format for the PRD.
        *   **Template Engine (Conceptual):** Uses a predefined template for the PRD structure, dynamically filling in content.
        *   **Asset Query Generation:** Formulates descriptive search queries and specifies aspect ratios for image and video assets based on design and content needs identified during requirement gathering.
        *   **File Structure Generation Logic:** Determines the necessary HTML, CSS, and JS files based on the identified features and page types.
    *   **Output Command:** `[CREATE_PRD]` followed by the complete Markdown content.

### 4.3. PRD Review

*   **Simple Explanation:** I'll share the PRD with you. This is your chance to review it, provide feedback, and confirm that it accurately reflects your vision. We'll make any necessary adjustments until you're completely happy with the plan.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** `PRD_REVIEW`
    *   **Process:** The Manager AI presents the generated PRD to the user. It then enters a waiting state, anticipating user feedback. If the user requests changes, the Manager AI updates the internal PRD representation and potentially re-generates the PRD or directly incorporates changes for the next phase.
    *   **Tech Stack Interaction:**
        *   **User Input Parsing (NLP):** Interprets user feedback on the PRD to identify requested modifications or approvals.
        *   **Document Versioning (Conceptual):** Internally tracks changes to the PRD for iterative refinement.

### 4.4. Code Generation

*   **Simple Explanation:** With the approved PRD as our guide, I'll instruct our Frontend AI to start building the website's code. This is where your vision begins to take digital form.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** Transitions from `PRD_REVIEW` (upon user approval) to `CODE_GENERATING`.
    *   **Process:** The Manager AI synthesizes the *approved* PRD into a highly detailed and comprehensive prompt specifically tailored for the Frontend AI. This prompt acts as a complete instruction set for code creation, encompassing all design, feature, and structural requirements. It also informs the user about the upcoming internal review process.
    *   **Tech Stack Interaction:**
        *   **Prompt Engineering:** Crafts an optimized prompt for the Frontend AI, translating the PRD's declarative specifications into executable instructions. This prompt is a critical translation layer.
        *   **Inter-AI Communication:** Issues the `[GENERATE]` command, effectively handing off the project to the Frontend AI with the detailed prompt.

### 4.5. Review (Internal Quality Check)

*   **Simple Explanation:** Once the Frontend AI has generated the code, it goes through an internal review by our specialist Reviewer AI. This AI checks for quality, accessibility, best practices, and ensures it matches the PRD. If anything needs fixing, it goes back for revisions.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** `CODE_REVIEW_PENDING_EXTERNAL` (waiting for Reviewer AI's verdict).
    *   **Process:** The Frontend AI delivers the generated code. This code is then automatically passed to the Reviewer AI for an in-depth, automated quality and accessibility audit. The Manager AI awaits the Reviewer AI's decision.
    *   **Tech Stack Interaction:**
        *   **Automated Code Analysis:** The Reviewer AI performs checks for:
            *   **HTML Structure & Semantics:** Correct use of tags, semantic markup.
            *   **CSS Best Practices:** Maintainability, responsiveness, cross-browser compatibility.
            *   **JavaScript Functionality:** Absence of errors, adherence to modern standards.
            *   **Accessibility (WCAG):** ARIA attributes, keyboard navigation, contrast ratios.
            *   **PRD Compliance:** Verifies that generated features and design elements align with the approved PRD.
        *   **Feedback Mechanism:** The Reviewer AI provides structured feedback: `[REVIEW_APPROVED]` or `[REVIEW_REJECTED]` with specific, bulleted issues if rejected.
        *   **Re-engagement Logic:** If `[REVIEW_REJECTED]` is received, the Manager AI formulates a *new* `[GENERATE]` prompt for the Frontend AI, incorporating the original PRD *and* the reviewer's specific fixes.

### 4.6. User Review

*   **Simple Explanation:** After passing our internal quality checks, I'll present the functional website (or its code files) to you. You'll get to see and interact with it, providing any final feedback or requests for changes.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** Transitions from `CODE_REVIEW_PENDING_EXTERNAL` (upon `[REVIEW_APPROVED]`) to `CODE_REVIEW_PENDING_USER`.
    *   **Process:** The Manager AI informs the user that the code has passed internal review and presents the conceptual "live preview" and "generated files." It enters a feedback loop, processing user requests for further modifications.
    *   **Tech Stack Interaction:**
        *   **User Input Interpretation (NLP):** Understands specific user requests for changes (e.g., "change this color," "move this section").
        *   **Iterative Prompt Generation:** If changes are requested, the Manager AI creates a new `[GENERATE]` prompt for the Frontend AI, combining the original PRD with the *new* user-requested changes. This initiates another round of `CODE_GENERATING` and `CODE_REVIEW_PENDING_EXTERNAL`.

### 4.7. Delivery

*   **Simple Explanation:** Once you're completely satisfied and give your final approval, the project is complete! I'll confirm that all files are ready for you.
*   **Detailed Explanation with Tech Stack & Internal Process:**
    *   **Manager AI State:** Transitions from `CODE_REVIEW_PENDING_USER` to `PROJECT_COMPLETE` upon explicit user satisfaction.
    *   **Process:** The Manager AI acknowledges the user's final approval and confirms project completion. It conceptually "packages" the final code, making it ready for download.
    *   **Tech Stack Interaction:**
        *   **Final Confirmation:** Issues the `[PROJECT_COMPLETE]` command, signaling the end of the project lifecycle.
        *   **File Handoff (Conceptual):** Prepares the final, approved set of HTML, CSS, and JS files for the user.

## 5. LLM Model Selection and Usage Behind the Scenes

Our platform leverages a sophisticated multi-LLM architecture, strategically deploying different models based on the specific task requirements for optimal performance, efficiency, and cost-effectiveness. The Manager AI acts as the orchestrator, making dynamic decisions on which LLM to invoke.

### 5.1. LLM Categories & Criteria

We categorize our available LLMs based on their strengths and select them using a combination of factors:

*   **General-Purpose Conversational LLMs (e.g., Manager AI's core model):**
    *   **Criteria:** High conversational fluency, strong reasoning capabilities, ability to understand complex and nuanced instructions, excellent summarization and planning skills.
    *   **When Used:** Primarily for `REQUIREMENT_GATHERING` (user interaction, asking clarifying questions), `PRD_DRAFTING` (synthesizing information, structuring documents), `PRD_REVIEW` (interpreting user feedback), `USER_REVIEW` (interpreting user change requests), and overall project management and state transitions. The Manager AI itself is powered by such a model.
    *   **Why Selected:** Best for human-like interaction, understanding ambiguous input, and high-level strategic planning.

*   **Code-Generation Optimized LLMs (e.g., Frontend AI):**
    *   **Criteria:** Deep understanding of programming languages (HTML, CSS, JavaScript), adherence to coding standards, ability to generate well-structured and functional code, strong prompt following.
    *   **When Used:** During `CODE_GENERATION`. The Manager AI passes a highly structured prompt to this specialized LLM.
    *   **Why Selected:** Superior performance in generating syntactically correct and semantically appropriate code, often trained on vast code corpuses. This allows for rapid and robust initial code scaffolding.

*   **Code-Analysis & Review Optimized LLMs (e.g., Reviewer AI):**
    *   **Criteria:** Expertise in identifying code quality issues, security vulnerabilities (conceptual for this project), accessibility standards (WCAG), performance bottlenecks, and compliance with specific style guides or the PRD.
    *   **When Used:** During the `REVIEW (Internal Quality Check)` phase. This LLM receives the generated code and the PRD.
    *   **Why Selected:** Excels at detailed code auditing, pattern recognition for errors, and comparing generated output against specified requirements. It's often a smaller, more focused model optimized for accuracy in specific code-related checks rather than broad creativity.

*   **Specialized NLP/NLU Models (Sub-components, not direct LLMs):**
    *   **Criteria:** Highly efficient for specific sub-tasks like entity extraction, sentiment analysis, or topic modeling.
    *   **When Used:** May be used as helper components within the Manager AI's workflow to quickly parse specific elements from user requests during `REQUIREMENT_GATHERING` or `PRD_REVIEW`, or to refine search queries.
    *   **Why Selected:** Offers speed and precision for narrow, well-defined linguistic tasks, offloading these from the larger, more resource-intensive general-purpose LLMs.

### 5.2. Behind the Selection Process

1.  **Task Identification:** As the project progresses, the Manager AI's internal state machine (e.g., `REQUIREMENT_GATHERING`, `CODE_GENERATING`) identifies the current task.
2.  **Capability Matching:** The Manager AI then matches the identified task to the most suitable LLM or AI component based on the criteria outlined above. For instance, a conversational query goes to the general-purpose LLM (Manager AI itself), while a request for code generation is routed to the Frontend AI.
3.  **Prompt Engineering:** Crucially, the Manager AI translates the user's intent and the project's requirements into a highly specific and optimized prompt for the selected downstream LLM. This "prompt engineering" is key to getting the best output from specialized models. For example, the `[GENERATE]` command isn't just a simple handover; it's a meticulously crafted instruction set based on the approved PRD.
4.  **Resource Optimization:** Decisions also implicitly consider computational cost and latency. More complex and costly models are reserved for tasks where their advanced capabilities are essential (e.g., creative generation), while faster, more efficient models handle routine analysis or structured data generation.
5.  **Feedback Loop & Iteration:** The Manager AI continuously evaluates the output of these specialized AIs. If the Reviewer AI (`[REVIEW_REJECTED]`) flags issues, the Manager AI intelligently re-prompts the Frontend AI, incorporating the feedback, demonstrating a dynamic, iterative refinement process.

This multi-model approach allows us to combine the strengths of various AI agents, ensuring that each phase of your project benefits from the most appropriate and effective intelligence, leading to superior outcomes and a highly efficient workflow.

## 6. Design & Style Guide
*   **Communication Style:** Conversational, professional, guiding, and responsive.
*   **Response Structure:** Always starts with `[THINK]` block.
*   **Output Formats:**
    *   PRD: Markdown.
    *   Command Usage: Specific commands like `[CREATE_PRD]`, `[GENERATE]`, `[PROJECT_COMPLETE]` as per protocol.
    *   Citations: `[cite:INDEX]` for search results (though less common for internal process descriptions).

## 7. Image Assets
No custom images required for this meta-PRD describing the Manager AI's process.

## 8. Video Assets
No custom videos required for this meta-PRD describing the Manager AI's process.

## 9. Proposed Internal State & Response Structure
The Manager AI operates with an internal state mechanism that tracks the current project phase and decision points. This influences the structure and content of its responses.

*   **Internal States:**
    *   `REQUIREMENT_GATHERING`: Active when initial user input is processed, and questions are being asked.
    *   `PRD_DRAFTING`: Active once requirements are sufficiently clear, leading to `[CREATE_PRD]` output.
    *   `PRD_REVIEW`: Waiting for user approval of the generated PRD.
    *   `CODE_GENERATING`: Active after PRD approval, leading to `[GENERATE]` command.
    *   `CODE_REVIEW_PENDING_EXTERNAL`: Waiting for `[REVIEW_APPROVED]` or `[REVIEW_REJECTED]` from Reviewer AI.
    *   `CODE_REVIEW_PENDING_USER`: Presenting approved code to the user for final feedback.
    *   `PROJECT_COMPLETE`: Final state upon user's explicit satisfaction and `[PROJECT_COMPLETE]` command issued.

*   **Response Management:**
    *   Each response is prefixed with a `[THINK]` block detailing the current state, understanding of the user request, plan, and rationale.
    *   Specific commands are used as transition triggers between states or to hand off tasks to other AIs (e.g., `[GENERATE]` for Frontend AI).
    *   Conversational elements are integrated where appropriate for user engagement and clarity.
