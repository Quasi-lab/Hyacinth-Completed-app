import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Database,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolUsed {
  name: string;
  summary: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  toolsUsed?: ToolUsed[];
  isError?: boolean;
}

const PRESET_QUESTIONS = [
  {
    label: 'August 2026 Admissions',
    prompt: 'Who were the patients admitted in August 2026, and who were their attending physicians?',
  },
  {
    label: 'Room 301 Usage (May 2026)',
    prompt: 'Which patients occupied Room 301 in May 2026, and what was the total number of patients who used that room during that period?',
  },
  {
    label: 'Room 303 Staffing',
    prompt: 'Who are the assigned doctors and nurses for Room 303, and what is the total head count of medical staff assigned there?',
  },
  {
    label: 'May 2026 Financials & Services',
    prompt: 'What services were rendered in May 2026, and what was the total financial revenue generated?',
  },
];

const TOOL_LABELS: Record<string, string> = {
  query_admissions_by_period: 'PatientRecords + Doctor_Dim',
  query_room_usage: 'Room Usage (PatientRecords)',
  query_room_staffing: 'Room Staffing (UNION ALL)',
  query_top_patients_by_billing: 'Top Patients by Total Billing',
  query_financials_and_services: 'Bill_Dim Aggregation',
  get_clinic_overview: 'Clinic KPI Overview',
};

function renderInlineFormatting(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[\s\S]+?\*\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/80 text-[10px] font-mono text-slate-300">
        <span className="uppercase tracking-wider">{lang || 'sql'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono overflow-x-auto leading-relaxed text-emerald-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} lang={lang} />);
      continue;
    }

    // Markdown table
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      /^\s*\|[\s:-]+\|/.test(lines[i + 1])
    ) {
      const parseRow = (r: string) =>
        r
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map(cell => cell.trim());

      const headers = parseRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      blocks.push(
        <div key={`tbl-${i}`} className="my-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-emerald-50/80 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20 text-slate-700 dark:text-slate-200 font-semibold">
                {headers.map((h, idx) => (
                  <th key={idx} className="py-1.5 px-2.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40">
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="py-1.5 px-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono text-[10.5px]">
                      {renderInlineFormatting(row[cIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={`h3-${i}`} className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2.5 mb-1">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={`h2-${i}`} className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mt-3 mb-1">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // Bullet / numbered lists
    if (/^\s*[-*•]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*•]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc pl-4 my-1.5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal pl-4 my-1.5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push(
      <p key={`p-${i}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">
        {renderInlineFormatting(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{blocks}</div>;
};

export const ClinicChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am the **Hyacinth Clinic AI Analyst & PostgreSQL Engineer**. Ask me about patient admissions, room usage, medical staff assignments, monthly service revenues, or Supabase star-schema SQL queries.',
    },
  ]);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [isOpen]);

  const sendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textToSend) setInput('');
    setShowPrompts(false);
    setIsSending(true);

    try {
      // Send clean conversation history (excluding welcome/error stubs if error)
      const apiMessages = nextHistory
        .filter(m => !m.isError && m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response returned.',
        toolsUsed: Array.isArray(data.toolsUsed) ? data.toolsUsed : [],
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: err?.message || 'Unable to reach the Groq analyst service.',
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: 'Conversation cleared. Ask me about **Hyacinth Clinic** admissions, Room 301/303 records, service revenues, or Supabase SQL queries!',
      },
    ]);
    setShowPrompts(true);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            className="group fixed bottom-5 right-5 z-40 h-12 min-w-12 px-2 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-700 to-teal-600 text-white shadow-lg shadow-emerald-900/20 border border-emerald-400/30 flex items-center justify-center hover:from-emerald-800 hover:to-teal-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] dark:focus-visible:ring-offset-slate-950"
            aria-label="Open Clinic AI Analyst Chat"
          >
            <div className="w-7 h-7 shrink-0 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <div className="ml-0 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-2.5 group-hover:max-w-[170px] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[170px] group-focus-visible:opacity-100 motion-reduce:transition-none">
              <div className="text-left">
                <div className="text-xs font-bold leading-none">Clinic AI Analyst</div>
                <div className="text-[10px] text-emerald-100 mt-0.5 leading-none">Ask data & SQL questions</div>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Drawer / Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-4 right-4 z-50 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/80 dark:border-emerald-500/25 overflow-hidden transition-all duration-200 ${
              isExpanded
                ? 'w-[calc(100vw-2rem)] sm:w-[700px] h-[min(86vh,760px)]'
                : 'w-[calc(100vw-2rem)] sm:w-[440px] h-[min(78vh,620px)]'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white dark:from-emerald-500/10 dark:via-slate-900 dark:to-slate-900 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Hyacinth Clinic AI Analyst</h3>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                    Star-Schema Analyst · Supabase SQL Engineer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
                  title={isExpanded ? 'Compact view' : 'Expand chat window'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                  title="New conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-slate-950/40">
              {messages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {isUser ? 'You' : 'Clinic AI'}
                      </span>
                    </div>

                    {msg.isError ? (
                      <div className="max-w-[92%] rounded-2xl px-3.5 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-semibold">Assistant Error</div>
                          <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ) : isUser ? (
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 bg-emerald-700 text-white text-xs leading-relaxed shadow-xs">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-[95%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs space-y-2">
                        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pb-1.5 border-b border-slate-100 dark:border-slate-700/60">
                            <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            {Array.from(new Set(msg.toolsUsed.map(t => t.name))).map(toolName => (
                              <span
                                key={toolName}
                                className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200/70 dark:border-emerald-500/30"
                              >
                                {TOOL_LABELS[toolName] || toolName}
                              </span>
                            ))}
                          </div>
                        )}
                        <MarkdownContent content={msg.text} />
                      </div>
                    )}
                  </div>
                );
              })}

              {isSending && (
                <div className="flex flex-col items-start">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 px-1">
                    Clinic AI
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                    <span>Querying star schema & analyzing...</span>
                  </div>
                </div>
              )}

              <div ref={threadEndRef} />
            </div>

            {/* Suggested Clinic Questions Tray */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pt-2 pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrompts(p => !p)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 py-1"
              >
                <span>Quick Clinical & Financial Questions</span>
                {showPrompts ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence initial={false}>
                {showPrompts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 py-1.5">
                      {PRESET_QUESTIONS.map(q => (
                        <button
                          key={q.label}
                          type="button"
                          disabled={isSending}
                          onClick={() => sendMessage(q.prompt)}
                          className="text-left p-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors disabled:opacity-50"
                        >
                          <div className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300">{q.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{q.prompt}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-end gap-2 shrink-0"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about August/May 2026, Room 301/303, or SQL..."
                className="flex-1 resize-none px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 max-h-24"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white transition-colors shrink-0 shadow-xs"
                aria-label="Send message"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
