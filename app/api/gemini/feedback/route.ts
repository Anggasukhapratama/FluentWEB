import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { questions, transcripts, language, jobPosition } = await req.json();
    if (!questions || !transcripts || !language || !jobPosition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const feedback = await generateFeedback(questions, transcripts, language, jobPosition);
    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("Gemini feedback error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate feedback" }, { status: 500 });
  }
}
