# Vera

Your AI-powered meeting insights companion. A real-time desktop application built with Electron, React, and AI. Captures audio, transcribes using Whisper (local with API fallback), performs sentiment analysis, generates GPT-powered advice, and displays insights in an always-on-top window.

## Features

- 🎙️ **Real-time Audio Capture**: Records microphone input with automatic silence detection (30s threshold)
- 🤖 **AI-Powered Transcription**: Local Whisper model with OpenAI API fallback
- 😊 **Sentiment Analysis**: CardiffNLP sentiment classification (positive/negative/neutral)
- 💡 **GPT Advice**: Real-time actionable advice powered by GPT-4o-mini
- 📊 **Session Summaries**: Comprehensive summaries with key points and action items
- 💾 **SQLite Storage**: Searchable session history
- 🪟 **Dynamic Window**: 460x460px compact view → half-screen summary view

## Prerequisites

### Required System Dependencies

**macOS:**
```bash
brew install portaudio sox
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install portaudio19-dev sox
```

**Windows:**
- Install SoX from https://sourceforge.net/projects/sox/

### Required Software
- Node.js v20+ (recommended: use nvm)
- npm or yarn

## Setup

1. **Navigate to the project directory and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

3. **Start the development server:**
```bash
npm start
```

The app will launch with a small floating window in the top-right corner.

## Usage

### Starting a Session
1. Click "Start Recording" in the compact window
2. Speak naturally - the app captures audio continuously
3. Real-time insights appear as you speak with sentiment-colored borders:
   - 🟢 Green = Positive
   - 🔴 Red = Negative
   - ⚫ Gray = Neutral

### Ending a Session
- **Manual**: Click "Stop Session"
- **Automatic**: 30 seconds of silence triggers auto-stop

### Viewing Summary
After stopping, the window automatically resizes to half-screen showing:
- Overall summary
- Key points
- Action items
- Full transcript

### Starting a New Session
Click "Start New Session" from the summary view to begin recording again.

## Architecture

### Main Process (`src/main/`)
- `index.ts` - App initialization and service orchestration
- `window.ts` - Window management (compact ↔ summary views)
- `audio-capture.ts` - Microphone input with silence detection
- `transcription.ts` - Whisper transcription (local + API fallback)
- `sentiment.ts` - CardiffNLP sentiment analysis
- `gpt-advice.ts` - OpenAI GPT integration
- `database.ts` - SQLite session storage
- `ipc-handlers.ts` - IPC communication bridge

### Renderer Process (`src/renderer/`)
- `App.tsx` - Main React component with state management
- `components/CompactView.tsx` - 460x460px real-time insights
- `components/SummaryView.tsx` - Half-screen summary display

### Security
- Context isolation enabled
- Node integration disabled
- Secure IPC bridge via preload script

## Building for Production

```bash
# Package the app
npm run package

# Create distributable
npm run make
```

Outputs will be in the `out/` directory.

## Development Tips

### First Run
On first run, the app downloads AI models (~100MB):
- Whisper Tiny English (~75MB)
- CardiffNLP Sentiment (~500MB)

Models are cached locally for subsequent runs.

### Debugging
- DevTools are disabled in production
- To enable: Comment out `mainWindow.webContents.openDevTools()` in `src/main/window.ts`

### Performance
- Local Whisper requires ~2-4 seconds per 5-second audio chunk
- API fallback is faster but requires internet and API credits
- Sentiment analysis is near-instant (~50ms)

## Troubleshooting

### "sox: command not found"
Install SoX (see Prerequisites)

### "OPENAI_API_KEY not set"
Copy `.env.example` to `.env` and add your API key

### No audio captured
Check system permissions:
- macOS: System Preferences → Security & Privacy → Microphone
- Linux: Check PulseAudio/ALSA configuration
- Windows: Settings → Privacy → Microphone

### Models not loading
Delete cache and restart:
```bash
rm -rf ~/.cache/huggingface
```

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI library
- **TypeScript** - Type safety
- **@xenova/transformers** - Local AI models (Whisper, CardiffNLP)
- **OpenAI API** - GPT-4o-mini for advice and summaries
- **better-sqlite3** - Fast, synchronous SQLite
- **Emotion** - CSS-in-JS styling
- **node-audiorecorder** - Audio capture

## Future Enhancements

- [ ] System audio capture (requires virtual audio drivers)
- [ ] Multi-language support (Whisper supports 99 languages)
- [ ] Export sessions as CSV/JSON/PDF
- [ ] Hotkey to start/stop recording
- [ ] System tray integration
- [ ] Custom silence threshold configuration
- [ ] GPU acceleration for Whisper

## License

MIT

## Credits

Built with Cursor AI IDE using thoughtful, minimal code practices.

