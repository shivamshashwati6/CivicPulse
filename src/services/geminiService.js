import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabaseClient';

/**
 * Extracts base64 image data from either a File object or image URL
 * @param {File|string|Object} imageSource
 * @returns {Promise<{mimeType: string, base64Data: string}>}
 */
async function getImageBase64(imageSource) {
  let fileObj = null;
  let urlStr = null;

  if (imageSource instanceof File || imageSource instanceof Blob) {
    fileObj = imageSource;
  } else if (typeof imageSource === 'string') {
    urlStr = imageSource;
  } else if (imageSource && typeof imageSource === 'object') {
    fileObj = imageSource.imageFile || imageSource.file || null;
    urlStr = imageSource.imageUrl || imageSource.url || null;
  }

  // 1. If File object is provided, read directly via FileReader (fast, 100% resilient, offline ready)
  if (fileObj) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const mimeType = fileObj.type || 'image/jpeg';
          const base64Data = result.split(',')[1] || result;
          resolve({ mimeType, base64Data });
        } else {
          reject(new Error('FileReader failed to convert image file to base64.'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileObj);
    });
  }

  // 2. If URL string is provided, fetch image blob and convert to base64
  if (urlStr) {
    const response = await fetch(urlStr);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL (${response.status}): ${response.statusText}`);
    }
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64Data = result.split(',')[1] || result;
          resolve({ mimeType, base64Data });
        } else {
          reject(new Error('Failed to convert image blob to base64.'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  throw new Error('No valid image file or image URL provided for AI analysis.');
}

/**
 * Analyzes a complaint image using Google Gemini 2.5 Flash Vision API.
 * @param {File|string|Object} imageInput - File object, URL string, or { imageFile, imageUrl }
 * @returns {Promise<{category: string, severity: string, priority: string, summary: string, confidence: number}>}
 */
export async function analyzeComplaintImage(imageInput) {
  if (!imageInput) {
    throw new Error('Image input is required for AI analysis.');
  }

  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY environment variable is missing.');
  }

  // Step 1: Extract base64 image data
  const { mimeType, base64Data } = await getImageBase64(imageInput);

  // Step 2: System prompt for strict JSON response
  const prompt = `Analyze ONLY the provided image.
Classify and evaluate the visual content of the civic or municipal complaint image.

Return ONLY valid JSON matching this exact structure:
{
  "category": "Pothole" | "Garbage" | "Water Leakage" | "Street Light" | "Road Damage" | "Drainage" | "Traffic Signal" | "Other",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "priority": "Low" | "Medium" | "High",
  "summary": "Maximum 40 words summary of what is visible in the photo",
  "confidence": 0-100 integer
}`;

  let responseText = '';
  let lastError = null;

  // Try 1: Call using official @google/genai SDK
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
    responseText = response.text || '';
  } catch (sdkErr) {
    console.warn('@google/genai SDK call notice, attempting REST fallback:', sdkErr.message);
    lastError = sdkErr;
  }

  // Try 2: REST fallback if SDK call did not yield output
  if (!responseText) {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (responseText) break;
        } else {
          const errBody = await res.text();
          lastError = new Error(`REST ${model} (${res.status}): ${errBody}`);
        }
      } catch (restErr) {
        lastError = restErr;
      }
    }
  }

  if (!responseText) {
    throw lastError || new Error('Received empty response from Gemini Vision AI.');
  }

  // Step 3: Clean potential markdown code block formatting
  let cleanJson = responseText.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Step 4: Parse JSON safely
  const parsed = JSON.parse(cleanJson);

  return {
    category: parsed.category || 'Other',
    severity: parsed.severity || 'Medium',
    priority: parsed.priority || 'Medium',
    summary: parsed.summary || 'Image analyzed by Gemini Vision AI.',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  };
}

/**
 * Service object for complaint workflow integration and Supabase DB updating
 */
export const geminiService = {
  analyzeComplaintImage,

  processAndSaveAiAnalysis: async (complaintId, imageSource) => {
    try {
      const aiResult = await analyzeComplaintImage(imageSource);

      const updateData = {
        ai_category: aiResult.category,
        ai_severity: aiResult.severity,
        ai_priority: aiResult.priority,
        ai_summary: aiResult.summary,
        ai_confidence: aiResult.confidence,
        ai_processed_at: new Date().toISOString(),
      };

      if (complaintId) {
        const { error } = await supabase
          .from('complaints')
          .update(updateData)
          .eq('id', complaintId);

        if (error) {
          console.warn('Supabase DB update for AI analysis warning:', error.message);
        }
      }

      return { success: true, data: updateData };
    } catch (err) {
      console.error('Gemini Vision AI Analysis processing error:', err);

      const fallbackData = {
        ai_category: 'Unknown',
        ai_summary: 'AI Analysis Failed',
        ai_processed_at: new Date().toISOString(),
      };

      if (complaintId) {
        try {
          await supabase
            .from('complaints')
            .update(fallbackData)
            .eq('id', complaintId);
        } catch (dbErr) {
          console.warn('Failed to write AI error fallback to database:', dbErr);
        }
      }

      return { success: false, error: err.message, data: fallbackData };
    }
  },
};
