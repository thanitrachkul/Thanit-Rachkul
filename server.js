/*
  A simple Express backend for forwarding chat requests to the Gemini API.

  This server exposes a single POST endpoint at `/api/chat`.  Clients
  should send a JSON payload with a `prompt` string and, optionally, an
  `image` object containing `mimeType` and base64‑encoded `data` fields.
  The server will determine whether to call the text or image models
  based on the presence of an image and whether the prompt appears to
  request image generation.  Responses from the Gemini API are
  simplified to include either a `text` field, an `imageUrl` field, or
  both plus any available citations.  Any errors are caught and
  returned with a generic error message so the front‑end can handle
  them gracefully.

  To run this locally:

    1. Install dependencies: npm install express cors @google/genai
    2. Set the GEMINI_API_KEY environment variable to your Gemini key.
    3. Start the server: node server.js

  When deploying to Cloud Run, Render or another hosting provider,
  ensure that GEMINI_API_KEY is configured as a secret environment
  variable.  If deploying to Vercel, consider moving this file into
  an `/api` directory and exporting a handler function rather than
  starting an HTTP listener directly.  Vercel will automatically
  handle routing for files in the `/api` folder.
*/

const express = require('express');
const cors = require('cors');
const { GoogleGenAI, Modality } = require('@google/genai');

const app = express();

// Increase the JSON body size limit to accommodate image uploads.
app.use(express.json({ limit: '10mb' }));
app.use(cors());

/**
 * POST /api/chat
 *
 * Expected payload:
 * {
 *   prompt: string,
 *   image?: { mimeType: string, data: string }
 * }
 */
app.post('/api/chat', async (req, res) => {
  const { prompt, image } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ text: 'Invalid prompt' });
  }

  // Instantiate the Gemini client.  The API key must be provided via
  // environment variable to avoid leaking secrets.  See the project
  // README for details on configuring secrets.
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ text: 'Server misconfiguration' });
  }
  const ai = new GoogleGenAI({ apiKey });

  // Define a consistent system instruction across all requests.  This
  // instructs the model to behave as a friendly Thai assistant named
  // "น้อง RightCode Buddy" and ensures safe, child‑friendly output.
  const safetyInstruction = {
    systemInstruction: 'You are "น้อง RightCode Buddy", a friendly and helpful AI assistant from Thailand. Your name is "น้อง RightCode Buddy". You must ALWAYS refer to yourself as "น้อง RightCode Buddy", not Gemini or any other AI model. You are capable of searching the web and generating images directly in this chat. Respond in Thai. Ensure all content is child‑friendly, avoiding any sensitive, violent, or adult topics.',
  };

  try {
    // If an image was provided, call the multimodal model.  The API
    // requires that the image be supplied in the `inlineData` field
    // alongside a text prompt.
    if (image && image.data && image.mimeType) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: image.mimeType, data: image.data } },
          ],
        },
        config: safetyInstruction,
      });
      return res.json({ text: response.text });
    }

    // If no image, determine whether the prompt requests image
    // generation based on common keywords.  Feel free to refine this
    // heuristic to suit your needs.
    const keywords = ['รูป', 'วาด', 'สร้างภาพ', 'image', 'draw', 'generate image'];
    const wantsImage = keywords.some((kw) => prompt.toLowerCase().includes(kw));

    if (wantsImage) {
      // Use the base model with an image response modality.  The "-image" variant
      // is not always available via the public API.  Specifying the response
      // modality instructs the model to return a generated image encoded in
      // base64 without exposing the API key to the client.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseModalities: [Modality.IMAGE],
          ...safetyInstruction,
        },
      });
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return res.json({ imageUrl: `data:${mimeType};base64,${base64Data}` });
      }
      return res.json({ text: 'ขออภัยค่ะ ไม่สามารถสร้างภาพได้ในขณะนี้' });
    }

    // Otherwise, call the text model with Google search tool enabled to
    // provide grounded answers where appropriate.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        ...safetyInstruction,
      },
    });
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.filter((chunk) => chunk.web)
      .map((chunk) => ({ title: chunk.web.title, uri: chunk.web.uri })) || [];
    return res.json({ text, sources });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ text: 'ขออภัยค่ะ เกิดข้อผิดพลาดบางอย่าง' });
  }
});

// If this file is executed directly, start the Express listener.  When
// deployed on Vercel or another serverless platform that expects a
// handler, the environment variable `VERCEL` will be set and the
// platform will handle routing automatically.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

module.exports = app;