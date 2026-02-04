import { GoogleGenAI } from "@google/genai";
import { FleetStats } from "../types";

// Helper to format stats for the prompt
const formatStatsForPrompt = (stats: FleetStats) => {
  return `
    Total Vehicles: ${stats.onlineCount + stats.offlineCount + stats.idleCount}
    Online: ${stats.onlineCount}
    Offline: ${stats.offlineCount}
    Idle: ${stats.idleCount}
    Total CO2 Saved: ${stats.totalCo2Saved.toLocaleString()} kg
    Total Distance: ${stats.totalKm.toLocaleString()} km
    Active Subscriptions: ${stats.activeSubscriptions}
    Inactive Subscriptions: ${stats.inactiveSubscriptions}
  `;
};

export const getFleetInsight = async (stats: FleetStats): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Gemini API Key is missing. Please configure the environment to receive AI insights.";
  }

  try {
    // Initialize GoogleGenAI with the API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are an expert Fleet Manager AI assistant for an Electric Vehicle monitoring platform.
      Analyze the following current fleet statistics and provide a concise, 2-sentence operational insight or recommendation.
      Focus on efficiency, utilization, or environmental impact.
      
      Current Fleet Stats:
      ${formatStatsForPrompt(stats)}
    `;

    // Use gemini-3-flash-preview for basic text tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access .text property directly from the response object
    return response.text || "Unable to generate insight at this time.";
  } catch (error) {
    console.error("Error fetching fleet insight:", error);
    return "Error connecting to AI service. Please try again later.";
  }
};
