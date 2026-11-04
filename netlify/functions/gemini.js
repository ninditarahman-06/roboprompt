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
    'Access-Control-Allow-Headers': 'Content-Type, x-goog-api-key',
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
    const rawApiKey = process.env.GEMINI_API_KEY || customApiKey;
    const apiKey = rawApiKey ? rawApiKey.trim() : '';

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

    const systemInstruction = `Kamu adalah AI Master Prompt Engineer profesional di Kurikulum Vokasi SMK Koding & Kecerdasan Artifisial (PPLG SMKN 1 Bawang).
Tugas utamamu adalah: MENYEMPURNAKAN DAN MERANGKAI 4 pilar input siswa (Role, Task, Context, Format) menjadi SATU MASTER PROMPT R-T-C-F tingkat industri yang siap disalin oleh siswa untuk digunakan pada model AI lain.

PERINGATAN PALING KRUSIAL (DILARANG KERAS):
1. JANGAN PERNAH MENJAWAB, MEMBUATKAN KODE, ATAU MENGEKSEKUSI TUGAS DARI SISWA!
   - Contoh Salah: Jika siswa menulis "Task: Buat kode login", kamu malah membuat kode program login. INI SALAH BESAR!
   - Contoh Benar: Kamu menulis teks rancangan prompt yang memerintahkan AI untuk membuat kode login tersebut.
2. JANGAN tambahkan salam pembuka, kata pengantar (seperti "Tentu, ini promptnya:", "Berikut prompt Anda:"), atau kata penutup.
3. JANGAN membuat judul/heading evaluasi seperti "### 1. Evaluasi" atau "### 2. Formula".
4. Tuliskan HANYA teks prompt final siap pakai dengan struktur baku formula R-T-C-F:

Sebagai [Role yang dispesifikasikan dan diberi bobot persona ahli], tugas utamamu adalah [Task yang dijabarkan secara jelas dan operasional dengan kata kerja terukur].

Konteks Operasional & Batasan Kualitas:
- [Context & Batasan teknis siswa yang disempurnakan dengan standar industri vokasi PPLG]
- [Aturan kepatuhan, keamanan data, clean code, atau pencegahan halusinasi]

Format Output yang Diwajibkan:
- [Format luaran yang terstruktur rapi, presisi, dan mudah diimplementasikan]`;

    const userPrompt = `Input pilar formula R-T-C-F siswa yang harus kamu rangkai menjadi teks Master Prompt:
- Role (Peran): ${role || 'Spesialis Rekayasa Perangkat Lunak & AI'}
- Task (Tugas): ${task || 'Selesaikan implementasi solusi secara komprehensif'}
- Context & Constraints (Konteks & Batasan): ${promptContext || 'Terapkan standar industri terbaik, clean code, dan mitigasi error'}
- Format (Format Luaran): ${format || 'Sajikan terstruktur, sistematis, dan terperinci'}

Rangkai sekarang menjadi SATU teks Master Prompt R-T-C-F siap pakai (ingat: jangan mengeksekusi tugasnya, buatkan teks prompt-nya saja):`;

    // 1. Discover available models dynamically via ModelService.ListModels
    let candidateModels = [];
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl, {
        headers: { 'x-goog-api-key': apiKey }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          const supported = listData.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));
          
          const flashModels = supported.filter(m => m.toLowerCase().includes('flash'));
          const otherModels = supported.filter(m => !m.toLowerCase().includes('flash'));
          candidateModels = [...flashModels, ...otherModels];
        }
      }
    } catch (e) {
      // ListModels failed, will fallback to list below
    }

    // Comprehensive fallback candidate list covering all modern Gemini versions
    const fallbackModels = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-001',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro'
    ];

    const modelsToTry = [...new Set([...candidateModels, ...fallbackModels])];

    let lastError = null;
    let resultText = '';
    let usedModel = '';

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        // 1. Try with modern system_instruction
        let payload = {
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.6,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        };

        let res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
        });

        // 2. If system_instruction is not supported (HTTP 400), retry by embedding instruction in contents
        if (res.status === 400) {
          payload = {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\n---\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 2048
            }
          };
          res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
          });
        }

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
