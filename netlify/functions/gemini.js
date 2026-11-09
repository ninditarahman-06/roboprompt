/**
 * Netlify Serverless Function: Multi-Provider AI Proxy (Groq & Google Gemini)
 * RoboPrompt - KKA Fase F (PPLG SMKN 1 Bawang)
 * 
 * Supports 100% FREE Groq AI (Llama 3.3 70B) & Google Gemini AI.
 * Safely accesses GROQ_API_KEY or GEMINI_API_KEY from Environment Variables.
 */

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-goog-api-key, authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const sanitizeKey = (key) => {
    if (!key) return '';
    return key.trim().replace(/^["']+|["']+$/g, '').trim();
  };

  const groqEnv = sanitizeKey(process.env.GROQ_API_KEY);
  const geminiEnv = sanitizeKey(process.env.GEMINI_API_KEY);

  // GET: Healthcheck & Environment Variable configuration probe
  if (event.httpMethod === 'GET') {
    const activeEnv = groqEnv || geminiEnv;
    const hasKey = Boolean(activeEnv && activeEnv.length > 5);
    const activeProvider = groqEnv 
      ? 'Groq AI (Llama 3.3 70B · 100% Gratis)' 
      : (geminiEnv ? 'Google Gemini AI' : 'Belum Terpasang');
    
    let masked = '';
    if (hasKey) {
      masked = activeEnv.substring(0, 5) + '...' + activeEnv.substring(activeEnv.length - 4);
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        service: 'RoboPrompt AI Proxy (SMKN 1 Bawang)',
        platform: 'Netlify Serverless',
        provider: activeProvider,
        hasNetlifyKey: hasKey,
        hasCloudKey: hasKey,
        maskedKey: masked
      })
    };
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
    const { role, task, context: promptContext, format, customApiKey, testOnly } = data;
    const userKey = sanitizeKey(customApiKey);

    let selectedProvider = '';
    let apiKey = '';

    if (userKey) {
      if (userKey.startsWith('gsk_')) {
        selectedProvider = 'groq';
        apiKey = userKey;
      } else if (userKey.startsWith('AIza')) {
        selectedProvider = 'gemini';
        apiKey = userKey;
      } else if (userKey.length > 25) {
        selectedProvider = groqEnv ? 'groq' : 'gemini';
        apiKey = userKey;
      }
    }

    if (!apiKey) {
      if (groqEnv) {
        selectedProvider = 'groq';
        apiKey = groqEnv;
      } else if (geminiEnv) {
        selectedProvider = 'gemini';
        apiKey = geminiEnv;
      }
    }

    if (!apiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'MISSING_API_KEY',
          message: 'Kunci AI (GROQ_API_KEY atau GEMINI_API_KEY) belum terpasang di Environment Variables atau pengaturan aplikasi.'
        })
      };
    }

    // Quick verification mode for "Uji Koneksi"
    if (testOnly) {
      if (selectedProvider === 'groq') {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 7000);
        try {
          const testRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: 'Ping' }],
              max_tokens: 5
            }),
            signal: ctrl.signal
          });
          clearTimeout(tid);

          const testJson = await testRes.json().catch(() => ({}));
          if (!testRes.ok) {
            const errMsg = testJson.error?.message || `HTTP ${testRes.status}`;
            return {
              statusCode: testRes.status === 401 ? 401 : 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'TEST_FAILED',
                provider: 'Groq AI',
                status: testRes.status,
                message: errMsg
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              provider: 'Groq AI (Llama 3.3 70B)',
              model: 'llama-3.3-70b-versatile',
              message: 'Koneksi ke Groq AI (Llama 3.3 70B) 100% Valid & Super Cepat!'
            })
          };
        } catch (e) {
          clearTimeout(tid);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'TEST_ERROR',
              message: e.message || 'Koneksi ke server Groq gagal'
            })
          };
        }
      } else {
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
            return {
              statusCode: testRes.status === 401 || testRes.status === 403 ? 401 : 400,
              headers,
              body: JSON.stringify({
                success: false,
                error: 'TEST_FAILED',
                provider: 'Google Gemini',
                status: testRes.status,
                message: errMsg
              })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              provider: 'Google Gemini',
              model: 'gemini-2.0-flash',
              message: 'Koneksi ke Google Gemini AI berhasil diverifikasi!'
            })
          };
        } catch (e) {
          clearTimeout(tid);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'TEST_ERROR',
              message: e.message || 'Koneksi ke server Google gagal'
            })
          };
        }
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

    if (selectedProvider === 'groq') {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      let lastError = null;

      for (const model of groqModels) {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 9000);
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.5,
              max_tokens: 2048
            }),
            signal: ctrl.signal
          });
          clearTimeout(tid);

          if (groqRes.status === 401) {
            return {
              statusCode: 401,
              headers,
              body: JSON.stringify({
                error: 'AUTH_FAILED',
                message: 'Kunci Groq API tidak valid. Silakan dapatkan key baru gratis di console.groq.com'
              })
            };
          }

          const groqJson = await groqRes.json().catch(() => ({}));
          if (!groqRes.ok) {
            throw new Error(groqJson.error?.message || `HTTP ${groqRes.status}`);
          }

          const text = groqJson.choices?.[0]?.message?.content;
          if (text) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                text: text,
                provider: 'Groq AI (100% Free)',
                model: model
              })
            };
          }
        } catch (err) {
          clearTimeout(tid);
          lastError = err;
        }
      }

      throw lastError || new Error('Gagal menghubungi Groq AI.');
    }

    const targetModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
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

        if (resGoogle.status === 401 || resGoogle.status === 403) {
          const errJson = await resGoogle.json().catch(() => ({}));
          const authMsg = errJson.error?.message || 'API key not valid. Please pass a valid API key.';
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
              error: 'AUTH_FAILED',
              status: resGoogle.status,
              message: authMsg
            })
          };
        }

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        text: resultText,
        provider: 'Google Gemini AI',
        model: usedModel
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'SERVER_ERROR',
        message: err.message || 'Terjadi kesalahan saat menghubungi server AI.'
      })
    };
  }
};
