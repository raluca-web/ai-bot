# DeepCharts Assistant

A simple AI chat interface for DeepCharts documentation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your OpenAI Assistant:
   - Create an Assistant in the [OpenAI Platform](https://platform.openai.com/assistants)
   - Upload your DeepCharts documentation files to the Assistant
   - Configure the Assistant with file search capability
   - Copy your API key and Assistant ID

3. Update `.env` file:
```
VITE_OPENAI_API_KEY=your-api-key-here
VITE_ASSISTANT_ID=your-assistant-id-here
```

4. Run the application:
```bash
npm run dev
```

## Usage

Simply ask questions about DeepCharts in the chat interface. The AI will respond based on the documentation you've uploaded to your OpenAI Assistant.
