import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    const {
      message,
      history = [],
      scenario = "IT Job Interview (Amaravati / Vizag)",
      nativeLang = "Telugu"
    } = await req.json();

    const systemPrompt = `You are "Kavya", a warm, encouraging bilingual Spoken English Coach for learners in Andhra Pradesh, India.
Current Practice Scenario: ${scenario}
Learner's Native Language: ${nativeLang}

Your job:
1. Reply naturally in simple, clear conversational English (1-2 sentences) to keep the conversation or roleplay moving forward.
2. Check the user's English sentence for grammar, tense, preposition, or phrasing mistakes (especially common Telugu-to-English translation errors). If their English is already natural, praise them!
3. Provide a clear, friendly explanation in ${nativeLang} (using ${nativeLang} script mixed with simple English words) explaining the grammar rule or giving a helpful speaking tip for Andhra Pradesh students and job seekers.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages,
        temperature: 0.3,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tutor_feedback",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reply: { type: "string" },
                hasMistake: { type: "boolean" },
                correctedSentence: { type: "string" },
                nativeExplanation: { type: "string" }
              },
              required: ["reply", "hasMistake", "correctedSentence", "nativeExplanation"],
              additionalProperties: false
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Groq API Error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "Groq API request failed" },
        { status: response.status || 500 }
      );
    }

    const parsed = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Tutor API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}