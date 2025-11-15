import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Check } from 'lucide-react';
import DeepChartsLogo from './components/DeepChartsLogo';
import { openai, assistantId } from './lib/openai';

function App() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hi! Ask me anything about DeepCharts.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    const initThread = async () => {
      try {
        const thread = await openai.beta.threads.create();
        setThreadId(thread.id);
      } catch (error) {
        console.error('Failed to create thread:', error);
      }
    };
    initThread();
  }, []);

  const handleCopyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !threadId || !assistantId) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage,
      });

      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId,
      });

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];
        const response = lastMessage.content[0].type === 'text'
          ? lastMessage.content[0].text.value
          : 'Unable to get response';

        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        throw new Error(`Run status: ${run.status}`);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#12101f] to-[#0a0a14] text-white">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <DeepChartsLogo className="w-48 h-8" />
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleCopyLink('https://deepcharts.io', 'Home')}
                className="text-gray-400 hover:text-white transition-colors relative"
              >
                Home
                {copiedLink === 'Home' && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary px-2 py-1 rounded text-xs flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </button>
              <button
                onClick={() => handleCopyLink('https://deepcharts.io/docs', 'Docs')}
                className="text-gray-400 hover:text-white transition-colors relative"
              >
                Docs
                {copiedLink === 'Docs' && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary px-2 py-1 rounded text-xs flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </button>
              <button
                onClick={() => handleCopyLink('https://deepcharts.io/support', 'Support')}
                className="text-gray-400 hover:text-white transition-colors relative"
              >
                Support
                {copiedLink === 'Support' && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary px-2 py-1 rounded text-xs flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#0f0f0f]/80 backdrop-blur-sm rounded-2xl border border-primary/20 overflow-hidden shadow-2xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl px-5 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg'
                    : 'bg-dark-lighter border border-accent/20 text-gray-100'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-dark-lighter border border-accent/20 px-5 py-3 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-dark-lighter/50 border-t border-primary/20 backdrop-blur">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question about DeepCharts..."
                className="flex-1 bg-dark-lighter text-white px-5 py-3 rounded-xl border border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent placeholder-gray-500 transition-all"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary disabled:from-gray-700 disabled:to-gray-600 px-6 py-3 rounded-xl font-medium transition-all shadow-[0_4px_40px_rgba(81,47,235,0.7)] hover:shadow-[0_4px_50px_rgba(81,47,235,0.9)] disabled:shadow-none"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
