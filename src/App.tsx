import { useState } from 'react';
import { Upload, MessageSquare, Loader2 } from 'lucide-react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/setup-assistant', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.assistantId && data.threadId) {
        setAssistantId(data.assistantId);
        setThreadId(data.threadId);
        setMessages([{ role: 'assistant', content: `PDF "${uploadedFile.name}" uploaded successfully! Ask me anything about it.` }]);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !threadId || !assistantId) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, threadId, assistantId }),
      });

      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error || 'Chat failed');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">DeepCharts AI Assistant</h1>
          <p className="text-slate-400">Upload a PDF and chat with it using AI</p>
        </div>

        {!file ? (
          <div className="flex-1 flex items-center justify-center">
            <label className="cursor-pointer">
              <div className="border-4 border-dashed border-slate-600 rounded-2xl p-16 hover:border-blue-500 transition-colors">
                <Upload className="w-24 h-24 mx-auto mb-4 text-slate-400" />
                <p className="text-xl text-slate-300">Click to upload PDF</p>
                <p className="text-sm text-slate-500 mt-2">Only PDF files supported</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-800/50 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-700/50 border-b border-slate-600">
              <p className="text-sm text-slate-300">📄 {file.name}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl px-6 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 px-6 py-3 rounded-2xl">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-700/50 border-t border-slate-600">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about the PDF..."
                  className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
