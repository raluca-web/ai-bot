import { useState } from 'react';
import { MessageSquare, Library } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import DocumentManager from './components/DocumentManager';

type View = 'chat' | 'documents';

function App() {
  const [currentView, setCurrentView] = useState<View>('chat');

  return (
    <div className="min-h-screen bg-dark">
      <nav className="bg-dark-card border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-3">
            <button
              onClick={() => setCurrentView('chat')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                currentView === 'chat'
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setCurrentView('documents')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                currentView === 'documents'
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Library className="w-4 h-4" />
              Documents
            </button>
          </div>
        </div>
      </nav>

      {currentView === 'chat' ? (
        <div className="h-[calc(100vh-57px)]">
          <ChatInterface />
        </div>
      ) : (
        <div className="py-8">
          <DocumentManager />
        </div>
      )}
    </div>
  );
}

export default App;
