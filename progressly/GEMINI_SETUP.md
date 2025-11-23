# Gemini 2.5 Flash Integration Guide

## Environment Setup

Add the following to your `.env.local` file:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create a new API key or use an existing one
4. Copy the API key and add it to your `.env.local` file

## Model Information

- **Model**: `gemini-2.5-flash`
- **Pricing**: Most cost-effective option
- **Features**: Fast responses, streaming support, context-aware conversations

## Implementation

The chat interface has been updated to use Gemini 2.5 Flash through the backend API endpoint at `/api/chat`.

The backend handles:
- Authentication via Supabase tokens
- Conversation history management
- Streaming responses from Gemini
- Error handling and rate limiting

## Testing

1. Add your Gemini API key to `.env.local`
2. Restart your development server
3. Navigate to the chat page
4. Start a conversation with Progresso, your AI Coach

## Notes

- The API key is server-side only and never exposed to the client
- Conversations are stored in your Supabase database
- The AI has context about your progress and activities
