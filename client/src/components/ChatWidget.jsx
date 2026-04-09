import React, { useState, useEffect, useRef } from 'react'
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [threadId, setThreadId] = useState(null)
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          text: "Hello! I'm your trading assistant. How can I help you today?",
          isAgent: true
        }
      ])
    }
  }, [isOpen, messages.length])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    const userMessage = inputValue   // ✅ FIXED

    const message = {
      text: userMessage,
      isAgent: false,
    }

    setMessages(prev => [...prev, message])
    setInputValue("")
    setLoading(true)

    const endpoint = threadId
      ? `http://localhost:8080/chat/${threadId}`
      : 'http://localhost:8080/chat'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage   // ✅ FIXED
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const agentResponse = {
        text: data.response,
        isAgent: true,
      }

      setMessages(prev => [...prev, agentResponse])

      // ✅ FIXED threadId bug
      if (data.threadId) {
        setThreadId(data.threadId)
      }

    } catch (error) {
      console.error('Error:', error)

      // Show error message in UI
      setMessages(prev => [
        ...prev,
        { text: "⚠️ Error connecting to server", isAgent: true }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`chat-widget-container ${isOpen ? 'open' : ''}`}>

      {isOpen ? (
        <>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-title">
              <FaRobot />
              <h3>Trading Assistant</h3>
            </div>
            <button className="close-button" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index}>
                <div className={`message ${message.isAgent ? 'message-bot' : 'message-user'}`}>
                  {message.text}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="message message-bot">
                Typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="message-input"
              placeholder="Ask about CALL/PUT..."
              value={inputValue}
              onChange={handleInputChange}
            />
            <button
              type="submit"
              className="send-button"
              disabled={inputValue.trim() === '' || loading}
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </>
      ) : (
        <button className="chat-button" onClick={toggleChat}>
          <FaCommentDots />
        </button>
      )}
    </div>
  )
}

export default ChatWidget