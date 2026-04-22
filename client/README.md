# Frontend Setup

This is the React frontend for the Options Trading Chatbot.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

The app will open at `http://localhost:3000`

## Environment Variables

Create `.env.local`:
```
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
src/
  components/
    ChatWidget.jsx      - Main chat component
    ChatWidget.css      - Styling
  App.js               - Main app component
  App.css              - App styling
  index.js             - React entry point
  index.css            - Global styles
```

## Features

- 💬 Real-time chat with AI
- 🧠 Multi-turn conversations
- 📱 Responsive design
- ⚡ Fast & smooth interactions
- 🎨 Modern UI

## Troubleshooting

**Port 3000 already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**API connection errors:**
- Ensure backend is running on `http://localhost:8000`
- Check `REACT_APP_API_URL` in `.env.local`
- Check browser console for errors

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Advanced configuration (not reversible)
