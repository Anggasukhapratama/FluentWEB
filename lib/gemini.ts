import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side only — never expose this to client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate 5 interview questions
export async function generateQuestions(
  jobPosition: string,
  difficulty: "easy" | "medium" | "hard",
  language: "id" | "en"
): Promise<string[]> {
  const difficultyMap = {
    easy: language === "id" ? "mudah (perkenalan diri, motivasi, hobi)" : "easy (self-introduction, motivation, general background)",
    medium: language === "id" ? "sedang (situasional STAR method, kompetensi)" : "medium (situational STAR method, competency-based)",
    hard: language === "id" ? "sulit (case study, teknikal mendalam, behavioral kompleks)" : "hard (case study, deep technical, complex behavioral)",
  };

  const prompt = language === "id"
    ? `Buatkan tepat 5 pertanyaan wawancara kerja untuk posisi "${jobPosition}" dengan tingkat kesulitan ${difficultyMap[difficulty]}.
       
       Aturan:
       - Pertanyaan harus relevan dan realistis untuk posisi tersebut
       - Sesuai standar HR profesional Indonesia
       - Gunakan Bahasa Indonesia yang baik
       - Jangan tambahkan nomor atau bullet di awal pertanyaan
       
       Berikan response HANYA dalam format JSON array of strings seperti ini:
       ["pertanyaan 1", "pertanyaan 2", "pertanyaan 3", "pertanyaan 4", "pertanyaan 5"]`
    : `Generate exactly 5 job interview questions for the position of "${jobPosition}" with ${difficultyMap[difficulty]} difficulty.
       
       Rules:
       - Questions must be relevant and realistic for the position
       - Professional HR standard
       - Use clear English
       - Do not add numbers or bullets at the beginning
       
       Respond ONLY in JSON array format:
       ["question 1", "question 2", "question 3", "question 4", "question 5"]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid response format from Gemini");

  const questions = JSON.parse(match[0]) as string[];
  if (!Array.isArray(questions) || questions.length !== 5) {
    throw new Error("Gemini did not return exactly 5 questions");
  }

  return questions;
}

// Generate feedback for all answers
export async function generateFeedback(
  questions: string[],
  transcripts: string[],
  language: "id" | "en",
  jobPosition: string
): Promise<{
  feedbackPerQuestion: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    idealAnswer: string;
  }[];
  overallFeedback: string;
}> {
  const qaData = questions.map((q, i) => ({
    question: q,
    answer: transcripts[i] || "(Tidak dijawab)",
  }));

  const prompt = language === "id"
    ? `Kamu adalah HR profesional yang mengevaluasi sesi wawancara kerja untuk posisi "${jobPosition}".

Berikut adalah pertanyaan dan jawaban kandidat:
${qaData.map((qa, i) => `
Pertanyaan ${i + 1}: ${qa.question}
Jawaban: ${qa.answer}
`).join("\n")}

Berikan evaluasi dalam format JSON berikut:
{
  "feedbackPerQuestion": [
    {
      "strengths": ["kelebihan 1", "kelebihan 2"],
      "weaknesses": ["kekurangan 1", "kekurangan 2"],
      "suggestions": ["saran perbaikan 1", "saran perbaikan 2"],
      "idealAnswer": "contoh jawaban ideal yang singkat dan padat"
    }
  ],
  "overallFeedback": "feedback keseluruhan dalam 2-3 kalimat"
}

Berikan evaluasi yang konstruktif, spesifik, dan actionable. Gunakan Bahasa Indonesia.`
    : `You are a professional HR evaluating a job interview session for position "${jobPosition}".

Here are the questions and candidate's answers:
${qaData.map((qa, i) => `
Question ${i + 1}: ${qa.question}
Answer: ${qa.answer}
`).join("\n")}

Provide evaluation in this JSON format:
{
  "feedbackPerQuestion": [
    {
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "idealAnswer": "brief ideal answer example"
    }
  ],
  "overallFeedback": "overall feedback in 2-3 sentences"
}

Be constructive, specific, and actionable.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid feedback response from Gemini");

  return JSON.parse(match[0]);
}
