const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const extractBillData = async (imagePath, mimeType) => {
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
                    data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
                    mimeType: mimeType
                }
            }
        ]
    });

    const text = response.text;
    let cleanedText = text.replace(/```json\n/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw new Error('Failed to process image with AI');
  }
};

module.exports = { extractBillData };
