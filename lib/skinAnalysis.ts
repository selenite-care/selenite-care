import OpenAI from "openai";

type SkinAnalysisResult = {
  skinType: string;
  concerns: string[];
  fullAnalysis: string;
  summary: string;
  consultationNote: string;
};

let openAIClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  openAIClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return openAIClient;
}

function parseSkinAnalysisResponse(content: string | null): SkinAnalysisResult {
  if (!content) {
    throw new Error("Skin analysis returned an empty response.");
  }

  try {
    const parsed = JSON.parse(content) as Partial<SkinAnalysisResult>;

    if (
      typeof parsed.skinType !== "string" ||
      !Array.isArray(parsed.concerns) ||
      !parsed.concerns.every((concern) => typeof concern === "string") ||
      typeof parsed.fullAnalysis !== "string" ||
      typeof parsed.summary !== "string" ||
      typeof parsed.consultationNote !== "string"
    ) {
      throw new Error("Response JSON did not match the expected skin analysis format.");
    }

    return {
      skinType: parsed.skinType,
      concerns: parsed.concerns,
      fullAnalysis: parsed.fullAnalysis,
      summary: parsed.summary,
      consultationNote: parsed.consultationNote,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Unable to parse skin analysis JSON response from OpenAI.");
    }

    throw error;
  }
}

export async function analyzeSkinImages(
  imageDataArray: Array<{
    base64: string;
    mimeType: string;
    label: string;
  }>,
): Promise<SkinAnalysisResult> {
  if (imageDataArray.length < 1 || imageDataArray.length > 3) {
    throw new Error("Skin analysis requires between 1 and 3 images.");
  }

  if (
    imageDataArray.some(
      ({ base64, mimeType, label }) =>
        !base64.trim() || !mimeType.trim() || !label.trim(),
    )
  ) {
    throw new Error(
      "Each skin image must include image data, a MIME type, and a label.",
    );
  }

  const userContent = [
    {
      type: "text" as const,
      text: "Please analyze these skin photos accurately as one comprehensive assessment.",
    },
    ...imageDataArray.flatMap(({ base64, mimeType, label }) => [
      {
        type: "text" as const,
        text: label,
      },
      {
        type: "image_url" as const,
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
        },
      },
    ]),
  ];

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            'You are a certified skincare expert AI for Selenite Care, a professional skincare consultation platform in Bangladesh. You will receive 1-3 skin photos from different angles of the same person. Analyze all provided angles together to give a comprehensive assessment. Analyze the skin photos accurately and professionally. STRICT RULES: 1) Do NOT recommend any specific products or brands. 2) Do NOT suggest medications or treatments. 3) DO accurately identify skin type and concerns. 4) DO encourage professional consultation with Selenite Care aestheticians. 5) Be compassionate and professional. Respond ONLY in this exact JSON format with no extra text: { "skinType": "one of: Oily, Dry, Combination, Normal, Sensitive", "concerns": ["array of identified skin concerns"], "fullAnalysis": "3-4 paragraph professional skin assessment describing what you observe", "summary": "1-2 sentence overview", "consultationNote": "A warm personalized note encouraging the client to book a consultation with Selenite Care certified aestheticians for proper treatment and product recommendations" }',
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    return parseSkinAnalysisResponse(response.choices[0]?.message.content ?? null);
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(
        `OpenAI skin analysis failed: ${error.message || "API request failed."}`,
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("OpenAI skin analysis failed due to an unknown error.");
  }
}
