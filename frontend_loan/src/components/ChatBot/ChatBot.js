import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import useSpeechRecognition from './useSpeechRecognition';
import useSpeechSynthesis from './useSpeechSynthesis';
import './ChatBot.css';

const ChatBot = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language || 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { isListening, transcript, isSupported, startListening, stopListening, setTranscript } =
    useSpeechRecognition(lang);
  const { speak, stop: stopSpeaking } = useSpeechSynthesis(lang);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'bot', text: t('chatbot.welcome'), timestamp: new Date() }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update welcome message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'bot') {
      setMessages([{ role: 'bot', text: t('chatbot.welcome'), timestamp: new Date() }]);
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle speech transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      setTranscript('');
      // Automatically send voice input
      handleSend(transcript);
    }
  }, [transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const getAuthToken = () => {
    // Try both farmer and admin tokens
    return localStorage.getItem('token') || localStorage.getItem('adminToken') || '';
  };

  const handleSend = useCallback(
    async (textOverride) => {
      const text = (textOverride || input).trim();
      if (!text || isLoading) return;

      // Add user message
      setMessages((prev) => [...prev, { role: 'user', text, timestamp: new Date() }]);
      setInput('');
      setIsLoading(true);

      try {
        const token = getAuthToken();
        const res = await fetch('http://localhost:5001/api/chatbot/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text,
            language: lang,
            currentPage: location.pathname,
          }),
        });

        const data = await res.json();
        const botReply = data.response || t('chatbot.error');

        setMessages((prev) => [...prev, { role: 'bot', text: botReply, timestamp: new Date() }]);

        // Auto-speak bot response for voice inputs
        if (textOverride && isSupported) {
          setTimeout(() => speak(botReply), 300);
        }
      } catch (err) {
        console.error('Chatbot error:', err);
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: t('chatbot.error'), timestamp: new Date() },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, lang, location.pathname, t, speak, isSupported]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button className="chatbot-fab" onClick={handleOpen} id="chatbot-fab" title={t('chatbot.title')}>
          🌾
          {hasNewMessage && <span className="badge" />}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window" id="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">🌾</div>
              <div className="chatbot-header-info">
                <h3>{t('chatbot.title')}</h3>
                <p>● Online</p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => { setIsOpen(false); stopSpeaking(); }} id="chatbot-close">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" id="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="chat-msg-avatar">{msg.role === 'bot' ? '🌾' : '👤'}</div>
                <div>
                  <div className="chat-bubble">{msg.text}</div>
                  {msg.role === 'bot' && (
                    <button
                      className="chat-voice-btn"
                      onClick={() => speak(msg.text)}
                      title="🔊 Listen"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-message bot">
                <div className="chat-msg-avatar">🌾</div>
                <div className="chat-bubble">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Listening indicator */}
          {isListening && (
            <div className="chatbot-listening-bar">
              🎤 {t('chatbot.listening')}
            </div>
          )}

          {/* Input Area */}
          <div className="chatbot-input-area">
            <button
              className={`chatbot-mic-btn ${isListening ? 'recording' : 'idle'}`}
              onClick={toggleMic}
              title={isSupported ? t('chatbot.mic_tooltip') : t('chatbot.error_mic')}
              disabled={!isSupported}
              id="chatbot-mic-btn"
            >
              🎤
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chatbot.placeholder')}
              disabled={isLoading}
              id="chatbot-input"
            />
            <button
              className="chatbot-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              id="chatbot-send-btn"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
