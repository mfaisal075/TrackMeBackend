const aiService = require("../services/aiService");

/**
 * Helper to clean and parse JSON response from AI
 */
const parseAIResponse = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error("Empty or invalid response from AI");
  }

  try {
    // Find the first '{' and the last '}' to extract the JSON object
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      // If no JSON markers, maybe it's a plain string we can try to wrap or handle
      console.warn("No JSON object markers found in AI response. Raw text:", text);
      throw new Error("No JSON object found in response");
    }
    
    const jsonString = text.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI JSON Parse Error:", error.message, "| Raw Text:", text);
    throw new Error("Failed to parse AI response: " + error.message);
  }
};

exports.suggestGoal = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Goal idea text is required",
      });
    }

    const prompt = `
      Provide a goal suggestion based on this idea: "${text}".
      Return the response STRICTLY as a JSON object with this structure:
      {
        "title": "suggested goal title",
        "frequency": "suggested frequency (e.g., Daily, Weekly)",
        "steps": ["step 1", "step 2", "step 3"]
      }
      Do not include any other text or explanation. Use only valid JSON.
    `;

    const resultText = await aiService.generateText(prompt);
    const data = parseAIResponse(resultText);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("AI Controller Error (suggestGoal):", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unable to generate AI response",
    });
  }
};

exports.generateInsight = async (req, res) => {
  try {
    const { progressData } = req.body;

    if (!progressData || !Array.isArray(progressData)) {
      return res.status(400).json({
        success: false,
        message: "Progress data array is required",
      });
    }

    const prompt = `
      Analyze the following progress data (dates and status):
      ${JSON.stringify(progressData)}
      
      Provide 2-3 short, simple, and readable insights about the consistency patterns.
      Return the response STRICTLY as a JSON object with this structure:
      {
        "insights": ["insight 1", "insight 2", "insight 3"]
      }
      Do not include any other text or explanation. Use only valid JSON.
    `;

    const resultText = await aiService.generateText(prompt);
    const data = parseAIResponse(resultText);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("AI Controller Error (generateInsight):", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unable to generate AI response",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
