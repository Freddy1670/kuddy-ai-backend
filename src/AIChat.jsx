import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Looking for skincare recommendations or product help today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Calls backend server passing latest user query and message history
      const response = await fetch('https://kuddy-ai-backend-2.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text, 
          history: updatedMessages 
        })
      });
      
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data.reply }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Connection error. Please check if your local server is running.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-800 transition-all font-medium flex items-center gap-2 cursor-pointer"
        >
          💬 Ask AI Assistant
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-sm">Kuddy Skincare Assistant</span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-xs">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl ${
                    m.sender === 'user'
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.sender === 'bot' ? (
                    <div className="prose prose-xs max-w-full leading-relaxed space-y-1">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Renders product link as a working, styled clickable anchor tag
                          a: ({ node, href, children, ...props }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-600 font-bold underline hover:text-pink-800 inline-block mt-1"
                              {...props}
                            >
                              {children}
                            </a>
                          ),
                          h3: ({ node, children }) => (
                            <h3 className="text-xs font-bold text-gray-900 mt-2 mb-1">{children}</h3>
                          ),
                          h4: ({ node, children }) => (
                            <h4 className="text-xs font-semibold text-pink-700 mt-1">{children}</h4>
                          ),
                          ul: ({ node, children }) => (
                            <ul className="list-disc pl-3 space-y-0.5 my-1">{children}</ul>
                          ),
                          ol: ({ node, children }) => (
                            <ol className="list-decimal pl-3 space-y-0.5 my-1">{children}</ol>
                          ),
                          p: ({ node, children }) => (
                            <p className="mb-1 last:mb-0">{children}</p>
                          )
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{m.text}</span>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-400 italic text-xs">Thinking...</div>}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about skin type, products..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="bg-black text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}