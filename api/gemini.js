/**
 * Vercel Serverless Function: Google Gemini AI Proxy
 * RoboPrompt - KKA Fase F (PPLG SMKN 1 Bawang)
 * 
 * Safely accesses GEMINI_API_KEY from Vercel Environment Variables.
 * Prevents exposing API keys in client-side code or public GitHub repositories.
 */

module.exports = async function handler(req, res) {
  // CORS Headers for secure cross-origin interaction
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Helper to sanitize and trim API keys (strips accidental surrounding quotes/spaces)
  const sanitizeKey = (key) => {
    if (!key) return '';
    return key.trim().replace(/^["']+|["']+$/g, '').trim();
  };

  // GET: Healthcheck & Environment Variable configuration probe
  if (req.method === 'GET') {
    const rawEnv = sanitizeKey(process.env.GEMINI_API_KEY);
    const hasKey = Boolean(rawEnv && rawEnv.length > 5);
    let masked = '';
    if (hasKey) {
      masked = rawEnv.substring(0, 5) + '...' + rawEnv.substring(rawEnv.length - 4);
    }
    return res.status(200).json({
      status: 'ok',
      service: 'RoboPrompt Gemini AI Proxy (SMKN 1 Bawang)',
      platform: 'Vercel Serverless',
      hasNetlifyKey: hasKey, // backward compatibility with frontend checks
      hasCloudKey: hasKey,
      maskedKey: masked
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let data = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = {};
      }
    } else if (!data) {
      data = {};
    }

    const { role, task, context: promptContext, format, customApiKey, testOnly } = data;

    // Use environment variable first, with fallback to customApiKey if provided by user in UI
    const envKey = sanitizeKey(process.env.GEMINI_API_KEY);
    const userKey = sanitizeKey(customApiKey);
    const apiKey = envKey || userKey;

    if (!apiKey) {
      return res.status(400).json({
        error: 'MISSING_API_KEY',
        message: 'GEMINI_API_KEY belum terpasang di Environment Variables Vercel atau pengaturan aplikasi.'
      });
    }

    // Quick verification mode for the "Uji Koneksi" button
    if (testOnly) {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 7000);
      try {
        const testRes = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping' }] }],
            generationConfig: { maxOutputTokens: 5 }
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);

        const testJson = await testRes.json().catch(() => ({}));
        if (!testRes.ok) {
          const errMsg = testJson.error?.message || `HTTP ${testRes.status}`;
          return res.status(testRes.status === 401 || testRes.status === 403 ? 401 : 400).json({
            success: false,
            error: 'TEST_FAILED',
            status: testRes.status,
            message: errMsg
          });
        }

        return res.status(200).json({
          success: true,
          model: 'gemini-2.0-flash',
          message: 'Koneksi ke Google Gemini AI berhasil diverifikasi!'
        });
      } catch (e) {
        clearTimeout(tid);
        return res.status(500).json({
          success: false,
          error: 'TEST_ERROR',
          message: e.message || 'Koneksi ke server Google gagal'
        });
      }
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

    // Priority models for modern Gemini API (Fast, resilient, low latency)
    const targetModels = [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash'
    ];

    let lastError = null;
    let resultText = '';
    let usedModel = '';

    for (const model of targetModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 7000);

      try {
        const payload = {
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

        const resGoogle = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });
        clearTimeout(tid);

        // If Google rejects credentials with 401 or 403, FAIL FAST!
        if (resGoogle.status === 401 || resGoogle.status === 403) {
          const errJson = await resGoogle.json().catch(() => ({}));
          const authMsg = errJson.error?.message || 'API key not valid. Please pass a valid API key.';
          return res.status(401).json({
            error: 'AUTH_FAILED',
            status: resGoogle.status,
            message: authMsg
          });
        }

        // If system_instruction is not supported (HTTP 400), retry embedded in contents
        if (resGoogle.status === 400) {
          const retryPayload = {
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

          const retryRes = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(retryPayload)
          });

          const retryJson = await retryRes.json().catch(() => ({}));
          if (retryRes.ok) {
            const candidate = retryJson.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text;
            if (text) {
              resultText = text;
              usedModel = model;
              break;
            }
          }
        }

        const json = await resGoogle.json().catch(() => ({}));
        if (!resGoogle.ok) {
          throw new Error(json.error?.message || `HTTP status ${resGoogle.status}`);
        }

        const candidate = json.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          resultText = text;
          usedModel = model;
          break;
        }
      } catch (err) {
        clearTimeout(tid);
        lastError = err;
      }
    }

    if (!resultText) {
      throw lastError || new Error('Tidak ada respon yang diterima dari Gemini API.');
    }

    return res.status(200).json({
      success: true,
      text: resultText,
      model: usedModel
    });
  } catch (err) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'Terjadi kesalahan saat menghubungi Gemini AI.'
    });
  }
};
