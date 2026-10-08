import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { jobPosition, difficulty, language } = await req.json();
    if (!jobPosition || !difficulty || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const questions = await generateQuestions(jobPosition, difficulty, language);
    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Gemini questions error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate questions" }, { status: 500 });
  }
}
