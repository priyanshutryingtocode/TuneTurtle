import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';

export default function FloatingChatAssistant({ lyrics, track }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef(null);

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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            
            const response = await axios.post(`${API_URL}/api/chat`, {
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

    return createPortal(
        <div className="chat-assistant-wrapper">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="chat-window glass-panel"
                    >
                        <div className="chat-header">
                            <div className="chat-title">
                                <Bot className="bot-icon" size={20} />
                                <h3>Ask the Track</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="close-btn">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="chat-messages">
                            {messages.length === 0 && (
                                <p className="chat-empty-text">
                                    I have the lyrics to "{track?.song}" loaded. What would you like to know about its meaning or themes?
                                </p>
                            )}
                            
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`chat-message-row ${msg.role === 'user' ? 'user-row' : 'bot-row'}`}>
                                    <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="chat-loading">
                                    <span></span><span></span><span></span>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-input-area">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message TuneTurtle..."
                                className="chat-input"
                            />
                            <button type="submit" disabled={isLoading || !input.trim()} className="chat-send-btn">
                                <Send size={16} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="chat-fab"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </motion.button>
        </div>,
        document.body
    );
}