const { GoogleGenAI } = require('@google/genai');
const { traceable } = require('langsmith/traceable');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const extractBillData = traceable(async (imageBuffer, mimeType) => {
  try {
    const prompt = `Analyze this uploaded bill image carefully and extract the total bill amount.
Return ONLY valid JSON in this structure:
{
  "vendor": "",
  "date": "",
  "category": "",
  "totalAmount": 0
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType
          }
        }
      ]
    });

    const text = response.text;
    let cleanedText = text.replace(/```json\n/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI Extraction Error:", error?.status, error?.message || error);
    if (error?.status === 429) {
      throw new Error('Gemini API Quota Exceeded. Please check your API key limits.');
    }
    if (error?.status === 403 || error?.status === 400) {
      throw new Error('Gemini API Error: ' + (error?.message || 'Invalid or Expired API Key.'));
    }
    throw new Error('Failed to process image with AI: ' + (error?.message || 'Unknown error'));
  }
}, { name: "extractBillData" });

module.exports = { extractBillData };
