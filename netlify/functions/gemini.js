/**
 * Netlify Serverless Function: Groq AI Proxy
 * RoboPrompt - KKA Fase F (PPLG SMKN 1 Bawang)
 * 
 * 100% Free Inference with Groq LPU.
 */

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, authorization',
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

  const groqKey = sanitizeKey(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);

  // GET: Healthcheck probe
  if (event.httpMethod === 'GET') {
    const hasKey = Boolean(groqKey && groqKey.length > 5);
    let masked = '';
    if (hasKey) {
      masked = groqKey.substring(0, 5) + '...' + groqKey.substring(groqKey.length - 4);
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        service: 'RoboPrompt AI Proxy (PPLG SMKN 1 Bawang)',
        platform: 'Netlify Serverless',
        provider: 'Groq AI',
        hasKey: hasKey,
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

  if (!groqKey) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'MISSING_API_KEY',
        message: 'GROQ_API_KEY belum dikonfigurasi di Environment Variables. Tambahkan GROQ_API_KEY di dashboard Netlify.'
      })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { role, task, context: promptContext, format, testOnly } = data;

    const groqModels = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b'
    ];

    if (testOnly) {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 7000);
      try {
        const testRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
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
            provider: 'Groq AI',
            model: 'openai/gpt-oss-120b',
            message: 'Koneksi ke Groq AI 100% Valid & Super Cepat!'
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

    let lastError = null;

    for (const model of groqModels) {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 9000);
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.6,
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
              message: 'GROQ_API_KEY tidak valid.'
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
              provider: 'Groq AI',
              model: model
            })
          };
        }
      } catch (err) {
        clearTimeout(tid);
        lastError = err;
      }
    }

    throw lastError || new Error('Gagal menghubungi server Groq AI.');

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
