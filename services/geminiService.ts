import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using a flash model for speed on simple tasks
const MODEL_ID = 'gemini-3-flash-preview';

export const geminiService = {
  /**
   * Breaks down a complex task into smaller subtasks using Gemini.
   */
  async breakDownTask(taskTitle: string): Promise<string[]> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Break down the following task into 3 to 5 actionable subtasks. Task: "${taskTitle}". Return only the subtask titles.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text) as string[];
    } catch (error) {
      console.error("Gemini breakdown error:", error);
      return [];
    }
  },

  /**
   * Analyzes tasks and suggests priorities.
   */
  async prioritizeTasks(tasks: Task[]): Promise<Array<{ id: string, priority: Priority, reasoning: string }>> {
    if (tasks.length === 0) return [];

    const taskSimplification = tasks.map(t => ({ id: t.id, title: t.title }));

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Analyze these tasks and assign a priority (High, Medium, Low) to each based on urgency or importance implied by the title. Provide a very short reasoning. Tasks: ${JSON.stringify(taskSimplification)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                reasoning: { type: Type.STRING }
              },
              required: ['id', 'priority', 'reasoning']
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      
      const result = JSON.parse(text);
      // Map string back to Enum
      return result.map((r: any) => ({
        ...r,
        priority: r.priority as Priority
      }));

    } catch (error) {
      console.error("Gemini prioritize error:", error);
      return [];
    }
  }
};
