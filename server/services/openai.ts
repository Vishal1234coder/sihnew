import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface AIAssistantRequest {
  message: string;
  language?: string;
  patientContext?: {
    medicines?: string[];
    medicalHistory?: string[];
    allergies?: string[];
  };
}

export interface AIAssistantResponse {
  response: string;
  language: string;
  category: string;
  sentiment?: string;
  confidence: number;
}

export async function getAIResponse(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  const { message, language = "en", patientContext } = request;

  const systemPrompt = `You are a helpful medical AI assistant for a medicine reminder system. 
You can communicate in both English and Hindi. 
You help patients with:
- Medicine timing questions
- Side effects information  
- Dosage clarifications
- General health guidance

Patient context: ${JSON.stringify(patientContext || {})}

Guidelines:
- Be empathetic and supportive
- For serious symptoms, always recommend consulting a doctor
- Provide clear, actionable advice
- Use the patient's preferred language
- Keep responses concise but helpful

Respond with JSON in this format:
{
  "response": "your helpful response",
  "language": "detected/preferred language (en/hi)",
  "category": "medicine_timing|side_effects|dosage|general|emergency",
  "sentiment": "positive|neutral|concerned|urgent",
  "confidence": number between 0 and 1
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      response: result.response || "I'm sorry, I couldn't understand your question. Please try asking again.",
      language: result.language || language,
      category: result.category || "general",
      sentiment: result.sentiment || "neutral",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8))
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response
    return {
      response: language === "hi" 
        ? "मुझे खुशी होगी आपकी मदद करने में। कृपया अपना सवाल फिर से पूछें।"
        : "I'd be happy to help you. Please ask your question again.",
      language: language,
      category: "general",
      sentiment: "neutral",
      confidence: 0.5
    };
  }
}

export async function categorizePatientQuery(message: string): Promise<{
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  keywords: string[];
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Analyze the patient message and categorize it. 
          Respond with JSON:
          {
            "category": "medicine_timing|side_effects|dosage|emergency|general",
            "priority": "low|medium|high|urgent",
            "keywords": ["relevant", "medical", "keywords"]
          }`
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error categorizing query:", error);
    return {
      category: "general",
      priority: "medium",
      keywords: []
    };
  }
}
