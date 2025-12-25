# Preview

[https://advancetodolist-alpha.vercel.app]

# Gemini API React Starter

This project is a lightweight React application demonstrating how to integrate the Google Gemini API using the `@google/genai` SDK.

## Features

-   **React & TypeScript Setup**: A simple, single-file React component structure.
-   **Gemini API Integration**: Demonstrates how to initialize the client and generate text content.
-   **Error Handling**: Basic error management for API requests.

## How It Works

### 1. Initialization

The application initializes the Google GenAI client using the API key provided in the environment variables.

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

### 2. Generating Content

The app uses the `generateContent` method to send prompts to the model.

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: prompt,
});

console.log(response.text);
```

## Models Used

-   **gemini-3-flash-preview**: Used for fast, general-purpose text generation.

## Environment Variables

This application relies on the `process.env.API_KEY` variable being set with a valid Google GenAI API key.
