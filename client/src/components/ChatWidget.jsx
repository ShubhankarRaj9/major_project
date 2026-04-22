import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots, FaSpinner } from 'react-icons/fa'
import './ChatWidget.css'

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [threadId, setThreadId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

    const initializeChat = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_URL}/api/chat/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'anonymous' }),
            })

            if (!response.ok) throw new Error('Failed to start chat')

            const data = await response.json()
            setThreadId(data.threadId)

            // Initial greeting
            setMessages([
                {
                    id: '1',
                    text: '👋 Welcome to the Options Trading Chatbot! I can help you with:\n\n📚 Options strategies (Straddles, Spreads, Iron Condors)\n📊 Greeks analysis (Delta, Gamma, Theta, Vega)\n🎯 Trade recommendations\n⚠️ Risk management tips\n\nWhat would you like to know about options trading?',
                    isAgent: true,
                    timestamp: new Date(),
                },
            ])
        } catch (err) {
            console.error('Chat initialization error:', err)
            setError('Failed to initialize chat')
        } finally {
            setLoading(false)
        }
    }, [API_URL])

    // Initialize chat on open
    useEffect(() => {
        if (isOpen && !threadId) {
            initializeChat()
        }
    }, [isOpen, threadId, initializeChat])

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
        }
    }, [isOpen])

    const handleSendMessage = async (e) => {
        e.preventDefault()

        if (!inputValue.trim() || !threadId || loading) return

        const userMessage = inputValue.trim()
        setInputValue('')
        setError(null)

        // Add user message to UI immediately
        const userMsg = {
            id: Date.now().toString(),
            text: userMessage,
            isAgent: false,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg])

        try {
            setLoading(true)

            const response = await fetch(`${API_URL}/api/chat/${threadId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to send message')
            }

            const data = await response.json()

            // Add AI response
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                text: data.assistantResponse,
                isAgent: true,
                timestamp: new Date(data.timestamp),
            }

            setMessages(prev => [...prev, aiMsg])
        } catch (err) {
            console.error('Send message error:', err)
            setError(err.message || 'Failed to send message')

            // Add error message
            const errorMsg = {
                id: (Date.now() + 2).toString(),
                text: `❌ Error: ${err.message || 'Something went wrong'}`,
                isAgent: true,
                timestamp: new Date(),
            }

            setMessages(prev => [...prev, errorMsg])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleClearChat = async () => {
        if (!threadId || !window.confirm('Clear all messages?')) return

        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_URL}/api/chat/${threadId}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to clear chat')

            // Reset chat
            setMessages([])
            setThreadId(null)
            initializeChat()
        } catch (err) {
            console.error('Clear chat error:', err)
            setError('Failed to clear chat')
        } finally {
            setLoading(false)
        }
    }

    const toggleChat = () => {
        setIsOpen(!isOpen)
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    return (
        <div className="chat-widget-container">
            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="header-content">
                            <FaRobot className="header-icon" />
                            <div className="header-text">
                                <h3>Options Trading Bot</h3>
                                <p>Powered by AI</p>
                            </div>
                        </div>
                        <button
                            className="close-btn"
                            onClick={toggleChat}
                            aria-label="Close chat"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-banner">
                            <span>{error}</span>
                            <button onClick={() => setError(null)}>✕</button>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className="messages-container">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`message ${msg.isAgent ? 'agent' : 'user'}`}
                            >
                                {msg.isAgent && <FaRobot className="message-icon" />}
                                <div className="message-content">
                                    <div className="message-text">
                                        {msg.text.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                <br />
                                            </span>
                                        ))}
                                    </div>
                                    <small className="message-time">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </small>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="message agent">
                                <FaRobot className="message-icon" />
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="chat-form">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ask about options strategies, Greeks, or get trade ideas..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={loading}
                            className="chat-input"
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                            className="send-btn"
                            aria-label="Send message"
                        >
                            {loading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                        </button>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearChat}
                                disabled={loading}
                                className="clear-btn"
                                title="Clear chat"
                            >
                                🗑️
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Chat Toggle Button */}
            <button
                className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={toggleChat}
                aria-label="Toggle chat"
            >
                {isOpen ? <FaTimes /> : <FaCommentDots />}
            </button>
        </div>
    )
}

export default ChatWidget

// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots, FaSpinner } from 'react-icons/fa'
// import './ChatWidget.css'

// const ChatWidget = () => {
//     const [isOpen, setIsOpen] = useState(false)
//     const [messages, setMessages] = useState([])
//     const [inputValue, setInputValue] = useState('')
//     const [threadId, setThreadId] = useState(null)
//     const [loading, setLoading] = useState(false)
//     const [error, setError] = useState(null)

//     const messagesEndRef = useRef(null)
//     const inputRef = useRef(null)

//     const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080'

//     // ✅ ONLY ONE initializeChat (fixed)
//     const initializeChat = useCallback(async () => {
//         try {
//             setLoading(true)
//             setError(null)

//             const response = await fetch(`${API_URL}/api/chat/start`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ userId: 'anonymous' }),
//             })

//             if (!response.ok) throw new Error('Failed to start chat')

//             const data = await response.json()
//             setThreadId(data.threadId)

//             setMessages([
//                 {
//                     id: '1',
//                     text: '👋 Welcome to the Options Trading Chatbot!\n\n📚 Strategies\n📊 Greeks\n🎯 Trade ideas\n⚠️ Risk management\n\nAsk anything!',
//                     isAgent: true,
//                     timestamp: new Date(),
//                 },
//             ])
//         } catch (err) {
//             console.error(err)
//             setError('Failed to initialize chat')
//         } finally {
//             setLoading(false)
//         }
//     }, [API_URL])

//     useEffect(() => {
//         if (isOpen && !threadId) {
//             initializeChat()
//         }
//     }, [isOpen, threadId, initializeChat])

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, [messages])

//     useEffect(() => {
//         if (isOpen) inputRef.current?.focus()
//     }, [isOpen])

//     const handleSendMessage = async (e) => {
//         e.preventDefault()
//  console.log("SEND CLICKED") 
//         if (!inputValue.trim() || !threadId || loading) return

//         const userMessage = inputValue.trim()
//         setInputValue('')
//         setError(null)

//         setMessages(prev => [
//             ...prev,
//             {
//                 id: Date.now().toString(),
//                 text: userMessage,
//                 isAgent: false,
//                 timestamp: new Date(),
//             },
//         ])

//         try {
//             setLoading(true)

//             const response = await fetch(`${API_URL}/api/chat/${threadId}/message`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ message: userMessage }),
//             })

//             if (!response.ok) throw new Error('Failed to send message')

//             const data = await response.json()

//             setMessages(prev => [
//                 ...prev,
//                 {
//                     id: (Date.now() + 1).toString(),
//                     text: data.assistantResponse,
//                     isAgent: true,
//                     timestamp: new Date(),
//                 },
//             ])
//         } catch (err) {
//             setError(err.message)

//             setMessages(prev => [
//                 ...prev,
//                 {
//                     id: (Date.now() + 2).toString(),
//                     text: `❌ ${err.message}`,
//                     isAgent: true,
//                     timestamp: new Date(),
//                 },
//             ])
//         } finally {
//             setLoading(false)
//         }
//     }

//     const toggleChat = () => setIsOpen(!isOpen)

//     return (
//         <div className="chat-widget-container">
//             {isOpen && (
//                 <div className="chat-window">

//                     <div className="chat-header">
//                         <FaRobot />
//                         <h3>Trading Bot</h3>
//                         <button onClick={toggleChat}><FaTimes /></button>
//                     </div>

//                     {error && <div className="error">{error}</div>}

//                     <div className="messages">
//                         {messages.map(msg => (
//                             <div key={msg.id} className={msg.isAgent ? 'agent' : 'user'}>
//                                 {msg.text}
//                             </div>
//                         ))}
//                         {loading && <div>Typing...</div>}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     <form onSubmit={handleSendMessage}>
//                         <input
//                             ref={inputRef}
//                             value={inputValue}
//                             onChange={(e) => setInputValue(e.target.value)}
//                         />
//                         <button type="submit">
//                             {loading ? <FaSpinner /> : <FaPaperPlane />}
//                         </button>
//                     </form>
//                 </div>
//             )}

//             <button onClick={toggleChat}>
//                 {isOpen ? <FaTimes /> : <FaCommentDots />}
//             </button>
//         </div>
//     )
// }

// export default ChatWidget;