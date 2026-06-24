import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';

export default function FloatingChatAssistant({ lyrics, track }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

    // Auto-scroll to the latest message when the chat updates
    useEffect(() => {
        if (isOpen) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:5000/api/chat", {
                message: input,
                history: messages,
                lyrics: lyrics,
                track: track
            });

            const botMsg = { role: "bot", text: response.data.text };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: "bot", text: "Connection error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-4 w-[380px] h-[550px] bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2">
                                <Bot className="text-indigo-400 w-5 h-5" />
                                <h3 className="text-white font-medium text-sm tracking-wide">Ask the Track</h3>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-zinc-400 hover:text-white transition-colors p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <p className="text-zinc-500 text-sm text-center mt-8 px-4">
                                    I have the lyrics to "{track?.song}" loaded. What would you like to know about its meaning or themes?
                                </p>
                            )}
                            
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`p-1.5 rounded-full h-7 w-7 flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-zinc-300'}`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600/20 text-indigo-100 rounded-tr-sm' : 'bg-white/5 text-zinc-300 rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex gap-2 p-2 px-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]"></span>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-white/5 border-t border-white/5 flex gap-2 items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message TuneTurtle..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-zinc-600"
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading || !input.trim()}
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-4 rounded-full bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-colors border border-indigo-400/30 flex items-center justify-center"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </motion.button>
        </div>
    );
}