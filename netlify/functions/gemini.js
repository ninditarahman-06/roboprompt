/**
 * Netlify Serverless Function: Google Gemini AI Proxy
 * RoboPrompt - KKA Fase F
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
    const { action, category, role, task, context: promptContext, format, customApiKey } = data;

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

    const catName = category?.name || 'Umum';
    const catTools = category?.tools || 'AI Generatif';

    let systemInstruction = '';
    let userPrompt = '';

    if (action === 'optimize') {
      systemInstruction = `Kamu adalah Master Prompt Engineer profesional untuk Kurikulum Vokasi SMK Koding & Kecerdasan Artifisial (KKA) Fase F.
Tugasmu adalah menganalisis dan mengoptimalkan formula R-T-C-F (Role, Task, Context, Format) yang dirancang siswa untuk jenis AI: "${catName}" (Tools: ${catTools}).

Format jawaban WAJIB menggunakan struktur berikut secara teratur:
### 1. 🔍 Evaluasi Input Siswa
Ulas secara singkat kelengkapan pilar Role, Task, Context, dan Format dari input siswa.

### 2. ⚡ Formula Prompt Teroptimasi (Production-Grade)
Tuliskan prompt teroptimasi lengkap dan siap pakai yang memadukan keempat pilar secara presisi.

### 3. 🎯 Poin Peningkatan Teknis
Sebutkan 3 poin utama perbaikan teknis yang dilakukan (misal: pencegahan halusinasi, spesifikasi parameter, kata kerja operasional terukur).

Gunakan bahasa Indonesia yang jelas, edukatif, dan menyemangati siswa vokasi.`;

      userPrompt = `Berikut adalah input formula R-T-C-F siswa untuk kategori ${catName}:
- Role (Peran): ${role || '(belum diisi)'}
- Task (Tugas): ${task || '(belum diisi)'}
- Context (Konteks & Batasan): ${promptContext || '(belum diisi)'}
- Format (Bentuk Output): ${format || '(belum diisi)'}

Mohon optimalkan formula ini!`;
    } else {
      // Execute / Simulate action
      systemInstruction = `Kamu adalah mesin simulator cerdas untuk model AI Generatif ${catName} (${catTools}).
Jalankan instruksi berikut yang dirancang dengan formula R-T-C-F dan berikan luaran respons nyata yang mematuhi setiap batasan:
- Role: ${role || 'Asisten Ahli'}
- Task: ${task || 'Selesaikan tugas'}
- Context: ${promptContext || 'Standar industri'}
- Format: ${format || 'Terstruktur rapi'}`;

      userPrompt = `Jalankan tugas berikut sekarang dan tampilkan outputnya secara langsung.`;
    }

    // Call Google Gemini REST API (v1beta)
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
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

