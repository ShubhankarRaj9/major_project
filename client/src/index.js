import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ChatWidget from './components/ChatWidget'

// 👇 For HTML integration
window.renderChatWidget = function (containerId = "chat-widget-root") {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error("Chat widget container not found");
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(<ChatWidget />);
};
// 👇 For normal React app (don't remove this)
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}