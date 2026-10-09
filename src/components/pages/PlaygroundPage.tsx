import React, { useState, useRef, useEffect } from 'react';
import { useModelMesh } from '../../context/ModelMeshContext';
import type { RoutingStrategy } from '../../types';
import { executeTaskApi, generateImageApi, type ExecuteTaskResponse } from '../../services/api';
import {
  Send,
  User,
  Cpu,
  Copy,
  Check,
  Code,
  Calculator,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Radio,
  Zap,
  RefreshCw,
  Plus,
  CornerDownLeft,
  Image as ImageIcon,
  Download
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    modelId?: string;
    modelName?: string;
    provider?: string;
    realLatencyMs?: number;
    taskType?: string;
    fallbackUsed?: boolean;
    isSimulated?: boolean;
    simulatedLabel?: string | null;
    privacyRedactions?: number;
    routingStrategy?: string;
    confidence?: string;
    winningCandidateScore?: number;
    imageDataUri?: string | null;
  };
  error?: {
    type: string;
    title: string;
    message: string;
  };
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
        <span className="text-[11px] font-bold tracking-wide uppercase text-indigo-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-indigo-200 leading-relaxed whitespace-pre font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs">{token.slice(1, -1)}</code>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

const ProseBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="font-bold text-white text-sm sm:text-base mt-2 mb-1">{renderInlineFormatting(trimmed.slice(4))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="font-extrabold text-white text-base sm:text-lg mt-3 mb-1.5">{renderInlineFormatting(trimmed.slice(3))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} className="font-extrabold text-white text-lg sm:text-xl mt-3 mb-1.5">{renderInlineFormatting(trimmed.slice(2))}</h2>;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              <span>{renderInlineFormatting(trimmed.slice(2))}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-bold text-indigo-400">{numMatch[1]}.</span>
              <span>{renderInlineFormatting(numMatch[2])}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
};

export const MarkdownMessageRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      elements.push(<ProseBlock key={`text-${lastIndex}`} text={textBefore} />);
    }
    const language = match[1] || 'text';
    const code = match[2].trim();
    elements.push(<CodeBlock key={`code-${match.index}`} language={language} code={code} />);
    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.slice(lastIndex);
  if (remainingText.trim()) {
    elements.push(<ProseBlock key={`text-${lastIndex}`} text={remainingText} />);
  }

  return <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">{elements}</div>;
};

