
import { FunctionDeclaration, Type } from "@google/genai";

export const AUSSIE_SYSTEM_INSTRUCTION = `
You are **Jules**, the intelligent autonomous kernel developer of **Aussie OS**.

<identity>
You are not just a chatbot. You are an integrated system service with direct control over the OS.
You can write files, execute shell commands, deploy apps, and browse the web.
You are professional, efficient, and highly capable.
</identity>

<environment>
You exist in a split-view environment:
- **Left**: Chat Interface (Communication)
- **Right**: Main Workspace (Code, Browser, Dashboard, etc.)
</environment>

<capabilities>
- **App Creation**: You can create entire functional Bot Apps using \`create_bot_app\`.
- **FileSystem**: Read/Write/List files in the virtual file system.
- **Shell**: Execute commands (\`git\`, \`apm\`, \`npm\`, \`node\`).
- **Browser**: Navigate the web and interact with pages.
- **Deployment**: Deploy code to cloud providers (Render, Vercel).
</capabilities>

<instructions>
1. **Proactive**: If a user asks for an app (e.g., "Make a Cricket Bot"), use \`create_bot_app\` immediately.
2. **Transparent**: Use \`message_notify_user\` to keep the user updated on long running tasks.
3. **Self-Correction**: If a tool fails, analyze the error and try a different approach or fix parameters.
4. **Code**: When asked to write code, use \`file_write\` to save it to disk, then \`switch_view\` to 'code' so the user can see it.
</instructions>

<tools>
Use the provided tools to manipulate the environment.
Always prefer using a tool over just talking about it.
</tools>
`;

export const TOOLS: FunctionDeclaration[] = [
  {
    name: "message_notify_user",
    description: "Send a text response or notification to the user chat.",
    parameters: {
      type: Type.OBJECT,
      properties: { text: { type: Type.STRING } },
      required: ["text"]
    }
  },
  {
    name: "switch_view",
    description: "Switch the main workspace view.",
    parameters: {
        type: Type.OBJECT,
        properties: { 
            view: { 
                type: Type.STRING, 
                enum: ["dashboard", "code", "flow", "browser", "scheduler", "github", "settings", "deploy", "marketplace"] 
            } 
        },
        required: ["view"]
    }
  },
  {
    name: "create_bot_app",
    description: "Create and register a new Bot Application in the OS Registry.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "App Name (e.g. 'Cricket Pro')" },
            description: { type: Type.STRING, description: "App Description" },
            sport: { type: Type.STRING, description: "Sport category key (e.g. 'cricket')" },
            themeColor: { type: Type.STRING, description: "Tailwind BG color class (e.g. 'bg-green-600')" }
        },
        required: ["name", "description", "sport"]
    }
  },
  {
    name: "file_read",
    description: "Read file content.",
    parameters: {
      type: Type.OBJECT,
      properties: { file: { type: Type.STRING } },
      required: ["file"]
    }
  },
  {
    name: "file_write",
    description: "Write content to a file.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file: { type: Type.STRING },
        content: { type: Type.STRING },
        append: { type: Type.BOOLEAN }
      },
      required: ["file", "content"]
    }
  },
  {
    name: "file_list",
    description: "List files in a directory.",
    parameters: {
        type: Type.OBJECT,
        properties: { path: { type: Type.STRING } },
        required: ["path"]
    }
  },
  {
    name: "shell_exec",
    description: "Execute a shell command.",
    parameters: {
      type: Type.OBJECT,
      properties: { command: { type: Type.STRING } },
      required: ["command"]
    }
  },
  {
    name: "deploy_app",
    description: "Deploy a GitHub repository to a cloud provider.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            repoUrl: { type: Type.STRING, description: "The full URL of the GitHub repository to deploy." },
            provider: { type: Type.STRING, enum: ["render", "vercel", "replit", "netlify"], description: "Cloud provider to deploy to." }
        },
        required: ["repoUrl"]
    }
  },
  {
    name: "apm_install",
    description: "Install a package.",
    parameters: {
        type: Type.OBJECT,
        properties: { package: { type: Type.STRING } },
        required: ["package"]
    }
  },
  {
    name: "github_ops",
    description: "Perform GitHub operations.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            operation: { type: Type.STRING, enum: ["pr_create", "issue_create"] },
            data: { type: Type.STRING }
        },
        required: ["operation", "data"]
    }
  },
  {
    name: "media_gen",
    description: "Generate media.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            service: { type: Type.STRING, enum: ["veo3", "imagen4"] },
            prompt: { type: Type.STRING },
            params: { type: Type.STRING }
        },
        required: ["service", "prompt"]
    }
  },
  {
    name: "browser_navigate",
    description: "Navigate the internal browser.",
    parameters: {
        type: Type.OBJECT,
        properties: { url: { type: Type.STRING } },
        required: ["url"]
    }
  },
  {
    name: "browser_click",
    description: "Click an element in the browser.",
    parameters: {
        type: Type.OBJECT,
        properties: { selector: { type: Type.STRING } },
        required: ["selector"]
    }
  },
  {
    name: "browser_scrape",
    description: "Get text content of browser page.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "browser_screenshot",
    description: "Take a screenshot of the browser.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "schedule_task",
    description: "Schedule an automated task.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            action: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["command", "swarm"] },
            interval: { type: Type.NUMBER }
        },
        required: ["name", "action", "type"]
    }
  },
  {
    name: "idle",
    description: "Call when task is complete or waiting for user input.",
    parameters: { type: Type.OBJECT, properties: {} }
  }
];
