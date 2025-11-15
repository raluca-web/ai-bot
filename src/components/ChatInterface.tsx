import { useState, useRef, useEffect } from 'react';
import { Send, User, FileText, Upload } from 'lucide-react';
import { sendMessage } from '../services/chatService';
import type { ChatResponse } from '../types';
import DeepChartsLogo from './DeepChartsLogo';
import BulkUpload from './BulkUpload';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ documentId: string; pageNumber: number }>;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendMessage(userMessage.content);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error
          ? `I apologize, but I encountered an error: ${error.message}`
          : 'I apologize, but I encountered an unexpected error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0a1a] to-[#0a0a0f] relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(124,58,237,0.1),transparent_50%)] pointer-events-none"></div>
      <header className="bg-dark-card/30 border-b border-white/10 px-6 py-5 backdrop-blur-xl relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary to-primary-dark px-4 py-3 rounded-2xl shadow-lg shadow-primary/20">
              <DeepChartsLogo className="w-28 h-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Documentation Assistant</h1>
              <p className="text-sm text-gray-400">Ask me anything about your software documentation</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-gradient-to-br from-primary to-primary-dark text-white px-5 py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 flex items-center gap-2 font-medium transform hover:scale-[1.02]"
          >
            <Upload className="w-5 h-5" />
            Upload PDFs
          </button>
        </div>
      </header>

      {showUpload && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Upload PDF Documents</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <BulkUpload onUploadComplete={() => setShowUpload(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-6">
              <div className="bg-gradient-to-br from-primary/20 to-primary-dark/20 px-8 py-6 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl border border-primary/20 animate-float w-fit">
                <DeepChartsLogo className="w-32 h-auto" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome! How can I help you today?
                </h2>
                <p className="text-gray-400 max-w-md mx-auto text-lg">
                  I can answer questions about your software documentation. Just type your question below and I'll provide clear, helpful answers.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-8">
                {[
                  'How do I get started?',
                  'What are the main features?',
                  'How do I configure the system?',
                  'Where can I find API documentation?',
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="text-left p-5 bg-dark-card rounded-2xl border border-gray-400 hover:border-gray-300 hover:bg-dark-card/80 transition-all duration-300 text-sm text-gray-400 hover:text-white transform hover:scale-[1.02]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="bg-gradient-to-br from-primary to-primary-dark px-3 py-2 rounded-xl h-fit shadow-lg shadow-primary/20">
                  <DeepChartsLogo className="w-16 h-auto" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                    : 'bg-dark-card text-gray-200 border border-white/10'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-medium">Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary font-medium"
                        >
                          Page {source.pageNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="bg-dark-card border border-white/10 p-2.5 rounded-xl h-fit">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-primary to-primary-dark px-3 py-2 rounded-xl h-fit shadow-lg shadow-primary/20">
                <DeepChartsLogo className="w-16 h-auto" />
              </div>
              <div className="bg-dark-card rounded-2xl px-6 py-4 border border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-dark-card/30 backdrop-blur-xl px-4 py-5 relative z-10">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documentation..."
            className="flex-1 resize-none border-2 border-primary rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-dark-card text-white placeholder-gray-500 transition-all hover:border-primary"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(124,58,237,0.15)] hover:shadow-[0_0_50px_rgba(124,58,237,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center gap-2 transform hover:scale-[1.02]"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
