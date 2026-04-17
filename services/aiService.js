const axios = require("axios");

const generateText = async (prompt) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in .env file");
    }
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey
      }
    });

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part && part.text) {
          return part.text;
        }
      }
    }
    
    const detailedError = {
      message: "Invalid response structure from Gemini API",
      data: response.data,
      status: response.status
    };
    console.error("Gemini API Unexpected Response:", JSON.stringify(detailedError, null, 2));
    throw new Error(JSON.stringify(detailedError));
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("Gemini API Error Detail:", JSON.stringify(errorData, null, 2));
    throw new Error(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
  }
};

module.exports = {
  generateText,
};