export const PlaygroundPage: React.FC = () => {
  const {
    strategy,
    setStrategy,
    executeRouting
  } = useModelMesh();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<'live' | 'simulation'>('live');
  const [isImageMode, setIsImageMode] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [expandedMetadataId, setExpandedMetadataId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputPrompt]);

  // Starter Prompt Cards
  const starterPrompts = [
    {
      label: 'Image Generation',
      taskType: 'image_generation',
      icon: <ImageIcon className="w-5 h-5 text-pink-400" />,
      title: 'Stability AI Image Gen',
      subtitle: 'Generate high-resolution digital art with Stable Image Core.',
      prompt: 'A futuristic floating city at sunset, digital art, highly detailed, 4k'
    },
    {
      label: 'Coding & Systems',
      taskType: 'coding',
      icon: <Code className="w-5 h-5 text-indigo-400" />,
      title: 'Rust Async Connection Pool',
      subtitle: 'PostgreSQL connection pool with Tokio and exponential backoff.',
      prompt: 'Write a Rust async function using Tokio to query a PostgreSQL database connection pool with automatic retries and exponential backoff.'
    },
    {
      label: 'Math & Proofs',
      taskType: 'mathematics',
      icon: <Calculator className="w-5 h-5 text-purple-400" />,
      title: 'Real Analysis Proof',
      subtitle: 'Prove convergence of sequence a_n = (1 + 1/n)^n bounded by 3.',
      prompt: 'Prove the convergence of the sequence a_n = (1 + 1/n)^n using real analysis limit theorems and show that e is strictly bounded by 3.'
    },
    {
      label: 'Translation & Speed',
      taskType: 'translation',
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      title: 'Multi-Language Translation',
      subtitle: 'Translate user feedback payload to French, German, and Spanish.',
      prompt: 'Translate this user feedback payload to French, German, and Spanish instantly for real-time notification dispatch.'
    }
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isExecuting) return;

    const isImageReq = isImageMode ||
      /\b(generate|create|draw|paint|render)\b.*\b(image|photo|picture|logo|sketch|illustration)\b/i.test(textToSend) ||
      /^\s*draw\b/i.test(textToSend) ||
      textToSend.toLowerCase().startsWith('/image') ||
      customPrompt?.includes('floating city');

    const promptText = textToSend.toLowerCase().startsWith('/image ')
      ? textToSend.slice(7).trim()
      : textToSend;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = 'user_' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: textToSend,
      timestamp: timeString
    };

    const assistantMsgId = 'ast_' + (Date.now() + 1);
    const placeholderAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: timeString
    };

    setMessages((prev) => [...prev, newUserMessage, placeholderAssistantMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsExecuting(true);

    if (executionMode === 'live') {
      try {
        let res: ExecuteTaskResponse;
        if (isImageReq) {
          res = await generateImageApi(promptText);
        } else {
          const historyPayload = messages
            .filter((m) => m.content && !m.error)
            .slice(-10)
            .map((m) => ({ sender: m.sender, content: m.content }));

          res = await executeTaskApi({
            query: textToSend,
            strategy: strategy as any,
            history: historyPayload
          });
        }

        if (res.status === 'success' && res.execution) {
          const exec = res.execution;
          const routing = res.routing;
          const privacy = res.privacy;
          const queryAnalysis = res.queryAnalysis;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: exec.output || (exec.imageDataUri ? `Generated image for prompt: "${promptText}"` : 'No text output returned from model.'),
                    metadata: {
                      modelId: exec.modelId,
                      modelName: routing?.winningCandidate?.modelName || (isImageReq ? 'Stability AI (Stable Image Core)' : exec.modelId),
                      provider: exec.provider || (isImageReq ? 'Stability AI' : 'LLM Provider'),
                      realLatencyMs: exec.realLatencyMs,
                      taskType: queryAnalysis?.taskType || (isImageReq ? 'image_generation' : 'general'),
                      fallbackUsed: routing?.fallbackUsed,
                      isSimulated: exec.isSimulated || exec.sourceType === 'static_fallback',
                      simulatedLabel: exec.simulatedLabel,
                      privacyRedactions: privacy?.redactionCount || 0,
                      routingStrategy: routing?.routingStrategy || strategy,
                      confidence: routing?.confidence,
                      winningCandidateScore: routing?.winningCandidate?.totalScore,
                      imageDataUri: exec.imageDataUri || null
                    }
                  }
                : msg
            )
          );
        } else {
          const errDetail = res.message || res.lastError || 'Execution encountered an issue.';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: `[Execution Error] ${errDetail}`,
                    error: {
                      type: res.status || 'execution_error',
                      title: res.status === 'auth_error'
                        ? 'Authentication Required (401)'
                        : res.status === 'quota_error'
                        ? 'Quota / Credit Exceeded (402/429)'
                        : 'Execution Error',
                      message: errDetail
                    }
                  }
                : msg
            )
          );
        }
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: '[Backend Connection Error] Failed to reach ModelMesh AI backend server.',
                  error: {
                    type: 'network_error',
                    title: 'Backend Connection Error',
                    message: err.message || 'Could not connect to backend server at http://localhost:3001.'
                  }
                }
              : msg
          )
        );
      } finally {
        setIsExecuting(false);
      }
    } else {
      // Offline Demo (Simulation) Mode
      setTimeout(() => {
        const routingRes = executeRouting(textToSend);
        const fullText = routingRes.simulatedResponse || 'Offline simulation task completed.';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: fullText,
                  metadata: {
                    modelId: routingRes.selectedModel.id,
                    modelName: routingRes.selectedModel.name,
                    provider: routingRes.selectedModel.provider,
                    realLatencyMs: routingRes.executionTimeMs,
                    taskType: 'general',
                    isSimulated: true,
                    simulatedLabel: 'Offline Demo Simulation',
                    routingStrategy: strategy,
                    confidence: 'High',
                    winningCandidateScore: routingRes.allScores?.[0]?.totalScore || routingRes.selectedModel.qualityScore
                  }
                }
              : msg
          )
        );
        setIsExecuting(false);
      }, 350);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputPrompt('');
    setExpandedMetadataId(null);
  };

  const toggleMetadata = (msgId: string) => {
    setExpandedMetadataId((prev) => (prev === msgId ? null : msgId));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-6xl mx-auto space-y-4 fade-in">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">AI Playground Chatbot</h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Conversational Multi-LLM Execution via ModelMesh AI Context Understanding & Routing
            </p>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* New Chat Button */}
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Chat</span>
          </button>

          {/* Execution Mode & Image Generation Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => { setExecutionMode('live'); setIsImageMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                executionMode === 'live' && !isImageMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3 h-3 ${executionMode === 'live' && !isImageMode ? 'animate-pulse' : ''}`} />
              Live Chat
            </button>

            <button
              onClick={() => { setExecutionMode('live'); setIsImageMode(true); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                isImageMode
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Image Generation Mode via Stability AI"
            >
              <ImageIcon className="w-3 h-3 text-pink-300" />
              Image Gen
            </button>

            <button
              onClick={() => { setExecutionMode('simulation'); setIsImageMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                executionMode === 'simulation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Offline Demo
            </button>
          </div>

          {/* Strategy Selector Pills */}
          <div className="flex items-center gap-1 bg-slate-900 border border-white/10 p-1 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium px-1.5 hidden md:inline">Strategy:</span>
            {(['balanced', 'cost', 'latency', 'quality'] as RoutingStrategy[]).map((st) => (
              <button
                key={st}
                onClick={() => setStrategy(st)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold capitalize transition ${
                  strategy === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Conversation History Container */}
      <div className="flex-1 overflow-y-auto px-1 space-y-6 min-h-0 custom-scrollbar">
        {messages.length === 0 ? (
          /* Centered Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto space-y-8 my-auto">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                What can ModelMesh AI help you with today?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Ask coding questions, prove mathematical theorems, request translations, or evaluate system architecture through privacy-aware, deterministic LLM routing.
              </p>
            </div>

            {/* Starter Prompt Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
              {starterPrompts.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(preset.prompt)}
                  className="p-4 rounded-2xl glass-panel hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group space-y-2 text-left shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-900 border border-white/10 group-hover:border-indigo-500/30">
                      {preset.icon}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 group-hover:text-indigo-400">
                      {preset.label}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition">
                      {preset.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                      {preset.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Assistant Avatar */}
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-1 shadow-sm">
                  <Cpu className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-md'
                    : 'bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs p-4 shadow-sm text-slate-200'
                }`}
              >
                {/* User Content */}
                {msg.sender === 'user' ? (
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant Content & Loading State */
                  <div className="space-y-3">
                    {/* Output Text or Loading Spinner */}
                    {msg.content ? (
                      <>
                        {msg.metadata?.imageDataUri && (
                          <div className="my-2.5 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-xl group">
                            <div className="relative overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                              <img
                                src={msg.metadata.imageDataUri}
                                alt="Generated by Stability AI"
                                className="w-full max-h-[480px] object-contain rounded-xl shadow-inner"
                              />
                            </div>
                            <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-pink-400 font-bold">Stability AI (Stable Image Core)</span>
                              </div>
                              <a
                                href={msg.metadata.imageDataUri}
                                download={`stability-ai-${msg.id}.png`}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-sans text-xs font-bold transition shadow-sm ml-auto"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PNG</span>
                              </a>
                            </div>
                          </div>
                        )}
                        <MarkdownMessageRenderer content={msg.content} />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-indigo-400 py-1 font-mono">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{isImageMode ? 'Stability AI generating image from prompt...' : 'ModelMesh AI routing prompt to optimal provider...'}</span>
                      </div>
                    )}

                    {/* Assistant Message Actions & Expandable ModelMesh Telemetry */}
                    {msg.content && (
                      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                        {/* Compact Details Toggle */}
                        {msg.metadata && (
                          <button
                            onClick={() => toggleMetadata(msg.id)}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white transition py-0.5 px-2 rounded-md hover:bg-slate-800"
                          >
                            <Cpu className="w-3 h-3 text-indigo-400" />
                            <span>
                              {msg.metadata.modelName || msg.metadata.modelId} ({msg.metadata.realLatencyMs}ms)
                            </span>
                            {expandedMetadataId === msg.id ? (
                              <ChevronUp className="w-3 h-3 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        )}

                        {/* Copy Code / Text Action */}
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-950 px-2 py-1 rounded-md border border-slate-800 transition ml-auto"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Expandable ModelMesh Telemetry Drawer */}
                    {expandedMetadataId === msg.id && msg.metadata && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2 text-slate-300 fade-in">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400">Winning Provider:</span>
                          <span className="text-indigo-300 font-bold">{msg.metadata.provider}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400">Model ID:</span>
                          <span className="text-white">{msg.metadata.modelId}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400">Task Type:</span>
                          <span className="text-cyan-300 capitalize">{msg.metadata.taskType}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400">Measured Latency:</span>
                          <span className="text-cyan-400">{msg.metadata.realLatencyMs}ms</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-slate-400">Routing Strategy:</span>
                          <span className="text-white capitalize">{msg.metadata.routingStrategy}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Privacy Redactions:</span>
                          <span className="text-emerald-400">{msg.metadata.privacyRedactions} items</span>
                        </div>
                      </div>
                    )}

                    {/* Error Banner & Retry option */}
                    {msg.error && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/50 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{msg.error.title}</span>
                        </div>
                        <p className="text-xs text-amber-200/90 font-mono">
                          {msg.error.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Composer */}
      <div className="glass-panel p-3 border-t border-white/10 rounded-2xl shadow-xl shrink-0 space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask ModelMesh AI anything... (Press Enter to send, Shift+Enter for newline)"
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none max-h-36 py-2 px-2 font-sans"
            rows={1}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isExecuting}
            className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center shrink-0 ${
              inputPrompt.trim() && !isExecuting
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Send Message (Enter)"
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3 text-slate-400" />
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Shift + Enter</kbd> for newline
          </span>
          <span className="hidden sm:inline text-slate-400">
            ModelMesh AI v2.4 Engine
          </span>
        </div>
      </div>
    </div>
  );
};
