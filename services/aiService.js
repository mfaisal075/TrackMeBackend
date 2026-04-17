const axios = require("axios");

const generateText = async (prompt) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const part = response.data.candidates[0].content.parts[0];
      if (part && part.text) {
        return part.text;
      }
    }
    
    console.error("Gemini API Unexpected Response:", JSON.stringify(response.data, null, 2));
    throw new Error("Invalid response structure from Gemini API");
  } catch (error) {
    const errorData = error.response?.data;
    console.error("Gemini API Error:", JSON.stringify(errorData || error.message, null, 2));
    throw new Error(errorData?.error?.message || error.message);
  }
};

module.exports = {
  generateText,
};
