/**
 * Netlify Serverless Function: Google Gemini AI Proxy
 * RoboPrompt - KKA Fase F (PPLG SMKN 1 Bawang)
 * 
 * Safely accesses GEMINI_API_KEY from Netlify Environment Variables.
 * Prevents exposing API keys in client-side code or public GitHub repositories.
 */

exports.handler = async function (event, context) {
  // CORS Headers for secure cross-origin interaction
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { role, task, context: promptContext, format, customApiKey } = data;

    // Use environment variable first, with fallback to customApiKey if provided by user in UI
    const apiKey = process.env.GEMINI_API_KEY || customApiKey;

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'MISSING_API_KEY',
          message: 'GEMINI_API_KEY belum terpasang di Environment Variables Netlify atau pengaturan aplikasi.'
        })
      };
    }

    const systemInstruction = `Kamu adalah Master Prompt Engineer profesional bidang Rekayasa Perangkat Lunak dan Kecerdasan Artifisial (Kurikulum Vokasi SMK KKA Fase F).
Tugasmu adalah menyatukan dan menyempurnakan input formula R-T-C-F (Role, Task, Context, Format) dari pengguna menjadi SATU TEKS PROMPT FINAL YANG BAIK, TERSTRUKTUR, DAN SIAP PAKAI SECARA LANGSUNG PADA MODEL AI.

ATURAN WAJIB & KETAT:
1. Tampilkan HANYA teks prompt final yang sudah jadi, sempurna, dan siap digunakan.
2. JANGAN sertakan evaluasi, analisis, salam, pembuka, atau penutup (misal: "Tentu, ini hasil...", "Berikut adalah prompt...", dsb).
3. JANGAN membuat heading evaluasi seperti "### 1. Evaluasi", "### 2. Formula", atau "### 3. Poin Peningkatan".
4. Prompt yang dihasilkan harus memadukan 4 pilar secara elegan:
   - Role: Menetapkan persona ahli yang berbobot.
   - Task: Instruksi tugas yang spesifik dan terukur.
   - Context: Batasan operasional, aturan kerja, dan pencegahan halusinasi.
   - Format: Struktur output yang jelas dan sistematis.`;

    const userPrompt = `Input formula R-T-C-F pengguna:
- Role (Peran): ${role || 'Spesialis Rekayasa Perangkat Lunak & AI'}
- Task (Tugas): ${task || 'Selesaikan implementasi solusi secara komprehensif'}
- Context (Konteks & Batasan): ${promptContext || 'Terapkan standar industri terbaik, clean code, dan mitigasi error'}
- Format (Format Luaran): ${format || 'Sajikan terstruktur, sistematis, dan terperinci'}

Susun menjadi SATU teks prompt final siap pakai sekarang:`;

    // Call Google Gemini REST API (v1beta)
    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
    let lastError = null;
    let resultText = '';
    let usedModel = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\n---\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || `HTTP status ${res.status}`);
        }

        const candidate = json.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          resultText = text;
          usedModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!resultText) {
      throw lastError || new Error('Tidak ada respon yang diterima dari Gemini API.');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        text: resultText,
        model: usedModel
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'SERVER_ERROR',
        message: err.message || 'Terjadi kesalahan saat menghubungi Gemini AI.'
      })
    };
  }
};
