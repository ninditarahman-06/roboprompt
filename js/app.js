/**
 * RoboPrompt Application Controller
 * Manages State, Sub-Units, Interactive Mini-Games, Studio Generator, Quiz, and Certificate.
 * Features:
 *  - Initial Student Onboarding & Registration Gate (Nama, NIS, Kelas)
 *  - Interactive 3D Robot Explanation Engine with synchronized TTS and animations.
 *  - Generative AI Modality Categories (Dokumen, Foto, Lagu, Koding, Slide) instead of generic templates.
 */

class RoboPromptApp {
  constructor() {
    this.currentSubUnit = 1;
    this.currentAiCategory = 'doc';
    this.state = {
      studentName: '',
      studentNis: '',
      studentClass: '',
      isRegistered: false,
      progress: {
        sub1: false,
        sub2: false,
        sub3: false,
        sub4: false
      },
      minigameScore: 0,
      doctorSolvedCases: {},
      quizScore: 0,
      savedPrompts: []
    };

    // Sub-Unit 2 Game State
    this.doctorCaseIndex = 0;
    this.doctorSlots = [null, null, null, null];
    this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
    this.activeDoctorSlotIndex = 0;

    // Sub-Unit 4 Quiz State
    this.quizIndex = 0;
    this.quizAnswers = [];
    this.quizCompleted = false;

    // AI Serverless Endpoint (Groq AI Backend)
    this.serverlessEndpoint = '/api/gemini';

    // Robot Facts Interactive State
    this.robotFactIndex = 0;

    // Explanation Engine State
    this.isExplaining = false;
    this.explainStepTimer = null;

    // Generative AI Modalities Dictionary
    this.initAiCategories();

    this.init();
  }

  initAiCategories() {
    this.aiCategories = {
      doc: {
        id: 'doc',
        name: 'Dokumen & Teks',
        icon: '📄',
        tools: 'ChatGPT · Groq · Claude',
        benefit: 'Menyusun Laporan PKL/Magang, proposal proyek, artikel ilmiah, atau surat lamaran kerja.',
        tip: 'Pilar Role memperjelas persona ahli, dan pilar Format mengatur hierarki bab agar dokumen terstruktur.',
        placeholders: {
          role: 'Misal: Instruktur Pembimbing PKL, Editor Bahasa Formal...',
          task: 'Misal: Susun kerangka Laporan Akhir PKL bidang Rekayasa Perangkat Lunak...',
          context: 'Misal: Siswa SMK Fase F PPLG, bahasa baku formal, mencakup bab 1 s.d. 4...',
          format: 'Misal: Struktur Bab & Sub-bab berbutir rapi disertai tabel jadwal mingguan...'
        },
        example: {
          role: 'Instruktur Pembimbing Praktik Kerja Lapangan (PKL) SMK',
          task: 'Susun panduan dan kerangka Laporan Akhir PKL bidang Rekayasa Perangkat Lunak',
          context: 'Untuk siswa SMK Fase F PPLG, bahasa Indonesia baku formal, tidak bertele-tele, fokus kompetensi kejuruan',
          format: 'Daftar struktur Bab 1 s.d. Bab 4 berbutir rapi disertai tabel jadwal penyusunan mingguan'
        },
        simulate: (r, t, c, f) => `
<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>📄 PROMPT REKAYASA R-T-C-F:</span>
    <button class="btn-copy-pill highlight" onclick="window.app.copyPromptSnippet(this, 'doc-prompt')">📋 Salin Prompt</button>
  </div>
  <div class="prompt-copy-body" id="doc-prompt">Sebagai ${r}, tugasmu adalah ${t}. Perhatikan konteks: ${c}. Sajikan dalam format: ${f}.</div>
</div>

<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>📑 KERANGKA LAPORAN HASIL GENERASI AI:</span>
    <button class="btn-copy-pill" onclick="window.app.copyPromptSnippet(this, 'doc-output')">📋 Salin Kerangka</button>
  </div>
  <div class="prompt-copy-body" id="doc-output">PANDUAN KERANGKA LAPORAN AKHIR PKL (FASE F)

BAB I: PENDAHULUAN
• 1.1 Latar Belakang Praktik Kerja Lapangan di Industri Mitra
• 1.2 Tujuan Pembelajaran & Manfaat PKL bagi Siswa SMK
• 1.3 Profil Perusahaan dan Alur Kerja Tim

BAB II: PELAKSANAAN PRAKTIK & KOMPETENSI KEJURUAN
• 2.1 Alur Kerja Pengembangan Perangkat Lunak (Metode Agile/Scrum)
• 2.2 Teknologi & Tools yang Diterapkan (Frontend, Backend, Database)
• 2.3 Dokumentasi Fitur Utama yang Berhasil Dibangun

BAB III: KENDALA DAN PEMECAHAN MASALAH
• 3.1 Identifikasi Error & Tantangan Teknis Lapangan
• 3.2 Solusi Mentoring dari Pembimbing Industri

BAB IV: KESIMPULAN DAN REKOMENDASI
• 4.1 Refleksi Hasil Pembelajaran Siswa
• 4.2 Masukan untuk Pengembangan Kurikulum Sekolah

JADWAL MINGGUAN:
• M1: Setup Environment & Analisis Kebutuhan
• M2-M3: Implementasi Fitur & Slicing Antarmuka
• M4: Pengujian (Testing), Pembuatan Laporan, & Presentasi Akhir</div>
</div>
        `
      },

      image: {
        id: 'image',
        name: 'Foto & Gambar',
        icon: '🎨',
        tools: 'Midjourney · DALL-E · SD',
        benefit: 'Mendesain poster kampanye K3 bengkel, mockup antarmuka UI/UX, desain produk wirausaha, atau ilustrasi tugas.',
        tip: 'Pilar Context sangat krusial menentukan gaya seni, sudut kamera, pencahayaan, dan parameter rasio (--ar 16:9).',
        placeholders: {
          role: 'Misal: Concept Artist 3D, Fotografer Studio Komersial...',
          task: 'Misal: Rancang prompt visual poster kampanye Keselamatan Kerja (K3) bengkel...',
          context: 'Misal: Gaya 3D Pixar/Cyber-clean, pencahayaan neon cyan, rasio aspek 16:9, resolusi 8K...',
          format: 'Misal: Parameter Midjourney (--ar 16:9 --v 6.0 --style raw) + panduan palet warna hex...'
        },
        example: {
          role: 'Concept Artist 3D & Fotografer Studio Komersial',
          task: 'Rancang visual poster edukasi bertema "Teknologi Robotik dan Keselamatan Kerja di Bengkel Modern SMK"',
          context: 'Gaya 3D Cyber-clean, pencahayaan neon cyan dan warm amber, sudut kamera wide-angle dramatic, ultra-detailed 8K, tanpa artefak distorsi',
          format: 'Prompt teknis Midjourney V6 dengan parameter (--ar 16:9 --v 6.0 --style raw --s 250) + palet warna hex utama'
        },
        simulate: (r, t, c, f) => `
<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>🎨 PROMPT REKAYASA R-T-C-F:</span>
    <button class="btn-copy-pill" onclick="window.app.copyPromptSnippet(this, 'img-formula')">📋 Salin Prompt</button>
  </div>
  <div class="prompt-copy-body" id="img-formula">Sebagai ${r}, rancang prompt visual untuk ${t}. Batasan & parameter: ${c}. Format luaran: ${f}.</div>
</div>

<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>⚡ PROMPT TEKNIS MIDJOURNEY / DALL-E (SIAP TEMPEL):</span>
    <button class="btn-copy-pill highlight" onclick="window.app.copyPromptSnippet(this, 'img-prompt')">📋 Salin Prompt Gambar</button>
  </div>
  <div class="prompt-copy-body prompt-code" id="img-prompt">"A friendly white ceramic robot mentor assisting vocational high school students in a futuristic smart laboratory workshop, wearing safety goggles, holographic blueprints of algorithms floating in the air, cinematic studio lighting, volumetric neon cyan and warm amber glow, isometric wide angle shot, photorealistic 8k render, octane render aesthetic --ar 16:9 --style raw --v 6.0 --stylize 250"</div>
</div>

<div style="margin-top:10px; font-size:11px; line-height:1.6; color:#94A3B8;">
<strong>PALET WARNA HEX UTAMA:</strong><br/>
• <span style="color:#0B2A4A; font-weight:bold;">■ #0B2A4A</span> : Deep Tech Navy (Latar Belakang Studio)<br/>
• <span style="color:#00F0FF; font-weight:bold;">■ #00F0FF</span> : Cyber Cyan (Aksen Hologram & LED)<br/>
• <span style="color:#F3F5F8; font-weight:bold;">■ #F3F5F8</span> : Ceramic White (Bodi Robot & Interior Bersih)<br/>
• <span style="color:#F59E0B; font-weight:bold;">■ #F59E0B</span> : Safety Amber (Indikator Keselamatan Bengkel)
</div>
        `
      },

      music: {
        id: 'music',
        name: 'Musik & Lagu',
        icon: '🎵',
        tools: 'Suno AI · Udio · MusicFX',
        benefit: 'Menciptakan jingle promosi produk TeFa SMK, background music video presentasi, atau mars sekolah modern.',
        tip: 'Pilar Format menentukan pembagian bait lagu [Verse], [Chorus] dan tag instrumen/BPM.',
        placeholders: {
          role: 'Misal: Produser Musik, Komposer Jingle Iklan Kreatif...',
          task: 'Misal: Ciptakan lirik lagu motivasi belajar Koding berjudul "Kode Masa Depan"...',
          context: 'Misal: Genre Upbeat Synthwave Pop, tempo 124 BPM, vokal muda enerjik, lirik inspiratif anak muda...',
          format: 'Misal: Struktur lagu terstandar [Style], [Intro], [Verse 1], [Chorus], [Outro]...'
        },
        example: {
          role: 'Produser Musik & Komposer Jingle Iklan Kreatif',
          task: 'Ciptakan lirik dan aransemen lagu motivasi belajar Koding berjudul "Kode Impian SMK"',
          context: 'Genre Upbeat Synthwave Pop, tempo 124 BPM, vokal muda enerjik, lirik menginspirasi anak muda untuk pantang menyerah saat error',
          format: 'Struktur lagu terstandar: [Style], [Intro], [Verse 1], [Chorus], [Verse 2], [Outro]'
        },
        simulate: (r, t, c, f) => `
<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>🎵 PROMPT REKAYASA R-T-C-F:</span>
    <button class="btn-copy-pill" onclick="window.app.copyPromptSnippet(this, 'music-formula')">📋 Salin Prompt</button>
  </div>
  <div class="prompt-copy-body" id="music-formula">Sebagai ${r}, ciptakan lagu ${t}. Gaya musik & tempo: ${c}. Format aransemen: ${f}.</div>
</div>

<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>🎼 LIRIK & STYLE TAGS (SUNO AI / UDIO):</span>
    <button class="btn-copy-pill highlight" onclick="window.app.copyPromptSnippet(this, 'music-lyrics')">📋 Salin Lirik Lagu</button>
  </div>
  <div class="prompt-copy-body prompt-code" id="music-lyrics">[Style: Upbeat Synthwave Pop, 124 BPM, Driving Bassline, Bright Arpeggio Synth, Inspiring Male Youth Vocal]

[Intro - Drum Kick & Pumping Synthesizer]

[Verse 1]
Layar monitor berpijar di kala senja
Baris demi baris logika kami tata
Satu baris error jangan bikin kau resah
Di SMK kita belajar pantang menyerah!

[Pre-Chorus]
Fase F telah tiba, satukan tekad bersama!

[Chorus]
Ketik kode impian, wujudkan masa depan!
Dengan formula R-T-C-F, ciptakan ketepatan!
Dunia digital menanti karya anak bangsa
RoboPrompt memandu kita juara!

[Outro - Melody Fade Out with Electric Guitar Riff]</div>
</div>
        `
      },

      code: {
        id: 'code',
        name: 'Koding & Software',
        icon: '💻',
        tools: 'Copilot · Cursor · Claude Code',
        benefit: 'Sangat bermanfaat bagi siswa PPLG untuk membuat skrip algoritma, validasi form, atau query database.',
        tip: 'Pilar Context membatasi bahasa pemrograman dan penanganan error, sementara Format meminta penjelasan komentar.',
        placeholders: {
          role: 'Misal: Senior Software Engineer, Mentor Koding Python...',
          task: 'Misal: Buatkan fungsi Python untuk memvalidasi nomor NIS siswa dan nilai kuis...',
          context: 'Misal: Gunakan pustaka standar Python, tangani input non-angka, jelaskan tiap baris...',
          format: 'Misal: Blok kode Python bersih PEP-8 dengan docstring lengkap + 3 unit test...'
        },
        example: {
          role: 'Senior Full-Stack Developer & Mentor Algoritma SMK',
          task: 'Buatkan fungsi Python untuk memvalidasi nomor NIS siswa dan menghitung kelayakan kelulusan kuis KKA',
          context: 'Hanya gunakan modul bawaan Python (standard library), tangani exception jika input bukan angka, jelaskan setiap baris untuk pemula',
          format: 'Blok kode Python bersih PEP-8 dengan docstring lengkap + 3 skenario uji (test cases)'
        },
        simulate: (r, t, c, f) => `
<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>💻 PROMPT REKAYASA R-T-C-F:</span>
    <button class="btn-copy-pill" onclick="window.app.copyPromptSnippet(this, 'code-formula')">📋 Salin Prompt</button>
  </div>
  <div class="prompt-copy-body" id="code-formula">Sebagai ${r}, buatkan kode untuk ${t}. Batasan teknis: ${c}. Format penyajian: ${f}.</div>
</div>

<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>🐍 KODE PYTHON BERSIH (COPILOT / CLAUDE CODE):</span>
    <button class="btn-copy-pill highlight" onclick="window.app.copyPromptSnippet(this, 'code-snippet')">📋 Salin Kode Python</button>
  </div>
  <pre class="prompt-copy-body prompt-code" id="code-snippet"># Validasi Data Siswa SMK - Modul KKA Fase F
def validasi_kelulusan_siswa(nis: str, skor_kuis: int) -> dict:
    """
    Memvalidasi NIS siswa dan menghitung status sertifikasi.
    Syarat: NIS harus 6-10 digit numerik, Skor KKTP >= 75.
    """
    # 1. Validasi integritas format NIS
    if not nis.isdigit() or not (6 <= len(nis) <= 10):
        return {
            "status": "Gagal",
            "pesan": "NIS wajib berupa 6-10 digit angka numerik!"
        }
    
    # 2. Penentuan kriteria ketuntasan
    is_lulus = skor_kuis >= 75
    predikat = "Kompeten" if is_lulus else "Perlu Remedial"
    
    return {
        "status": "Sukses",
        "nis": nis,
        "nilai": skor_kuis,
        "predikat": predikat,
        "terbit_sertifikat": is_lulus
    }

# Contoh Skenario Uji (Test Cases):
print(validasi_kelulusan_siswa("20241029", 85))  # Hasil: Sukses, Kompeten
print(validasi_kelulusan_siswa("20241029", 60))  # Hasil: Sukses, Perlu Remedial
print(validasi_kelulusan_siswa("abc123", 90))    # Hasil: Gagal format NIS</pre>
</div>
        `
      },

      slide: {
        id: 'slide',
        name: 'Slide & Presentasi',
        icon: '📊',
        tools: 'Gamma AI · Tome · Canva',
        benefit: 'Membantu siswa merancang slide deck ujian tugas akhir, pitching kewirausahaan, atau seminar kelas.',
        tip: 'Tentukan batasan durasi presentasi di Context dan bagi poin penting per slide di Format.',
        placeholders: {
          role: 'Misal: Konsultan Pitching Bisnis, Desainer Presentasi...',
          task: 'Misal: Rancang susunan 5 slide presentasi proyek aplikasi edukasi...',
          context: 'Misal: Waktu presentasi 5 menit di hadapan guru dan penguji, ringkas dan persuasif...',
          format: 'Misal: Tabel 5 Slide: [Nomor Slide, Judul, Poin Visual, Naskah Narasi Presenter]...'
        },
        example: {
          role: 'Spesialis Pitching Bisnis & Desainer Komunikasi Visual',
          task: 'Rancang naskah dan susunan 5 slide presentasi proyek "Aplikasi RoboPrompt untuk Pembelajaran AI Siswa SMK"',
          context: 'Waktu presentasi 5 menit di hadapan juri uji kompetensi kejuruan, ringkas, persuasif, to-the-point',
          format: 'Tabel 5 Slide: [Nomor Slide, Judul, Poin Visual Utama, Naskah Narasi Presenter]'
        },
        simulate: (r, t, c, f) => `
<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>📊 PROMPT REKAYASA R-T-C-F:</span>
    <button class="btn-copy-pill" onclick="window.app.copyPromptSnippet(this, 'slide-formula')">📋 Salin Prompt</button>
  </div>
  <div class="prompt-copy-body" id="slide-formula">Sebagai ${r}, rancang alur presentasi untuk ${t}. Batasan: ${c}. Format: ${f}.</div>
</div>

<div class="prompt-copy-card">
  <div class="prompt-copy-head">
    <span>📑 STRUKTUR 5 SLIDE (GAMMA AI / TOME):</span>
    <button class="btn-copy-pill highlight" onclick="window.app.copyPromptSnippet(this, 'slide-script')">📋 Salin Naskah Slide</button>
  </div>
  <div class="prompt-copy-body" id="slide-script">SLIDE 1: COVER & IDENTITAS PROYEK
• Visual: Render 3D Robot Mascot dengan Logo Kemendikdasmen & SMK Bisa-Hebat
• Narasi: "Selamat pagi dewan juri, kami persembahkan RoboPrompt, platform inovatif penguasaan rekayasa AI untuk siswa SMK!"

SLIDE 2: MASALAH SISWA (PROBLEM)
• Visual: Data 70% siswa masih membuat prompt asal-asalan yang memicu halusinasi AI
• Narasi: "Banyak siswa belum memahami bahwa kualitas output AI sangat bergantung pada spesifikasi inputnya."

SLIDE 3: SOLUSI FORMULA R-T-C-F
• Visual: Diagram 4 pilar Role, Task, Context, dan Format
• Narasi: "Dengan metode R-T-C-F, siswa belajar berpikir komputasional dan menyusun prompt standar industri."

SLIDE 4: DEMO KLINIK & SIMULATOR
• Visual: Cuplikan game Prompt Doctor dan live tester lintas modalitas AI
• Narasi: "Siswa dapat langsung menguji prompt untuk membuat dokumen, visual, musik, hingga kode program."

SLIDE 5: KESIMPULAN & PENUTUP
• Visual: Sertifikat Digital resmi dan QR Code validasi portofolio siswa
• Narasi: "RoboPrompt siap mencetak talenta vokasi yang kompeten dan adaptif di era kecerdasan artifisial."</div>
</div>
        `
      }
    };
  }

  init() {
    this.loadSession();
    this.setupFitScale();
    this.setupEventListeners();
    this.renderSidebar();
    this.setupRobot();
    this.checkNetlifyHealth();

    // Check if initial registration is needed
    if (!this.state.isRegistered || !this.state.studentName || !this.state.studentNis) {
      this.openRegistrationModal(true);
    } else {
      this.switchSubUnit(1);
      setTimeout(() => {
        this.showRobotDialogue(`Selamat datang kembali, ${this.state.studentName}! Mari kita lanjutkan belajar formula R-T-C-F!`);
      }, 800);
    }
  }

  setupFitScale() {
    const stage = document.getElementById('stage');
    const fit = () => {
      const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
      stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    };
    window.addEventListener('resize', fit);
    fit();
  }

  setupRobot() {
    if (window.Robot3D) {
      window.robot = new window.Robot3D('robotCanvasContainer');
    }
  }

  loadSession() {
    try {
      const saved = localStorage.getItem('roboprompt_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('Session load error:', e);
    }
    this.state.doctorSolvedCases = this.state.doctorSolvedCases || {};
    this.updateStudentBadge();
  }

  saveSession() {
    try {
      localStorage.setItem('roboprompt_session', JSON.stringify(this.state));
    } catch (e) {}
    this.updateStudentBadge();
    this.updateGlobalProgress();
  }

  updateStudentBadge() {
    const nameEl = document.getElementById('studentNameDisplay');
    const nisEl = document.getElementById('studentNisDisplay');
    const classEl = document.getElementById('studentClassDisplay');
    const scoreEl = document.getElementById('studentScoreDisplay');
    
    if (nameEl) nameEl.textContent = this.state.studentName || 'Belum Terdaftar';
    if (nisEl) nisEl.textContent = `NIS: ${this.state.studentNis || '-'}`;
    if (classEl) classEl.textContent = `Kelas: ${this.state.studentClass || '-'}`;
    if (scoreEl) scoreEl.textContent = `${this.state.minigameScore + this.state.quizScore} Poin`;
  }

  updateGlobalProgress() {
    const p = this.state.progress;
    let completed = 0;
    if (p.sub1) completed++;
    if (p.sub2) completed++;
    if (p.sub3) completed++;
    if (p.sub4) completed++;
    const pct = Math.round((completed / 4) * 100);

    const fill = document.getElementById('globalProgressFill');
    const text = document.getElementById('globalProgressPct');
    if (fill) fill.style.width = `${Math.max(15, pct)}%`;
    if (text) text.textContent = `${pct}%`;
  }

  // ========================================================
  // CLIPBOARD COPY & TOAST NOTIFICATION HELPERS
  // ========================================================
  showToast(msg, icon = '📋') {
    const toast = document.getElementById('appToast');
    const toastMsg = document.getElementById('appToastMsg');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    const iconEl = toast.querySelector('.toast-icon');
    if (iconEl) iconEl.textContent = icon;

    toast.classList.add('show');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  copyToClipboard(text, successMsg = 'Teks berhasil disalin ke clipboard!', btnElement = null) {
    if (!text) return;

    const onSuccess = () => {
      if (window.audioMgr) window.audioMgr.click();
      this.showToast(successMsg, '📋');

      if (btnElement) {
        const originalHTML = btnElement.innerHTML;
        btnElement.innerHTML = '✓ Tersalin!';
        btnElement.classList.add('copied');
        setTimeout(() => {
          btnElement.innerHTML = originalHTML;
          btnElement.classList.remove('copied');
        }, 2200);
      }

      if (window.robot) {
        window.robot.setState('CHEER', 1800);
      }
      this.showRobotDialogue("Prompt / teks berhasil disalin ke clipboard! Siap kamu tempelkan langsung ke AI.");
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        this.fallbackCopyText(text, onSuccess);
      });
    } else {
      this.fallbackCopyText(text, onSuccess);
    }
  }

  fallbackCopyText(text, callback) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      if (callback) callback();
    } catch (err) {
      console.error('Fallback copy failed', err);
      alert('Gagal menyalin otomatis. Silakan salin teks secara manual.');
    }
    document.body.removeChild(textarea);
  }

  copyPromptSnippet(btnEl, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const text = target.innerText || target.textContent;
    this.copyToClipboard(text.trim(), 'Hasil prompt berhasil disalin!', btnEl);
  }

  showRobotDialogue(text, triggerSpeech = true, onSpeechEnd = null) {
    const textEl = document.getElementById('dialogueText');
    if (!textEl) return;

    if (this._dialogueTimer) {
      clearTimeout(this._dialogueTimer);
      this._dialogueTimer = null;
    }

    // Bersihkan tag HTML agar kalkulasi sliding window 1 baris mulus tanpa tag rusak
    const cleanText = text.replace(/<[^>]+>/g, '').trim();
    textEl.textContent = '';
    let i = 0;
    let visibleText = '';
    const speed = 25;

    const typeWriter = () => {
      if (i < cleanText.length) {
        visibleText += cleanText[i];
        textEl.textContent = visibleText;

        // JIKA BARIS PENUH: Otomatis memangkas kata di depannya (1 baris tanpa scrollbar)
        while (textEl.clientWidth > 40 && textEl.scrollWidth > textEl.clientWidth && visibleText.length > 5) {
          const spaceIdx = visibleText.indexOf(' ');
          if (spaceIdx !== -1 && spaceIdx < visibleText.length - 3) {
            visibleText = visibleText.slice(spaceIdx + 1);
          } else {
            visibleText = visibleText.slice(1);
          }
          textEl.textContent = visibleText;
        }

        i++;
        this._dialogueTimer = setTimeout(typeWriter, speed);
      }
    };
    typeWriter();

    if (triggerSpeech && window.audioMgr) {
      window.audioMgr.speak(
        cleanText, 
        () => {
          if (window.robot) window.robot.setSpeaking(false);
          if (onSpeechEnd) onSpeechEnd();
        },
        () => {
          if (window.robot) window.robot.setSpeaking(true);
        }
      );
    }
  }

  // ========================================================
  // INTERACTIVE 3D MASCOT: PROMPT AI FACTS & INSIGHTS
  // ========================================================
  getPromptAiFacts() {
    return [
      {
        tag: 'Asal-Usul Istilah',
        state: 'CHEER',
        text: '💡 Tahukah kamu? Kata "Prompt" awalnya berasal dari panggung teater, yaitu bisikan petunjuk kepada aktor saat lupa dialog! Pada AI, kamulah yang menjadi sutradara dan pembisik arah pikirannya!'
      },
      {
        tag: 'Halusinasi AI',
        state: 'CONFUSE',
        text: '🛡️ Fakta AI: AI tidak punya basis data kebenaran mutlak; ia memprediksi urutan kata berikutnya secara statistik. Menambahkan pilar Context yang ketat dapat mengurangi halusinasi AI hingga 80%!'
      },
      {
        tag: 'Kekuatan Role',
        state: 'EXPLAIN',
        text: '🎭 Rahasia Pilar Role: Memberikan peran spesifik seperti "Senior Python Developer" atau "Concept Artist 3D" membatasi korpus kosakata AI ke ranah profesional, membuat hasil 3x lebih bermutu!'
      },
      {
        tag: 'Few-Shot Prompting',
        state: 'CHEER',
        text: '🎯 Teknik Few-Shot: Memberikan 2 atau 3 contoh pasangan tanya-jawab di dalam prompt dinamakan Few-Shot Prompting. Akurasi luaran format AI akan meningkat drastis!'
      },
      {
        tag: 'Prinsip GIGO',
        state: 'CONFUSE',
        text: '🗑️ Prinsip GIGO (Garbage In, Garbage Out): Jika instruksi yang kamu masukkan ambigu dan rusak, AI akan membalas dengan luaran yang ngawur. Presisi luaran AI adalah cermin kejelasan prompt-mu!'
      },
      {
        tag: 'Chain-of-Thought',
        state: 'EXPLAIN',
        text: '🧠 Keajaiban Chain-of-Thought: Menginstruksikan AI "Berpikirlah langkah demi langkah (step-by-step)" memaksa model memeriksa alur logika sebelum menjawab, memangkas error logika matematika dan koding!'
      },
      {
        tag: 'Delimiter',
        state: 'EXPLAIN',
        text: '🔒 Delimiter Pembatas: Menggunakan tanda pagar tiga (###) atau tanda kutip tiga (""") membantu AI memisahkan secara tegas mana perintah instruksi sistem dan mana teks bahan yang harus dianalisis.'
      },
      {
        tag: 'Negative Prompting',
        state: 'CHEER',
        text: '🚫 Negative Prompting: Pada AI generator gambar seperti Midjourney, parameter "--no text watermark blur" berfungsi sebagai Negative Prompt untuk melarang kemunculan elemen yang tidak diinginkan!'
      },
      {
        tag: 'Tabel Markdown',
        state: 'EXPLAIN',
        text: '📊 Efektivitas Markdown: AI sangat mahir menyajikan data komparasi dalam tabel Markdown. Selalu minta "Format: Sajikan dalam tabel Markdown" untuk perbandingan perangkat dan spesifikasi!'
      },
      {
        tag: 'Musik & Suno AI',
        state: 'CHEER',
        text: '🎵 Formula Musik Suno AI: Saat merancang lagu dengan AI, menyisipkan tag format struktur seperti [Verse], [Chorus], dan [Outro] akan mengatur progresi melodi lagu secara presisi!'
      },
      {
        tag: 'Peluang Karir',
        state: 'CHEER',
        text: '💼 Peluang Karir Vokasi: Di era industri 5.0, keahlian rekayasa prompt (Prompt Engineering) menjadi salah satu kecakapan digital masa depan dengan nilai kompetensi tertinggi!'
      },
      {
        tag: 'Iterative Refinement',
        state: 'EXPLAIN',
        text: '🔄 Iterative Refinement: Prompt yang hebat jarang lahir dalam satu kali coba. Rahasia ahli AI adalah melakukan evaluasi hasil lalu menyempurnakan pilar yang kurang secara bertahap!'
      },
      {
        tag: 'Parameter Temperature',
        state: 'CONFUSE',
        text: '⚡ Parameter Temperature: Semakin rendah nilai temperature (misal 0.2), jawaban AI semakin fokus dan faktual. Semakin tinggi (misal 0.8), AI akan semakin imajinatif dan kreatif!'
      },
      {
        tag: 'Rasio Gambar',
        state: 'EXPLAIN',
        text: '📐 Rasio Aspek Gambar: Parameter "--ar 16:9" untuk layar monitor atau "--ar 9:16" untuk smartphone masuk ke pilar Context & Constraints untuk mengunci proporsi visual render AI.'
      },
      {
        tag: 'Integritas Vokasi',
        state: 'CHEER',
        text: '📑 Integritas Siswa SMK: Gunakan AI sebagai mitra riset dan perancang kerangka, lalu verifikasi fakta teknis di lingkungan nyata. Jadilah pengendali teknologi yang kritis dan beretika!'
      },
      {
        tag: 'Arsitektur Transformer',
        state: 'EXPLAIN',
        text: '🚀 Fondasi Transformer: Model bahasa modern canggih seperti Llama & Groq AI dibangun di atas arsitektur neural network Transformer yang diperkenalkan pada makalah riset tahun 2017: "Attention Is All You Need"!'
      }
    ];
  }

  onRobotClicked() {
    const facts = this.getPromptAiFacts();
    if (this.robotFactIndex === undefined) this.robotFactIndex = 0;
    const fact = facts[this.robotFactIndex % facts.length];
    this.robotFactIndex++;

    if (window.robot) {
      window.robot.setState(fact.state || 'CHEER', 3500);
    }
    if (window.audioMgr) {
      window.audioMgr.robotChirp();
    }

    this.showRobotDialogue(fact.text);
  }

  setupEventListeners() {
    // Top Bar Actions
    document.getElementById('btnToggleAudio')?.addEventListener('click', (e) => {
      if (!window.audioMgr) return;
      const muted = window.audioMgr.toggleMute();
      e.currentTarget.classList.toggle('active', !muted);
      e.currentTarget.innerHTML = muted 
        ? '<span class="icon">🔇</span>' 
        : '<span class="icon">🔊</span>';
    });

    document.getElementById('btnToggleBGM')?.addEventListener('click', (e) => {
      if (!window.audioMgr) return;
      const playing = window.audioMgr.toggleBGM();
      e.currentTarget.classList.toggle('active', playing);
      if (playing) {
        this.showRobotDialogue("Musik latar lo-fi aktif! Selamat belajar dengan tenang.");
      }
    });

    document.getElementById('btnFullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Robot Speech Bubble Click -> Trigger interactive facts & tips
    document.getElementById('robotDialogueCard')?.addEventListener('click', () => {
      this.onRobotClicked();
    });

    // Robot Explain Button in Bottom Bar
    const btnExplain = document.getElementById('btnExplainTopic');
    btnExplain?.addEventListener('click', () => {
      if (this.isExplaining) {
        this.stopExplanation();
      } else {
        this.startTopicExplanation();
      }
    });

    // Student Profile Edit Button
    document.getElementById('editStudentBtn')?.addEventListener('click', () => {
      this.openRegistrationModal(false);
    });

    // Student Onboarding Form Submit
    document.getElementById('onboardingForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const nis = document.getElementById('regNis').value.trim();
      const studentClass = document.getElementById('regClass').value.trim();

      if (!name || !nis || !studentClass) {
        alert('Mohon isi semua data (Nama, NIS, dan Kelas)!');
        return;
      }

      this.state.studentName = name;
      this.state.studentNis = nis;
      this.state.studentClass = studentClass;
      this.state.isRegistered = true;
      this.saveSession();

      const modal = document.getElementById('onboardingModal');
      modal?.classList.remove('open');

      if (window.audioMgr) window.audioMgr.coinDing();
      if (window.robot) window.robot.setState('CHEER', 3500);

      this.switchSubUnit(1);
      this.showRobotDialogue(`Selamat datang di RoboPrompt, ${name} (NIS: ${nis}) dari kelas ${studentClass}! Aku Robo-Prompt, siap membantumu!`);
    });

    // Bottom Navigation
    document.getElementById('navPrevBtn')?.addEventListener('click', () => {
      this.stopExplanation();
      if (this.currentSubUnit > 1) {
        this.switchSubUnit(this.currentSubUnit - 1);
      }
    });

    document.getElementById('navNextBtn')?.addEventListener('click', () => {
      this.stopExplanation();
      if (this.currentSubUnit < 4) {
        this.switchSubUnit(this.currentSubUnit + 1);
      } else {
        const is100Pct = this.state.progress.sub1 && 
                         this.state.progress.sub2 && 
                         this.state.progress.sub3 && 
                         this.state.progress.sub4;
        if (is100Pct) {
          this.openCertificateModal();
        } else {
          this.showToast('⚠️ Selesaikan evaluasi kuis dengan nilai minimal 80 untuk membuka sertifikat!');
          this.showRobotDialogue("Sertifikat belum dapat dibuka! Tuntaskan seluruh kuis evaluasi dengan skor minimal 80 untuk menerbitkan sertifikat.");
        }
      }
    });

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => {
          if (m.id !== 'onboardingModal' || this.state.isRegistered) {
            m.classList.remove('open');
          }
        });
      });
    });
  }

  openRegistrationModal(isInitial = false) {
    const modal = document.getElementById('onboardingModal');
    if (!modal) return;

    const nameInp = document.getElementById('regName');
    const nisInp = document.getElementById('regNis');
    const classInp = document.getElementById('regClass');

    if (nameInp) nameInp.value = this.state.studentName || '';
    if (nisInp) nisInp.value = this.state.studentNis || '';
    if (classInp) classInp.value = this.state.studentClass || '';

    modal.classList.add('open');

    if (window.robot) window.robot.setState('EXPLAIN', 2500);
    this.showRobotDialogue("Halo! Silakan masukkan Nama Lengkap, NIS, dan Kelasmu sebelum kita mulai belajar!");
  }

  // ========================================================
  // ROBOT EXPLANATION ENGINE
  // ========================================================
  startTopicExplanation() {
    this.isExplaining = true;
    this.updateExplainButton(true);

    if (window.audioMgr) window.audioMgr.robotChirp();

    if (this.currentSubUnit === 1) {
      this.explainSubUnit1StepByStep();
    } else if (this.currentSubUnit === 2) {
      this.explainSubUnit2();
    } else if (this.currentSubUnit === 3) {
      this.explainSubUnit3();
    } else if (this.currentSubUnit === 4) {
      this.explainSubUnit4();
    }
  }

  stopExplanation() {
    this.isExplaining = false;
    this.updateExplainButton(false);
    if (this.explainStepTimer) {
      clearTimeout(this.explainStepTimer);
      this.explainStepTimer = null;
    }
    if (window.audioMgr) window.audioMgr.stopSpeech();
    if (window.robot) {
      window.robot.setSpeaking(false);
      window.robot.setState('IDLE');
    }
    // Remove all highlights
    document.querySelectorAll('.rtcf-card').forEach(c => c.classList.remove('explaining-active'));
  }

  updateExplainButton(active) {
    const btn = document.getElementById('btnExplainTopic');
    const label = document.getElementById('explainBtnLabel');
    const icon = document.getElementById('explainBtnIcon');
    const wave = document.getElementById('explainWaveBars');

    if (btn) btn.classList.toggle('speaking', active);
    if (label) label.textContent = active ? 'Hentikan Penjelasan' : 'Jelaskan Materi';
    if (icon) icon.textContent = active ? '⏹️' : '🎙️';
    if (wave) wave.style.display = active ? 'inline-flex' : 'none';
  }

  explainSubUnit1StepByStep() {
    const steps = [
      {
        cardSelector: '.c-role',
        text: "Pilar pertama adalah Role atau Peran! Tetapkan identitas ahli pada AI, misalnya 'Guru Biologi' atau 'Senior Developer', agar bahasa dan sudut pandangnya presisi."
      },
      {
        cardSelector: '.c-task',
        text: "Pilar kedua adalah Task atau Tugas Inti! Gunakan kata kerja operasional tegas seperti 'Rancang', 'Analisis', atau 'Jelaskan', agar AI tahu persis apa yang harus dihasilkan."
      },
      {
        cardSelector: '.c-context',
        text: "Pilar ketiga adalah Context dan Batasan! Di sinilah kamu menetapkan target audiens dan batasan panjang tulisan agar AI tidak berhalusinasi atau ngawur."
      },
      {
        cardSelector: '.c-format',
        text: "Pilar keempat adalah Format! Minta struktur keluaran yang spesifik, seperti tabel Markdown, poin ringkas, atau kode JSON, agar hasil AI rapi dan siap pakai!"
      },
      {
        cardSelector: null,
        text: "Itulah formula baku R-T-C-F! Formula ini berlaku untuk semua jenis AI: dokumen teks, pembuatan foto, aransemen musik, hingga penulisan kode program!"
      }
    ];

    let currentStep = 0;
    const runStep = () => {
      if (!this.isExplaining) return;

      // Remove previous active classes
      document.querySelectorAll('.rtcf-card').forEach(c => c.classList.remove('explaining-active'));

      if (currentStep < steps.length) {
        const item = steps[currentStep];
        if (item.cardSelector) {
          const cardEl = document.querySelector(item.cardSelector);
          if (cardEl) cardEl.classList.add('explaining-active');
        }

        this.showRobotDialogue(item.text, true, () => {
          currentStep++;
          this.explainStepTimer = setTimeout(runStep, 900);
        });
      } else {
        this.stopExplanation();
        if (window.robot) window.robot.setState('CHEER', 3000);
      }
    };

    runStep();
  }

  explainSinglePillar(type) {
    this.stopExplanation();
    this.isExplaining = true;
    this.updateExplainButton(true);

    document.querySelectorAll('.rtcf-card').forEach(c => c.classList.remove('explaining-active'));
    const cardEl = document.querySelector(`.c-${type}`);
    if (cardEl) cardEl.classList.add('explaining-active');

    const scripts = {
      role: "Pilar Role menentukan persona AI. Saat kamu memberi AI peran seorang ahli, model akan membatasi gaya bahasa dan pengetahuannya sesuai profesi tersebut.",
      task: "Pilar Task adalah jantung instruksimu. Jangan gunakan instruksi abstrak, melainkan instruksi operasional yang terukur.",
      context: "Pilar Context adalah pagar pelindung. Kamu harus membatasi audiens, melarang jargon rumit, dan menentukan batasan panjang respons.",
      format: "Pilar Format adalah wadah hasil akhir. Mintalah format tabel, daftar berpoin, atau skema kode agar kamu tidak perlu merapikan ulang hasilnya."
    };

    const text = scripts[type] || "Formula R-T-C-F membuat prompt AI terstruktur dan bebas halusinasi.";
    this.showRobotDialogue(text, true, () => {
      this.stopExplanation();
    });
  }

  explainSubUnit2() {
    const text = "Di klinik Prompt Doctor ini, kamu berperan sebagai dokter spesialis prompt! Amati pasien di atas yang instruksinya ambigu. Pilih kartu komponen yang tepat dari apotek di bawah, lalu pasangkan ke dalam 4 slot infus: Role, Task, Context, dan Format. Ayo sembuhkan pasiennya!";
    this.showRobotDialogue(text, true, () => {
      this.stopExplanation();
    });
  }

  explainSubUnit3() {
    const text = "Di RoboPrompt Studio, kamu merancang prompt berkualitas tinggi menggunakan formula standar industri R-T-C-F (Role, Task, Context, dan Format). Masukkan kata-katamu pada setiap pilar, lalu klik '⚡ Optimalkan dengan AI' untuk mendapatkan prompt siap pakai yang profesional!";
    this.showRobotDialogue(text, true, () => {
      this.stopExplanation();
    });
  }

  explainSubUnit4() {
    const text = "Saatnya pembuktian kompetensi! Ada 5 soal studi kasus rekayasa prompt. Baca instruksi kasus dengan teliti, tentukan pilar mana yang ditanyakan, dan kumpulkan skor terbaikmu untuk meraih Sertifikat Digital resmi!";
    this.showRobotDialogue(text, true, () => {
      this.stopExplanation();
    });
  }

  renderSidebar() {
    const list = document.getElementById('subunitNavList');
    if (!list) return;

    const subUnits = [
      { id: 1, tag: 'Sub-1', title: 'Teori R-T-C-F', key: 'sub1' },
      { id: 2, tag: 'Sub-2', title: 'Prompt Doctor', key: 'sub2' },
      { id: 3, tag: 'Sub-3', title: 'RoboPrompt Studio', key: 'sub3' },
      { id: 4, tag: 'Sub-4', title: 'Evaluasi & Kuis', key: 'sub4' }
    ];

    const is100Pct = this.state.progress.sub1 && 
                     this.state.progress.sub2 && 
                     this.state.progress.sub3 && 
                     this.state.progress.sub4;

    let html = subUnits.map(item => {
      const isCompleted = this.state.progress[item.key];
      const isActive = this.currentSubUnit === item.id;
      // Sub-unit unlocked if previous completed or first.
      // Sub-3 (RoboPrompt Studio) is NEVER locked even if overall progress is 0%.
      const isLocked = (item.id === 3) 
        ? false 
        : (item.id > 1 && !this.state.progress[`sub${item.id - 1}`] && !isActive);

      let icon = item.id;
      if (isCompleted) icon = '✓';
      if (isLocked) icon = '🔒';

      return `
        <div class="subunit-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" 
             data-id="${item.id}">
          <div class="subunit-icon">${icon}</div>
          <div class="subunit-info">
            <div class="subunit-tag">${item.tag}</div>
            <div class="subunit-title">${item.title}</div>
          </div>
        </div>
      `;
    }).join('');

    // If progress is 100%, automatically render the Certificate button right below Sub-4!
    if (is100Pct) {
      html += `
        <div class="sidebar-cert-btn-item" id="btnSidebarCertificate" title="Selamat! Progres sudah 100%! Klik untuk membuka & mengunduh Sertifikat Digital!">
          <div class="cert-item-icon">🎓</div>
          <div class="cert-item-info">
            <div class="cert-item-tag">PROGRES 100% · LULUS</div>
            <div class="cert-item-title">Sertifikat Digital</div>
          </div>
          <span class="cert-item-arrow">➔</span>
        </div>
      `;
    }

    list.innerHTML = html;

    // Attach click handlers
    list.querySelectorAll('.subunit-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.getAttribute('data-id'), 10);
        if (el.classList.contains('locked')) {
          if (window.audioMgr) window.audioMgr.errorBuzz();
          if (window.robot) window.robot.setState('CONFUSE', 2000);
          this.showRobotDialogue("Ups! Tuntaskan sub-unit sebelumnya terlebih dahulu ya!");
          return;
        }
        this.stopExplanation();
        this.switchSubUnit(id);
      });
    });

    if (is100Pct) {
      list.querySelector('#btnSidebarCertificate')?.addEventListener('click', () => {
        if (window.audioMgr) window.audioMgr.click();
        this.openCertificateModal();
      });
    }
  }

  switchSubUnit(id) {
    if (window.audioMgr) window.audioMgr.whoosh();
    this.currentSubUnit = id;
    this.renderSidebar();

    const prevBtn = document.getElementById('navPrevBtn');
    const nextBtn = document.getElementById('navNextBtn');
    if (prevBtn) prevBtn.disabled = (id === 1);
    if (nextBtn) {
      nextBtn.innerHTML = (id === 4) ? '🏆 Lihat Sertifikat' : 'Lanjut ➔';
    }

    const container = document.getElementById('viewContainer');
    if (!container) return;

    if (id === 1) {
      this.renderSubUnit1(container);
      if (window.robot) window.robot.setState('EXPLAIN', 3000);
      this.showRobotDialogue("Selamat datang di Sub-Unit 1! Klik tombol 'Jelaskan Materi' jika ingin aku memandu setiap pilar R-T-C-F!");
    } else if (id === 2) {
      this.renderSubUnit2(container);
      if (window.robot) window.robot.setState('CONFUSE', 2500);
      this.showRobotDialogue("Gawat! Ada prompt yang sakit parah! Susun 4 kepingan formula R-T-C-F pada 5 studi kasus ini!");
    } else if (id === 3) {
      this.renderSubUnit3(container);
      if (window.robot) window.robot.setState('EXPLAIN', 3000);
      this.showRobotDialogue("Selamat datang di RoboPrompt Studio! Masukkan formulamu pada pilar R-T-C-F, lalu klik '⚡ Optimalkan dengan AI'!");
    } else if (id === 4) {
      this.renderSubUnit4(container);
      if (window.robot) window.robot.setState('IDLE');
      this.showRobotDialogue("Waktunya Uji Pemahaman! Jawab 25 butir evaluasi berikut dan raih skor minimal 80 untuk sertifikat!");
    }
  }

  // ========================================================
  // SUB-UNIT 1: TEORI R-T-C-F
  // ========================================================
  renderSubUnit1(container) {
    container.innerHTML = `
      <div class="section-header">
        <div class="section-tag">📘 Sub-Unit 1 · Dasar KKA Fase F</div>
        <h2 class="section-title">Anatomi Formula Baku R-T-C-F</h2>
        <p class="section-desc">Formula standar industri untuk menghasilkan instruksi AI yang presisi pada berbagai modalitas: teks, gambar, musik, hingga kode program.</p>
      </div>

      <div class="rtcf-grid">
        <div class="rtcf-card c-role" data-card="role">
          <div class="rtcf-card-header">
            <span class="rtcf-badge">Pilar 1</span>
            <button class="card-explain-mini-btn" data-explain="role" title="Dengarkan penjelasan pilar Role">🎙️ Jelaskan</button>
          </div>
          <h3 class="rtcf-card-title">Role (Peran AI)</h3>
          <p class="rtcf-card-summary">Menetapkan identitas, keahlian, dan sudut pandang model AI sebelum ia berpikir.</p>
          <div class="rtcf-card-meta">
            <span>Contoh: "Arsitek Sistem", "Guru Biologi", "Concept Artist"</span>
            <span>Buka Detail ➔</span>
          </div>
        </div>

        <div class="rtcf-card c-task" data-card="task">
          <div class="rtcf-card-header">
            <span class="rtcf-badge">Pilar 2</span>
            <button class="card-explain-mini-btn" data-explain="task" title="Dengarkan penjelasan pilar Task">🎙️ Jelaskan</button>
          </div>
          <h3 class="rtcf-card-title">Task (Tugas Inti)</h3>
          <p class="rtcf-card-summary">Instruksi tindakan spesifik yang wajib dikerjakan menggunakan kata kerja aktif yang jelas.</p>
          <div class="rtcf-card-meta">
            <span>Contoh: "Rancang 5 skenario uji", "Buat lirik lagu", "Tulis skrip"</span>
            <span>Buka Detail ➔</span>
          </div>
        </div>

        <div class="rtcf-card c-context" data-card="context">
          <div class="rtcf-card-header">
            <span class="rtcf-badge">Pilar 3</span>
            <button class="card-explain-mini-btn" data-explain="context" title="Dengarkan penjelasan pilar Context">🎙️ Jelaskan</button>
          </div>
          <h3 class="rtcf-card-title">Context & Constraints</h3>
          <p class="rtcf-card-summary">Latar belakang audiens, situasi, batasan hal yang dilarang, rasio visual, atau tempo musik.</p>
          <div class="rtcf-card-meta">
            <span>Contoh: "Audiens siswa SMK, 124 BPM, rasio 16:9"</span>
            <span>Buka Detail ➔</span>
          </div>
        </div>

        <div class="rtcf-card c-format" data-card="format">
          <div class="rtcf-card-header">
            <span class="rtcf-badge">Pilar 4</span>
            <button class="card-explain-mini-btn" data-explain="format" title="Dengarkan penjelasan pilar Format">🎙️ Jelaskan</button>
          </div>
          <h3 class="rtcf-card-title">Format (Bentuk Output)</h3>
          <p class="rtcf-card-summary">Struktur penyajian hasil akhir: tabel Markdown, tag bait lagu [Verse/Chorus], atau blok kode bersih.</p>
          <div class="rtcf-card-meta">
            <span>Contoh: "Tabel Markdown", "Prompt Midjourney V6", "Kode Python"</span>
            <span>Buka Detail ➔</span>
          </div>
        </div>
      </div>

      <div class="compare-box">
        <div class="compare-header">
          <div class="compare-title">⚖️ Komparasi Hasil: Prompt Asal vs Formula R-T-C-F</div>
          <div class="toggle-group">
            <button class="toggle-btn" id="btnShowBad">Prompt Asal-Asalan</button>
            <button class="toggle-btn active" id="btnShowRTCF">Formula R-T-C-F</button>
          </div>
        </div>
        <div class="compare-body" id="compareBody">
          <div class="compare-card bad" id="compareCardBad">
            <span class="compare-card-tag">❌ Prompt Lemah & Ambigu</span>
            <div class="code-snippet">"Tolong buatin deskripsi singkat tentang fotosintesis buat tugas."</div>
            <p style="margin-top:8px; font-size:12px; color:#4B5563;">
              <strong>Respon AI:</strong> Menghasilkan teks ensiklopedia umum yang terlalu teknis dengan rumus kimia kompleks yang tidak cocok untuk tugas sekolah siswa pemula.
            </p>
          </div>
          <div class="compare-card good" id="compareCardGood">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="compare-card-tag">✅ Prompt Terstruktur (R-T-C-F)</span>
              <button class="btn-copy-pill" id="btnCopySub1Example" title="Salin contoh formula prompt ini">📋 Salin Contoh</button>
            </div>
            <div class="code-snippet">
              <strong>[Role]</strong> Guru IPA SMP yang ramah.<br>
              <strong>[Task]</strong> Jelaskan fotosintesis dengan analogi memasak di dapur.<br>
              <strong>[Context]</strong> Siswa usia 12 tahun, hindari istilah kimia rumit.<br>
              <strong>[Format]</strong> 2 paragraf narasi dan 1 tabel analogi bahan vs hasil.
            </div>
            <p style="margin-top:8px; font-size:12px; color:#065F46;">
              <strong>Respon AI:</strong> Sangat hidup, mudah dimengerti, relevan dengan usia target, dan terstruktur rapi dalam tabel!
            </p>
          </div>
        </div>
      </div>
    `;

    // Toggle button handlers
    const btnBad = container.querySelector('#btnShowBad');
    const btnRTCF = container.querySelector('#btnShowRTCF');
    const cardBad = container.querySelector('#compareCardBad');
    const cardGood = container.querySelector('#compareCardGood');

    btnBad?.addEventListener('click', () => {
      btnBad.classList.add('active');
      btnRTCF.classList.remove('active');
      cardBad.style.opacity = '1';
      cardBad.style.transform = 'scale(1.02)';
      cardGood.style.opacity = '0.4';
      cardGood.style.transform = 'scale(0.98)';
      if (window.audioMgr) window.audioMgr.click();
      if (window.robot) window.robot.setState('CONFUSE', 2000);
      this.showRobotDialogue("Lihat! Prompt asal-asalan menghasilkan jawaban AI yang tidak fokus dan membingungkan!");
    });

    btnRTCF?.addEventListener('click', () => {
      btnRTCF.classList.add('active');
      btnBad.classList.remove('active');
      cardGood.style.opacity = '1';
      cardGood.style.transform = 'scale(1.02)';
      cardBad.style.opacity = '0.4';
      cardBad.style.transform = 'scale(0.98)';
      if (window.audioMgr) window.audioMgr.click();
      if (window.robot) window.robot.setState('CHEER', 2000);
      this.showRobotDialogue("Keren! Dengan formula R-T-C-F, respon AI jadi super rapi, spesifik, dan siap pakai!");
    });

    const btnCopySub1 = container.querySelector('#btnCopySub1Example');
    btnCopySub1?.addEventListener('click', (e) => {
      const promptText = `Sebagai Guru IPA SMP yang ramah, jelaskan fotosintesis dengan analogi memasak di dapur. Siswa usia 12 tahun, hindari istilah kimia rumit. Sajikan dalam 2 paragraf narasi dan 1 tabel analogi bahan vs hasil.`;
      this.copyToClipboard(promptText, 'Contoh prompt R-T-C-F berhasil disalin!', e.currentTarget);
    });

    // Card details & single explain clicks
    container.querySelectorAll('.card-explain-mini-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-explain');
        this.explainSinglePillar(type);
      });
    });

    container.querySelectorAll('.rtcf-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-card');
        this.openRTCFModal(type);
      });
    });

    // Mark sub1 complete after reviewing
    if (!this.state.progress.sub1) {
      this.state.progress.sub1 = true;
      this.saveSession();
      this.renderSidebar();
    }
  }

  openRTCFModal(type) {
    if (window.audioMgr) window.audioMgr.click();
    const modal = document.getElementById('genericModal');
    const titleEl = document.getElementById('genericModalTitle');
    const bodyEl = document.getElementById('genericModalBody');

    const details = {
      role: {
        title: '🎭 Pilar 1: Role (Peran AI)',
        html: `
          <p style="margin-bottom:12px; font-size:13.5px; line-height:1.5;">
            <strong>Mengapa Role penting?</strong> Model bahasa besar (LLM) dan generator AI dilatih dengan triliunan data dari berbagai profesi. Menetapkan <em>Role</em> mempersempit ruang probabilitas model untuk memilih gaya bahasa, kedalaman istilah, dan sudut pandang yang tepat.
          </p>
          <div style="background:#F0FDF4; border:1px solid #BBF7D0; padding:12px; border-radius:8px; margin-bottom:12px;">
            <strong>Contoh Penetapan Role Lintas Modalitas:</strong>
            <ul style="margin-left:20px; font-size:12.5px; margin-top:6px;">
              <li><strong>Teks:</strong> <em>"Sebagai Instruktur Pembimbing PKL SMK..."</em></li>
              <li><strong>Gambar:</strong> <em>"Sebagai Concept Artist 3D Studio Game..."</em></li>
              <li><strong>Musik:</strong> <em>"Sebagai Produser Musik Elektronik & Komposer Jingle..."</em></li>
              <li><strong>Koding:</strong> <em>"Sebagai Senior Software Engineer & Mentor Python..."</em></li>
            </ul>
          </div>
        `
      },
      task: {
        title: '🎯 Pilar 2: Task (Tugas Spesifik)',
        html: `
          <p style="margin-bottom:12px; font-size:13.5px; line-height:1.5;">
            <strong>Prinsip Task:</strong> Gunakan kata kerja operasional yang tegas (*action verbs*). Hindari instruksi ambigu seperti <em>"buatkan sesuatu yang bagus"</em>. Sebutkan tindakan apa yang harus dikerjakan secara eksplisit.
          </p>
          <div style="background:#EFF6FF; border:1px solid #BFDBFE; padding:12px; border-radius:8px; margin-bottom:12px;">
            <strong>Katalog Kata Kerja Kuat per Jenis AI:</strong>
            <ul style="margin-left:20px; font-size:12.5px; margin-top:6px;">
              <li><strong>Dokumen:</strong> <em>"Susun panduan dan kerangka laporan..."</em></li>
              <li><strong>Gambar:</strong> <em>"Rancang deskripsi visual poster kampanye keselamatan kerja..."</em></li>
              <li><strong>Musik:</strong> <em>"Ciptakan lirik lagu motivasi dengan rima berirama..."</em></li>
              <li><strong>Koding:</strong> <em>"Buatkan fungsi algoritma validasi format data..."</em></li>
            </ul>
          </div>
        `
      },
      context: {
        title: '🛡️ Pilar 3: Context & Constraints (Batasan)',
        html: `
          <p style="margin-bottom:12px; font-size:13.5px; line-height:1.5;">
            <strong>Menghindari Halusinasi & Ketidaktepatan:</strong> AI memerlukan batasan agar tidak mengarang bebas. Batasan mencakup apa yang <strong>boleh</strong>, apa yang <strong>dilarang keras</strong>, serta parameter teknis.
          </p>
          <div style="background:#FFFBEB; border:1px solid #FDE68A; padding:12px; border-radius:8px; margin-bottom:12px;">
            <strong>Contoh Konteks per Jenis AI:</strong>
            <ul style="margin-left:20px; font-size:12.5px; margin-top:6px;">
              <li><strong>Teks:</strong> <em>"Bahasa Indonesia formal, siswa usia 16 tahun, hindari istilah asing rumit."</em></li>
              <li><strong>Gambar:</strong> <em>"Pencahayaan studio neon, sudut kamera wide-angle, tanpa distorsi jari."</em></li>
              <li><strong>Musik:</strong> <em>"Tempo 124 BPM, genre Synthwave Pop, vokal energik anak muda."</em></li>
              <li><strong>Koding:</strong> <em>"Hanya modul bawaan Python, tangani error input kosong."</em></li>
            </ul>
          </div>
        `
      },
      format: {
        title: '📋 Pilar 4: Format (Bentuk Luaran)',
        html: `
          <p style="margin-bottom:12px; font-size:13.5px; line-height:1.5;">
            <strong>Standardisasi Hasil:</strong> Minta struktur yang siap diintegrasikan atau digunakan langsung tanpa perlu diedit ulang.
          </p>
          <div style="background:#FAF5FF; border:1px solid #E9D5FF; padding:12px; border-radius:8px; margin-bottom:12px;">
            <strong>Format Populer Lintas AI:</strong>
            <ul style="margin-left:20px; font-size:12.5px; margin-top:6px;">
              <li><strong>Teks:</strong> <em>Tabel Markdown berkolom atau struktur Bab berbutir.</em></li>
              <li><strong>Gambar:</strong> <em>Parameter Midjourney (--ar 16:9 --v 6.0) + palet warna hex.</em></li>
              <li><strong>Musik:</strong> <em>Tag bait [Verse 1], [Chorus], [Outro] + deskripsi style instrumen.</em></li>
              <li><strong>Koding:</strong> <em>Blok kode beranotasi komentar penjelasan tiap baris + unit test.</em></li>
            </ul>
          </div>
        `
      }
    };

    const item = details[type];
    if (item) {
      titleEl.textContent = item.title;
      bodyEl.innerHTML = item.html;
      modal.classList.add('open');
      if (window.robot) window.robot.setState('EXPLAIN', 2500);
    }
  }

    // ========================================================
  // SUB-UNIT 2: MINI GAME "PROMPT DOCTOR" (10 KASUS DRAG & DROP)
  // ========================================================
  getDoctorCases() {
    return [
      {
        id: 1,
        title: 'Kasus 1 · Poster K3 Bengkel Mesin',
        specialty: 'Desain & Manufaktur',
        patientQuote: '"Tolong buatin poster keselamatan buat bengkel dong"',
        symptom: 'Pasien Mengalami Ambiguitas Akut: Tanpa Peran, Tanpa Parameter Visual',
        story: 'Bengkel Pemesinan SMK membutuhkan poster edukasi K3 untuk mencegah kecelakaan serpihan logam panas mesin bubut CNC. Gambar harus bergaya 3D semi-realistis beresolusi tinggi dengan rasio 16:9.',
        cards: [
          { type: 'role', tag: 'Role', text: 'Concept Artist 3D & Desainer Grafis K3' },
          { type: 'task', tag: 'Task', text: 'Rancang deskripsi visual poster bahaya serpihan mesin bubut dan APD kacamata' },
          { type: 'context', tag: 'Context', text: 'Gaya 3D semi-realistis, pencahayaan dramatis, rasio 16:9, siswa mengenakan safety goggles' },
          { type: 'format', tag: 'Format', text: 'Prompt Midjourney V6 lengkap parameter (--ar 16:9 --v 6.0) + palet hex' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Tulis apa saja asal ada gambar mesin' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Sebagai orang yang sedang nongkrong di bengkel' }
        ],
        curedPrompt: 'Sebagai Concept Artist 3D & Desainer Grafis K3, rancang deskripsi visual poster bahaya serpihan mesin bubut dan APD kacamata. Konteks: Gaya 3D semi-realistis, pencahayaan dramatis, rasio 16:9, siswa mengenakan safety goggles. Format: Prompt Midjourney V6 lengkap parameter (--ar 16:9 --v 6.0) + palet hex.'
      },
      {
        id: 2,
        title: 'Kasus 2 · Validasi Form Login Python',
        specialty: 'Rekayasa Perangkat Lunak',
        patientQuote: '"Bikin kode Python buat periksa password"',
        symptom: 'Pasien Kehilangan Batasan Keamanan & Penanganan Error',
        story: 'Siswa PPLG sedang membangun modul autentikasi perpustakaan sekolah. Fungsi harus memverifikasi bahwa password minimal 8 karakter, memiliki kombinasi huruf besar, angka, dan simbol, serta menggunakan pustaka bawaan hashlib.',
        cards: [
          { type: 'role', tag: 'Role', text: 'Cybersecurity Engineer & Senior Python Developer' },
          { type: 'task', tag: 'Task', text: 'Buatkan fungsi validasi kekuatan password dan enkripsi hashing SHA-256' },
          { type: 'context', tag: 'Context', text: 'Pustaka standar hashlib, minimal 8 karakter, kombinasi huruf, angka, simbol' },
          { type: 'format', tag: 'Format', text: 'Skrip Python bersih PEP-8 beranotasi docstring lengkap + 4 skenario uji' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Bikin kode acak yang penting bisa jalan tanpa error' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Sebagai hacker pemula yang ingin membobol sistem' }
        ],
        curedPrompt: 'Sebagai Cybersecurity Engineer & Senior Python Developer, buatkan fungsi validasi kekuatan password dan enkripsi hashing SHA-256. Konteks: Pustaka standar hashlib, minimal 8 karakter, kombinasi huruf, angka, simbol. Format: Skrip Python bersih PEP-8 beranotasi docstring lengkap + 4 skenario uji.'
      },
      {
        id: 3,
        title: 'Kasus 3 · Konfigurasi VLAN Switch Cisco',
        specialty: 'Teknik Jaringan Komputer',
        patientQuote: '"Jelasin cara setting switch buat lab komputer"',
        symptom: 'Pasien Mengalami Ambiguitas Topologi & Ketiadaan Perintah CLI',
        story: 'Teknisi laboratorium TJKT ingin memisahkan traffic jaringan antara ruang guru (VLAN 10) dan lab siswa (VLAN 20) pada Switch Cisco 2960 menggunakan port trunking ke router.',
        cards: [
          { type: 'role', tag: 'Role', text: 'Network Administrator Bersertifikat Cisco & Dosen Jaringan' },
          { type: 'task', tag: 'Task', text: 'Susun langkah konfigurasi VLAN ID dan Port Trunking pada Switch Cisco' },
          { type: 'context', tag: 'Context', text: 'VLAN 10 (Guru: 192.168.10.0/24), VLAN 20 (Siswa: 192.168.20.0/24), Cisco IOS CLI' },
          { type: 'format', tag: 'Format', text: 'Daftar perintah CLI berurutan dalam blok kode + tabel alokasi port' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Colok kabel LAN sembarangan yang penting menyala' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Sebagai pengguna internet rumahan yang komplain koneksi' }
        ],
        curedPrompt: 'Sebagai Network Administrator Bersertifikat Cisco & Dosen Jaringan, susun langkah konfigurasi VLAN ID dan Port Trunking pada Switch Cisco. Konteks: VLAN 10 (Guru: 192.168.10.0/24), VLAN 20 (Siswa: 192.168.20.0/24), Cisco IOS CLI. Format: Daftar perintah CLI berurutan dalam blok kode + tabel alokasi port.'
      },
      {
        id: 4,
        title: 'Kasus 4 · Jingle Iklan Radio TeFa SMK',
        specialty: 'Produksi Audio & Musik',
        patientQuote: '"Buatin lirik lagu buat jualan keripik sekolah"',
        symptom: 'Pasien Kehilangan Struktur Lagu & Pengaturan Tempo Musik',
        story: 'Jurusan Tata Boga ingin meluncurkan produk keripik tempe "SMK Crunch" dan membutuhkan jingle iklan radio berdurasi 30 detik bergenre Upbeat Pop dengan lirik catchy untuk anak muda.',
        cards: [
          { type: 'role', tag: 'Role', text: 'Produser Musik Komersial & Copywriter Jingle Radio' },
          { type: 'task', tag: 'Task', text: 'Ciptakan lirik jingle iklan produk keripik tempe "SMK Crunch" durasi 30 detik' },
          { type: 'context', tag: 'Context', text: 'Genre Akustik Pop ceria, tempo 118 BPM, rima renyah bersemangat, target remaja' },
          { type: 'format', tag: 'Format', text: 'Struktur Suno AI: [Style], [Intro], [Verse], [Chorus Catchy], [Outro]' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Tulis puisi panjang tanpa irama dan melodi' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Sebagai pembeli yang memprotes harga makanan' }
        ],
        curedPrompt: 'Sebagai Produser Musik Komersial & Copywriter Jingle Radio, ciptakan lirik jingle iklan produk keripik tempe "SMK Crunch" durasi 30 detik. Konteks: Genre Akustik Pop ceria, tempo 118 BPM, rima renyah bersemangat, target remaja. Format: Struktur Suno AI: [Style], [Intro], [Verse], [Chorus Catchy], [Outro].'
      },
      {
        id: 5,
        title: 'Kasus 5 · Panduan Kerangka Laporan PKL',
        specialty: 'Manajemen Pendidikan Vokasi',
        patientQuote: '"Tolong buatin laporan magang saya dong"',
        symptom: 'Pasien Malas Total: Mengabaikan Sistematika BSNP & Refleksi Mandiri',
        story: 'Siswa SMK Fase F memerlukan struktur baku Laporan Akhir Praktik Kerja Lapangan (PKL) yang mencakup pendahuluan profil industri, kompetensi teknis yang dipelajari, kendala teknis, serta tabel log mingguan.',
        cards: [
          { type: 'role', tag: 'Role', text: 'Koordinator Pokja PKL SMK & Instruktur Industri Mitra' },
          { type: 'task', tag: 'Task', text: 'Susun panduan dan kerangka penulisan Laporan Akhir PKL bidang teknologi' },
          { type: 'context', tag: 'Context', text: 'Siswa SMK Fase F, bahasa Indonesia formal baku, fokus kompetensi kejuruan' },
          { type: 'format', tag: 'Format', text: 'Daftar berbutir terstruktur BAB I s.d. BAB IV + tabel ceklis lampiran' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Ketik apa saja yang kemarin sempat diingat' },
          { type: 'dummy', tag: 'Pengecoh', text: 'Sebagai siswa yang bolos magang dan panik' }
        ],
        curedPrompt: 'Sebagai Koordinator Pokja PKL SMK & Instruktur Industri Mitra, susun panduan dan kerangka penulisan Laporan Akhir PKL bidang teknologi. Konteks: Siswa SMK Fase F, bahasa Indonesia formal baku, fokus kompetensi kejuruan. Format: Daftar berbutir terstruktur BAB I s.d. BAB IV + tabel ceklis lampiran.'
      }
    ];
  }

  // Helper: Shuffle cards per case (cached per case id so order doesn't jump unexpectedly)
  getShuffledCaseCards(currentCase) {
    if (!this._caseCardsCache) this._caseCardsCache = {};
    if (!this._caseCardsCache[currentCase.id]) {
      const copy = currentCase.cards.map((c, i) => ({ ...c, originalIdx: i }));
      // Fisher-Yates shuffle
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      this._caseCardsCache[currentCase.id] = copy;
    }
    return this._caseCardsCache[currentCase.id];
  }

  isCardUsed(card) {
    if (!Array.isArray(this.doctorSlots)) return false;
    return this.doctorSlots.some(s => s && s.text === card.text);
  }

  switchDoctorCase(caseIndex) {
    const cases = this.getDoctorCases();
    if (caseIndex < 0 || caseIndex >= cases.length) return;
    this.doctorCaseIndex = caseIndex;
    const currentCase = cases[caseIndex];

    if (this.state.doctorSolvedCases[caseIndex]) {
      // Pre-fill with the winning RTCF sequence
      this.doctorSlots = [
        currentCase.cards.find(c => c.type === 'role') || null,
        currentCase.cards.find(c => c.type === 'task') || null,
        currentCase.cards.find(c => c.type === 'context') || null,
        currentCase.cards.find(c => c.type === 'format') || null
      ];
      this.doctorSlotStatus = ['correct', 'correct', 'correct', 'correct'];
    } else {
      this.doctorSlots = [null, null, null, null];
      this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
    }
    this.activeDoctorSlotIndex = 0;

    if (window.audioMgr) window.audioMgr.whoosh();
    this.renderSubUnit2(document.getElementById('viewContainer'));
  }

  renderSubUnit2(container) {
    const cases = this.getDoctorCases();
    if (this.doctorCaseIndex === undefined || this.doctorCaseIndex < 0 || this.doctorCaseIndex >= cases.length) {
      this.doctorCaseIndex = 0;
    }
    const currentCase = cases[this.doctorCaseIndex];
    const isCurrentCaseSolved = !!this.state.doctorSolvedCases[this.doctorCaseIndex];

    if (!Array.isArray(this.doctorSlots) || this.doctorSlots.length !== 4) {
      this.doctorSlots = [null, null, null, null];
    }
    if (!Array.isArray(this.doctorSlotStatus) || this.doctorSlotStatus.length !== 4) {
      this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
    }

    // If solved and empty, pre-fill with winning sequence
    if (isCurrentCaseSolved && this.doctorSlots.every(s => s === null)) {
      this.doctorSlots = [
        currentCase.cards.find(c => c.type === 'role') || null,
        currentCase.cards.find(c => c.type === 'task') || null,
        currentCase.cards.find(c => c.type === 'context') || null,
        currentCase.cards.find(c => c.type === 'format') || null
      ];
      this.doctorSlotStatus = ['correct', 'correct', 'correct', 'correct'];
    }

    const totalSolved = Object.keys(this.state.doctorSolvedCases).length;
    const totalScore = totalSolved * 20;
    this.state.minigameScore = totalScore;

    const shuffledCards = this.getShuffledCaseCards(currentCase);

    container.innerHTML = `
      <div class="section-header">
        <div class="section-tag">🩺 Sub-Unit 2 · Mini Game Edukasi Susun Urutan Prompt</div>
        <h2 class="section-title">Klinik "Prompt Doctor": 5 Studi Kasus Industri</h2>
        <p class="section-desc">Susun kepingan formula menjadi prompt terstruktur yang utuh! Baca dan sesuaikan urutan 4 pilar standar: <strong>Role ➔ Task ➔ Context ➔ Format</strong>.</p>
      </div>

      <!-- 5 Case Navigation Bar -->
      <div class="case-nav-bar">
        <div style="font-size:12px; font-weight:800; color:var(--ink); display:flex; align-items:center; gap:8px;">
          <span>🩺 Daftar Kasus Pasien:</span>
          <span style="color:var(--tech); font-size:11px;">(Kasus ${this.doctorCaseIndex + 1} dari 5)</span>
        </div>
        <div class="case-pills-list">
          ${cases.map((c, i) => {
            const isSolved = !!this.state.doctorSolvedCases[i];
            const isActive = i === this.doctorCaseIndex;
            return `
              <button class="case-pill-btn ${isActive ? 'active' : ''} ${isSolved ? 'solved' : ''}" 
                      data-case="${i}" title="${c.title} ${isSolved ? '(Sembuh ✓)' : ''}">
                ${isSolved ? '✓' : (i + 1)}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="game-container">
        <!-- Patient Case Card -->
        <div class="patient-card">
          <div class="patient-info">
            <div class="patient-avatar">🩹</div>
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="patient-symptom-title">${currentCase.title}</span>
                <span style="font-size:10px; font-weight:800; background:#EDF5FD; color:var(--tech); padding:2px 8px; border-radius:12px;">${currentCase.specialty}</span>
              </div>
              <div class="patient-quote">${currentCase.patientQuote}</div>
              <div class="case-story-card">
                <strong>📋 Deskripsi Studi Kasus:</strong> ${currentCase.story}
              </div>
            </div>
          </div>
          <div class="patient-score" style="min-width:110px;">
            <div style="font-size:11px; font-weight:800; color:var(--ink-2); text-transform:uppercase;">Total Pasien Sembuh</div>
            <div class="patient-score-num" id="doctorScoreDisplay">${totalSolved} / 5</div>
            <div style="font-size:11px; font-weight:700; color:var(--emerald);">(${totalScore} Poin)</div>
          </div>
        </div>

        <!-- 4 Sequential Target Assembly Slots -->
        <div class="slots-sequence-wrapper">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:800; color:var(--ink); display:flex; align-items:center; gap:6px;">
              🎯 Area Perakitan Susunan Prompt:
            </span>
            <span style="font-size:11px; font-weight:700; color:var(--tech);">
              Urutan Standar: Role ➔ Task ➔ Context ➔ Format
            </span>
          </div>

          <div class="slots-grid" id="slotsGrid">
            ${[0, 1, 2, 3].map(slotIdx => {
              const card = this.doctorSlots[slotIdx];
              const status = this.doctorSlotStatus[slotIdx];
              const isActiveTarget = this.activeDoctorSlotIndex === slotIdx && !card;
              const pillarHints = ['Pilar 1 · Role', 'Pilar 2 · Task', 'Pilar 3 · Context', 'Pilar 4 · Format'];
              const pillarSubs = ['Siapa Peran AI', 'Instruksi Tugas', 'Batasan & Skenario', 'Bentuk Luaran'];

              return `
                <div class="formula-slot ${card ? 'filled' : ''} ${status !== 'neutral' ? status : ''} ${isActiveTarget ? 'active-target' : ''}" 
                     data-slot="${slotIdx}"
                     draggable="${!!card}"
                     title="${card ? 'Tarik untuk menukar atau gunakan tombol geser' : 'Klik untuk memilih slot target'}">
                  
                  <div class="slot-header">
                    <span class="slot-number-badge">Urutan #${slotIdx + 1}</span>
                    <span class="slot-pillar-hint">${pillarHints[slotIdx]}</span>
                  </div>

                  ${card ? `
                    <div class="slot-content-text">${card.text}</div>
                    <div class="slot-actions-bar">
                      ${slotIdx > 0 ? `<button class="btn-slot-move" data-action="move-left" data-slot="${slotIdx}" title="Tukar dengan Urutan #${slotIdx}">◀</button>` : '<span></span>'}
                      <button class="btn-slot-remove" data-action="remove" data-slot="${slotIdx}" title="Lepas kepingan ini">✕ Lepas</button>
                      ${slotIdx < 3 ? `<button class="btn-slot-move" data-action="move-right" data-slot="${slotIdx}" title="Tukar dengan Urutan #${slotIdx + 2}">▶</button>` : '<span></span>'}
                    </div>
                  ` : `
                    <div class="slot-placeholder">
                      <div style="font-size:18px; margin-bottom:4px;">📥</div>
                      <strong style="color:var(--ink-2); display:block; font-size:11.5px; margin-bottom:2px;">${pillarSubs[slotIdx]}</strong>
                      <span>Tarik atau klik kepingan di bawah untuk menempatkan</span>
                    </div>
                  `}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Controls Action Bar -->
          <div class="doctor-action-bar">
            <div class="doctor-status-hint" id="doctorSequenceHint">
              ${isCurrentCaseSolved 
                ? `<span style="color:var(--emerald); font-weight:800;">✓ PASIEN TELAH SEMBUH! Resep prompt R-T-C-F berhasil disintesis sempurna.</span>` 
                : `<span>💡 <strong>Petunjuk:</strong> Tempatkan 4 kepingan yang tepat ke dalam Urutan #1 s.d #4, lalu klik <strong>"Periksa & Uji Susunan"</strong>!</span>`}
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-secondary" id="btnResetDoctorSlots" style="padding:7px 14px; font-size:12px;">🔄 Kosongkan</button>
              <button class="btn btn-primary" id="btnValidateDoctorSlots" style="padding:8px 18px; font-size:12.5px; font-weight:800; background:linear-gradient(135deg, var(--tech), #0855A5);">
                🩺 Periksa & Uji Susunan Prompt
              </button>
            </div>
          </div>
        </div>

        <!-- Cured Prescription Box (Displayed when current case is solved) -->
        ${isCurrentCaseSolved ? `
          <div class="cured-prompt-card">
            <div class="cured-header">
              <span>🎉 RESEP PROMPT DOKTER (KASUS ${this.doctorCaseIndex + 1} SEMBUH TOTAL):</span>
              <button class="btn-copy-pill highlight" id="btnCopyDoctorCured">📋 Salin Prompt Sembuh</button>
            </div>
            <div class="cured-body" id="doctorCuredText">"${currentCase.curedPrompt}"</div>
            <div style="display:flex; justify-content:flex-end; margin-top:10px;">
              ${this.doctorCaseIndex < 4 
                ? `<button class="btn btn-primary" id="btnNextCase" style="padding:8px 18px; font-size:12.5px;">Kasus Berikutnya ➔</button>` 
                : `<button class="btn btn-primary" id="btnFinishDoctor" style="padding:8px 18px; font-size:12.5px; background:var(--emerald);">🏆 Selesaikan Seluruh 5 Kasus</button>`}
            </div>
          </div>
        ` : ''}

        <!-- Card Bank for Drag & Drop / Click Selection -->
        <div class="card-bank-wrap">
          <div class="card-bank-header" style="display:flex; justify-content:space-between; align-items:center;">
            <span>💊 Apotek Kepingan Formula (Baca & Tentukan Kepingan yang Sesuai):</span>
            <span style="font-size:11px; color:var(--ink-2); font-weight:600; text-transform:none;">(Ada 4 kepingan baku R-T-C-F & 2 kepingan pengecoh)</span>
          </div>
          <div class="card-bank-grid" id="cardBankGrid">
            ${shuffledCards.map((c, i) => {
              const used = this.isCardUsed(c);
              return `
                <div class="pill-card ${used ? 'used' : ''}" 
                     draggable="${!used}" 
                     data-shuffled-idx="${i}"
                     title="${used ? 'Sudah ditempatkan dalam urutan' : 'Tarik atau klik untuk memasukkan ke dalam urutan'}">
                  <span class="pill-card-badge">🧩 Kepingan ${String.fromCharCode(65 + i)}</span>
                  <span style="flex:1; line-height:1.45;">${c.text}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // 1. Case Pill Selector click handlers
    container.querySelectorAll('.case-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-case'), 10);
        this.switchDoctorCase(idx);
      });
    });

    // 2. Setup Drag and Drop events (Between Bank & Slots, and Between Slots)
    this.setupDoctorDragAndDrop(container, shuffledCards);

    // 3. Card click from bank -> places into selected slot or first empty slot
    container.querySelectorAll('.pill-card:not(.used)').forEach(cardEl => {
      cardEl.addEventListener('click', () => {
        const sIdx = parseInt(cardEl.getAttribute('data-shuffled-idx'), 10);
        const cardData = shuffledCards[sIdx];
        this.placeCardIntoSlot(cardData);
      });
    });

    // 4. Slot Click / Move / Remove event handlers
    container.querySelectorAll('.formula-slot').forEach(slotEl => {
      slotEl.addEventListener('click', (e) => {
        const slotIdx = parseInt(slotEl.getAttribute('data-slot'), 10);

        // Move Left
        if (e.target.closest('[data-action="move-left"]')) {
          e.stopPropagation();
          if (slotIdx > 0) {
            const temp = this.doctorSlots[slotIdx];
            this.doctorSlots[slotIdx] = this.doctorSlots[slotIdx - 1];
            this.doctorSlots[slotIdx - 1] = temp;
            this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
            if (window.audioMgr) window.audioMgr.click();
            this.renderSubUnit2(document.getElementById('viewContainer'));
          }
          return;
        }

        // Move Right
        if (e.target.closest('[data-action="move-right"]')) {
          e.stopPropagation();
          if (slotIdx < 3) {
            const temp = this.doctorSlots[slotIdx];
            this.doctorSlots[slotIdx] = this.doctorSlots[slotIdx + 1];
            this.doctorSlots[slotIdx + 1] = temp;
            this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
            if (window.audioMgr) window.audioMgr.click();
            this.renderSubUnit2(document.getElementById('viewContainer'));
          }
          return;
        }

        // Remove
        if (e.target.closest('[data-action="remove"]')) {
          e.stopPropagation();
          this.doctorSlots[slotIdx] = null;
          this.doctorSlotStatus[slotIdx] = 'neutral';
          this.activeDoctorSlotIndex = slotIdx;
          if (window.audioMgr) window.audioMgr.click();
          this.renderSubUnit2(document.getElementById('viewContainer'));
          return;
        }

        // Click on empty slot -> select it as target
        if (!this.doctorSlots[slotIdx]) {
          this.activeDoctorSlotIndex = slotIdx;
          if (window.audioMgr) window.audioMgr.click();
          this.renderSubUnit2(document.getElementById('viewContainer'));
        }
      });
    });

    // 5. Reset button
    container.querySelector('#btnResetDoctorSlots')?.addEventListener('click', () => {
      this.doctorSlots = [null, null, null, null];
      this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
      this.activeDoctorSlotIndex = 0;
      if (window.audioMgr) window.audioMgr.click();
      this.renderSubUnit2(document.getElementById('viewContainer'));
    });

    // 6. Validate & Check Sequence button
    container.querySelector('#btnValidateDoctorSlots')?.addEventListener('click', () => {
      this.validateDoctorSequence();
    });

    // 7. Copy cured prompt button
    const btnCopyCured = container.querySelector('#btnCopyDoctorCured');
    btnCopyCured?.addEventListener('click', (e) => {
      const text = document.getElementById('doctorCuredText')?.innerText;
      if (text) {
        this.copyToClipboard(text.trim(), 'Resep prompt sembuh berhasil disalin!', e.currentTarget);
      }
    });

    // 8. Next case button
    const btnNext = container.querySelector('#btnNextCase');
    btnNext?.addEventListener('click', () => {
      this.switchDoctorCase(this.doctorCaseIndex + 1);
    });

    // 9. Finish all doctor cases button
    const btnFinish = container.querySelector('#btnFinishDoctor');
    btnFinish?.addEventListener('click', () => {
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
      this.showRobotDialogue("LUAR BIASA! Seluruh 5 kasus Prompt Doctor berhasil kamu sembuhkan dengan urutan R-T-C-F presisi!");
    });
  }

  placeCardIntoSlot(cardData) {
    if (!cardData) return;

    if (this.isCardUsed(cardData)) {
      this.showToast('Kepingan ini sudah ditempatkan dalam urutan!');
      return;
    }

    let targetIdx = this.activeDoctorSlotIndex;
    if (this.doctorSlots[targetIdx] !== null) {
      targetIdx = this.doctorSlots.findIndex(s => s === null);
    }

    if (targetIdx === -1) {
      this.showToast('Ke-4 urutan sudah terisi! Hapus atau geser kepingan untuk menyesuaikan urutan.');
      if (window.audioMgr) window.audioMgr.errorBuzz();
      return;
    }

    this.doctorSlots[targetIdx] = cardData;
    this.doctorSlotStatus[targetIdx] = 'neutral';
    
    const nextEmpty = this.doctorSlots.findIndex(s => s === null);
    this.activeDoctorSlotIndex = nextEmpty !== -1 ? nextEmpty : 0;

    if (window.audioMgr) window.audioMgr.click();
    this.renderSubUnit2(document.getElementById('viewContainer'));
  }

  setupDoctorDragAndDrop(container, shuffledCards) {
    let dragSource = null;

    container.querySelectorAll('.pill-card:not(.used)').forEach(cardEl => {
      cardEl.addEventListener('dragstart', (e) => {
        const sIdx = parseInt(cardEl.getAttribute('data-shuffled-idx'), 10);
        const cardData = shuffledCards[sIdx];
        dragSource = { type: 'bank', data: cardData };
        cardEl.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'bank', sIdx }));
        e.dataTransfer.effectAllowed = 'move';
      });

      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('dragging');
        container.querySelectorAll('.formula-slot').forEach(s => s.classList.remove('drag-over'));
      });
    });

    container.querySelectorAll('.formula-slot.filled').forEach(slotEl => {
      slotEl.addEventListener('dragstart', (e) => {
        const slotIdx = parseInt(slotEl.getAttribute('data-slot'), 10);
        const cardData = this.doctorSlots[slotIdx];
        if (!cardData) return;
        dragSource = { type: 'slot', data: cardData, fromSlotIndex: slotIdx };
        slotEl.classList.add('dragging');
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'slot', slotIdx }));
        e.dataTransfer.effectAllowed = 'move';
      });

      slotEl.addEventListener('dragend', () => {
        slotEl.classList.remove('dragging');
        container.querySelectorAll('.formula-slot').forEach(s => s.classList.remove('drag-over'));
      });
    });

    container.querySelectorAll('.formula-slot').forEach(slotEl => {
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        slotEl.classList.add('drag-over');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drag-over');
      });

      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        slotEl.classList.remove('drag-over');
        const targetSlotIdx = parseInt(slotEl.getAttribute('data-slot'), 10);

        if (!dragSource || !dragSource.data) {
          try {
            const raw = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (raw.type === 'bank') dragSource = { type: 'bank', data: shuffledCards[raw.sIdx] };
            if (raw.type === 'slot') dragSource = { type: 'slot', data: this.doctorSlots[raw.slotIdx], fromSlotIndex: raw.slotIdx };
          } catch (err) {}
        }

        if (!dragSource || !dragSource.data) return;

        if (dragSource.type === 'bank') {
          this.doctorSlots[targetSlotIdx] = dragSource.data;
          this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
        } else if (dragSource.type === 'slot') {
          const fromIdx = dragSource.fromSlotIndex;
          if (fromIdx !== targetSlotIdx) {
            const temp = this.doctorSlots[targetSlotIdx];
            this.doctorSlots[targetSlotIdx] = this.doctorSlots[fromIdx];
            this.doctorSlots[fromIdx] = temp;
            this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
          }
        }

        if (window.audioMgr) window.audioMgr.click();
        this.renderSubUnit2(document.getElementById('viewContainer'));
      });
    });
  }

  validateDoctorSequence() {
    const cases = this.getDoctorCases();
    const currentCase = cases[this.doctorCaseIndex];

    const filledCount = this.doctorSlots.filter(Boolean).length;
    if (filledCount < 4) {
      this.showToast('⚠️ Masih ada urutan yang kosong! Tempatkan 4 kepingan formula.');
      if (window.audioMgr) window.audioMgr.errorBuzz();
      if (window.robot) window.robot.setState('CONFUSE', 2000);
      this.showRobotDialogue("Masih ada urutan yang kosong! Lengkapi ke-4 urutan pilar R-T-C-F terlebih dahulu.");
      return;
    }

    const s0 = this.doctorSlots[0];
    const s1 = this.doctorSlots[1];
    const s2 = this.doctorSlots[2];
    const s3 = this.doctorSlots[3];

    // Check for distractor / dummy cards
    const dummyIdx = this.doctorSlots.findIndex(s => s && s.type === 'dummy');
    if (dummyIdx !== -1) {
      this.doctorSlotStatus = ['neutral', 'neutral', 'neutral', 'neutral'];
      this.doctorSlotStatus[dummyIdx] = 'wrong';
      if (window.audioMgr) window.audioMgr.errorBuzz();
      if (window.robot) window.robot.setState('CONFUSE', 2500);
      this.showRobotDialogue(`Urutan #${dummyIdx + 1} keliru! Kepingan itu adalah kalimat pengecoh/ambigu yang tidak sesuai standar industri. Ganti kepingan tersebut!`);
      this.renderSubUnit2(document.getElementById('viewContainer'));
      return;
    }

    const ok0 = s0?.type === 'role';
    const ok1 = s1?.type === 'task';
    const ok2 = s2?.type === 'context';
    const ok3 = s3?.type === 'format';

    this.doctorSlotStatus = [
      ok0 ? 'correct' : 'wrong',
      ok1 ? 'correct' : 'wrong',
      ok2 ? 'correct' : 'wrong',
      ok3 ? 'correct' : 'wrong'
    ];

    if (ok0 && ok1 && ok2 && ok3) {
      // Perfect RTCF Order!
      this.state.doctorSolvedCases[this.doctorCaseIndex] = true;
      const totalSolved = Object.keys(this.state.doctorSolvedCases).length;
      this.state.minigameScore = totalSolved * 20;
      if (totalSolved >= 5) {
        this.state.progress.sub2 = true;
      }
      this.saveSession();
      this.renderSidebar();

      if (window.confetti) window.confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      if (window.audioMgr) {
        window.audioMgr.successChime();
        setTimeout(() => window.audioMgr.coinDing(), 400);
      }
      if (window.robot) window.robot.setState('CHEER', 3500);

      if (totalSolved >= 10) {
        this.showRobotDialogue("SEMPURNA! Seluruh 5 kasus Prompt Doctor berhasil kamu sembuhkan dengan urutan R-T-C-F yang presisi!");
      } else {
        this.showRobotDialogue(`HORE! Kasus ${this.doctorCaseIndex + 1} sembuh total! Urutan pilar R-T-C-F tersusun tepat!`);
      }
    } else {
      if (window.audioMgr) window.audioMgr.errorBuzz();
      if (window.robot) window.robot.setState('CONFUSE', 2500);

      if (!ok0) {
        this.showRobotDialogue("Urutan #1 belum tepat! Awali prompt dengan menentukan Siapa Peran (Role) AI.");
      } else if (!ok1) {
        this.showRobotDialogue("Urutan #2 belum tepat! Di urutan kedua, cantumkan Instruksi Tugas (Task) utama.");
      } else if (!ok2) {
        this.showRobotDialogue("Urutan #3 belum tepat! Di urutan ketiga, berikan Konteks & Batasan (Context) spesifik.");
      } else if (!ok3) {
        this.showRobotDialogue("Urutan #4 belum tepat! Akhiri urutan prompt dengan instruksi Format luaran hasil.");
      }
    }

    this.renderSubUnit2(document.getElementById('viewContainer'));
  }

    // ========================================================
  // SUB-UNIT 3: ROBOPROMPT STUDIO (INTEGRASI GROQ AI & FORMULA R-T-C-F)
  // ========================================================
  renderSubUnit3(container) {
    container.innerHTML = `
      <div class="section-header">
        <div class="section-tag">🧪 Sub-Unit 3 · Praktik Studio KKA</div>
        <h2 class="section-title">RoboPrompt Studio: Perancang Prompt Formula R-T-C-F</h2>
        <p class="section-desc">Aplikasi ini dirancang khusus untuk membantumu menyusun prompt yang terstruktur dan berkualitas tinggi sesuai formula <strong>R-T-C-F (Role, Task, Context, Format)</strong>. Masukkan pilar-pilar di bawah, lalu klik <strong>⚡ Optimalkan dengan AI</strong> untuk menghasilkan prompt siap pakai yang sempurna!</p>
      </div>

      <!-- Formula Standard Banner -->
      <div class="modality-banner" id="modalityBanner">
        <div class="modality-desc">
          <div><strong>🎯 Formula Standar Vokasi R-T-C-F:</strong> <strong>R</strong>ole (Peran Ahli) • <strong>T</strong>ask (Tugas Spesifik) • <strong>C</strong>ontext & Constraints (Batasan & Aturan) • <strong>F</strong>ormat (Bentuk Luaran).</div>
          <div style="margin-top:3px; color:var(--ink-2);"><strong>💡 Kunci Prompt Berkualitas:</strong> Berikan instruksi yang jelas pada keempat pilar untuk meminimalkan halusinasi model AI dan menghasilkan respons yang presisi.</div>
        </div>
      </div>

      <div class="studio-layout">
        <!-- Pure User Formula Builder -->
        <div class="studio-form-card">
          <div class="studio-header-wrap">
            <span style="font-size:13.5px; font-weight:800; color:var(--ink);">
              🛠️ Formula Prompt Builder (R-T-C-F)
            </span>
            <span style="font-size:11px; font-weight:700; color:var(--tech); background:#EDF5FD; padding:4px 10px; border-radius:12px; border:1px solid #CDE2F8;">
              PPLG SMKN 1 Bawang
            </span>
          </div>

          <div class="field-group">
            <label class="field-label">🎭 1. Role (Peran / Keahlian Persona AI)</label>
            <input type="text" class="field-input" id="inpRole" placeholder="Misal: Senior Fullstack Developer & AI Engineer di Industri Teknologi" />
          </div>

          <div class="field-group">
            <label class="field-label">🎯 2. Task (Tugas Spesifik yang Dikerjakan)</label>
            <input type="text" class="field-input" id="inpTask" placeholder="Misal: Buatkan fungsi autentikasi login JWT menggunakan Node.js dan Express" />
          </div>

          <div class="field-group">
            <label class="field-label">🛡️ 3. Context & Constraints (Batasan & Aturan Operasional)</label>
            <input type="text" class="field-input" id="inpContext" placeholder="Misal: Sertakan hashing password bcrypt, penanganan try-catch error, dan expired token 1 jam" />
          </div>

          <div class="field-group">
            <label class="field-label">📋 4. Format (Bentuk Luaran yang Diinginkan)</label>
            <input type="text" class="field-input" id="inpFormat" placeholder="Misal: Kode TypeScript bersih dengan komentar bahasa Indonesia dan contoh respon JSON" />
          </div>

          <div style="display:flex; gap:10px; margin-top:14px;">
            <button class="btn btn-primary" id="btnSynthesizePrompt" style="flex:1; justify-content:center; padding:12px 16px; font-weight:800;">
              ⚡ Optimalkan dengan AI
            </button>
            <button class="btn btn-secondary" id="btnCopyPrompt" title="Salin formula R-T-C-F mentah" style="padding:12px 14px; font-weight:700; white-space:nowrap;">
              📋 Salin Formula Mentah
            </button>
          </div>
        </div>

        <!-- Generated Structured Prompt Result Card -->
        <div class="studio-preview-card">
          <div class="meter-box">
            <div class="meter-ring" id="meterRing" style="--meter-pct:0%;">
              <div class="meter-inner" id="meterText">0%</div>
            </div>
            <div>
              <div style="font-size:13px; font-weight:800; color:var(--ink);">Indikator Kelengkapan Formula</div>
              <div style="font-size:11.5px; color:var(--ink-2); margin-top:2px;" id="meterStatus">Ketik pilar Role, Task, Context, & Format di samping.</div>
            </div>
          </div>

          <div class="console-box" id="consoleOutput">
            <div id="consoleText" style="color:#94A3B8; font-size:13px; line-height:1.6;">Lengkapi pilar formulamu di samping, lalu klik tombol <strong>"⚡ Optimalkan dengan AI"</strong> untuk menyatukan dan menghasilkan prompt siap pakai yang sempurna...</div>
          </div>

          <button class="btn btn-primary" id="btnCopyGeneratedPrompt" style="width:100%; justify-content:center; padding:12px 20px; font-size:13.5px; font-weight:800; background:linear-gradient(135deg, #0A6FD6, #00A651);">
            📋 Salin Prompt
          </button>
        </div>
      </div>
    `;

    // 1. Formula input listeners
    ['inpRole', 'inpTask', 'inpContext', 'inpFormat'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.updateStudioMeter());
    });

    // 2. Optimize with AI button
    container.querySelector('#btnSynthesizePrompt')?.addEventListener('click', () => {
      this.executeAIRequest();
    });

    // 3. Copy Raw Formula Prompt button
    container.querySelector('#btnCopyPrompt')?.addEventListener('click', (e) => {
      const role = document.getElementById('inpRole')?.value.trim() || '';
      const task = document.getElementById('inpTask')?.value.trim() || '';
      const context = document.getElementById('inpContext')?.value.trim() || '';
      const format = document.getElementById('inpFormat')?.value.trim() || '';

      if (!role && !task && !context && !format) {
        this.showToast('Isi formula terlebih dahulu sebelum menyalin!', '⚠️');
        return;
      }

      const fullPrompt = `Sebagai ${role || '(Role)'}, tugasmu adalah ${task || '(Task)'}.\n\nKonteks & Batasan:\n${context || '(Context)'}\n\nFormat Output:\n${format || '(Format)'}`;
      this.copyToClipboard(fullPrompt, 'Formula prompt R-T-C-F dasar berhasil disalin!', e.currentTarget);
    });

    // 4. Copy Generated Prompt (Console header button & Big bottom button)
    const handleCopyGenerated = (e) => {
      const consoleEl = document.getElementById('consoleText');
      if (!consoleEl) return;
      const finalPromptEl = document.getElementById('finalPromptText');
      
      let textToCopy = '';
      if (finalPromptEl) {
        textToCopy = finalPromptEl.innerText || finalPromptEl.textContent;
      } else {
        const rawText = consoleEl.innerText || consoleEl.textContent;
        if (rawText.includes('Lengkapi pilar formulamu') || rawText.includes('sedang menyusun prompt')) {
          this.showToast('Optimalkan formula terlebih dahulu sebelum menyalin!', '⚠️');
          return;
        }
        textToCopy = rawText.trim();
      }

      if (!textToCopy) {
        this.showToast('Prompt belum tersedia untuk disalin!', '⚠️');
        return;
      }

      this.copyToClipboard(textToCopy.trim(), 'Prompt hasil optimasi berhasil disalin ke clipboard!', e.currentTarget);
      this.showRobotDialogue("Prompt formula R-T-C-F siap pakai telah disalin! Kamu bisa langsung menggunakannya di ChatGPT, Groq, atau Claude.");
    };

    container.querySelector('#btnCopyGeneratedPrompt')?.addEventListener('click', handleCopyGenerated);

    this.updateStudioMeter();
  }

  updateStudioMeter() {
    const r = document.getElementById('inpRole')?.value.trim();
    const t = document.getElementById('inpTask')?.value.trim();
    const c = document.getElementById('inpContext')?.value.trim();
    const f = document.getElementById('inpFormat')?.value.trim();

    let count = 0;
    if (r) count++;
    if (t) count++;
    if (c) count++;
    if (f) count++;

    const pct = count * 25;
    const ring = document.getElementById('meterRing');
    const text = document.getElementById('meterText');
    const status = document.getElementById('meterStatus');

    if (ring) ring.style.setProperty('--meter-pct', `${pct}%`);
    if (text) text.textContent = `${pct}%`;
    if (status) {
      if (pct === 100) {
        status.textContent = 'Formula sempurna! 4 pilar lengkap terisi.';
        status.style.color = '#10B981';
      } else {
        status.textContent = `${count} dari 4 pilar terisi (${pct}%).`;
        status.style.color = 'var(--ink-2)';
      }
    }
  }

  async executeAIRequest() {
    const role = document.getElementById('inpRole')?.value.trim() || '';
    const task = document.getElementById('inpTask')?.value.trim() || '';
    const context = document.getElementById('inpContext')?.value.trim() || '';
    const format = document.getElementById('inpFormat')?.value.trim() || '';

    // Validate that student has inputted at least Role or Task
    if (!role && !task) {
      this.showToast('Silakan masukkan pilar Role atau Task terlebih dahulu!', '⚠️');
      this.showRobotDialogue("Pilar formulamu masih kosong! Ketik kata atau kalimat untuk pilar Role dan Task.");
      document.getElementById('inpRole')?.focus();
      return;
    }

    const consoleText = document.getElementById('consoleText');
    if (!consoleText) return;

    if (window.audioMgr) window.audioMgr.whoosh();
    if (window.robot) window.robot.setState('EXPLAIN', 6000);

    consoleText.innerHTML = `
      <div class="gemini-loading-anim">
        <div class="gemini-spinner"></div>
        <div>
          <div style="font-weight:700; color:#38BDF8;">⚡ AI sedang menyusun prompt...</div>
          <div style="font-size:11px; color:#94A3B8; margin-top:3px;">Mempersatukan pilar R-T-C-F menjadi satu prompt profesional berstandar industri.</div>
        </div>
      </div>
    `;

    const payload = {
      role,
      task,
      context,
      format
    };

    let resultText = '';
    let usedSource = 'Groq AI';
    let cloudErrorMsg = '';

    try {
      // 1. Serverless endpoint call (/api/ai or /api/gemini)
      let res = null;
      const endpoint = this.serverlessEndpoint || '/api/ai';
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res && (res.status === 404 || !res.ok) && endpoint !== '/.netlify/functions/gemini') {
          const fallbackRes = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(() => null);
          if (fallbackRes && fallbackRes.ok) {
            res = fallbackRes;
          }
        }

        if (res) {
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.success && json.text) {
            resultText = json.text;
            usedSource = `${json.provider || 'Groq AI'} (${json.model || 'gpt-oss-120b'})`;
          } else {
            cloudErrorMsg = json.message || `Status ${res.status}`;
          }
        }
      } catch (err) {
        cloudErrorMsg = err.message || 'Koneksi Cloud Serverless gagal';
        res = null;
      }

      // 2. Direct browser call to Groq API (bypasses serverless if local file:/// or serverless error)
      if (!resultText) {
        try {
          const directText = await this.callGroqDirect(role, task, context, format);
          if (directText) {
            resultText = directText;
            usedSource = 'Groq AI';
          }
        } catch (e) {
          console.warn('Direct Groq call failed:', e);
        }
      }

      // 3. Fallback: Intelligent educational simulation if completely offline
      let isFallback = false;
      if (!resultText) {
        resultText = this.getOfflineSmartSimulation(role, task, context, format);
        usedSource = 'Simulator Edukasi R-T-C-F';
        isFallback = true;
      }

      // Clean wrapping markdown code blocks if the AI model enclosed the prompt in ```
      let cleanPrompt = resultText.trim();
      if (cleanPrompt.startsWith('```') && cleanPrompt.endsWith('```')) {
        cleanPrompt = cleanPrompt.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
      }

      consoleText.innerHTML = `
        <div id="finalPromptText" style="color:#F8FAFC; line-height:1.75; font-size:13.5px; white-space:pre-wrap; font-family:'Fira Code', 'Segoe UI', monospace, sans-serif;">${this.escapeHtml(cleanPrompt)}</div>
      `;

      if (isFallback) {
        if (window.audioMgr) window.audioMgr.click();
        if (window.robot) window.robot.setState('EXPLAIN', 3500);
        if (cloudErrorMsg) {
          this.showToast('Simulasi Cerdas (' + cloudErrorMsg + ')', 'ℹ️');
          this.showRobotDialogue("Mode Simulasi: " + cloudErrorMsg);
        } else {
          this.showToast('Prompt berhasil dirangkai dengan simulasi cerdas!', 'ℹ️');
          this.showRobotDialogue("Formula R-T-C-F berhasil dirangkai menjadi teks master prompt siap pakai!");
        }
      } else {
        if (window.audioMgr) window.audioMgr.successChime();
        if (window.robot) window.robot.setState('CHEER', 3500);
        this.showRobotDialogue("Luar biasa! Prompt R-T-C-F berhasil disempurnakan oleh " + usedSource + " dan siap digunakan. Klik tombol 'Salin Prompt' di bawah!");
        this.showToast('Prompt berhasil dioptimalkan oleh AI!', '⚡');
      }

      // Update Sub-Unit 3 progress
      this.state.progress.sub3 = true;
      this.saveSession();
      this.renderSidebar();

    } catch (err) {
      console.error('AI call error:', err);
      // Try direct Groq in catch as well before offline simulation
      let directText = null;
      try {
        directText = await this.callGroqDirect(role, task, context, format);
      } catch (e) {}

      const promptText = directText || this.getOfflineSmartSimulation(role, task, context, format);
      consoleText.innerHTML = `
        <div id="finalPromptText" style="color:#F8FAFC; line-height:1.75; font-size:13.5px; white-space:pre-wrap; font-family:'Fira Code', 'Segoe UI', monospace, sans-serif;">${this.escapeHtml(promptText)}</div>
      `;
      if (directText) {
        if (window.audioMgr) window.audioMgr.successChime();
        if (window.robot) window.robot.setState('CHEER', 3500);
        this.showToast('Prompt berhasil dioptimalkan oleh AI!', '⚡');
        this.showRobotDialogue("Luar biasa! Prompt R-T-C-F berhasil disempurnakan oleh AI dan siap digunakan!");
      } else {
        if (window.audioMgr) window.audioMgr.click();
        if (window.robot) window.robot.setState('EXPLAIN', 3500);
        this.showToast('Mode Simulasi Aktif (Gagal terhubung ke AI)', 'ℹ️');
        this.showRobotDialogue("Formula R-T-C-F berhasil dirangkai menggunakan simulator cerdas!");
      }
      this.state.progress.sub3 = true;
      this.saveSession();
      this.renderSidebar();
    }
  }

  async callGroqDirect(role, task, promptContext, format) {
    const key = (typeof localStorage !== 'undefined' && (localStorage.getItem('roboprompt_groq_key') || localStorage.getItem('groq_api_key'))) || '';
    if (!key || key.length < 10) return null;
    const systemInstruction = `Kamu adalah AI Master Prompt Engineer profesional di Kurikulum Vokasi SMK Koding & Kecerdasan Artifisial (PPLG SMKN 1 Bawang).
Tugas utamamu adalah: MENYEMPURNAKAN DAN MERANGKAI 4 pilar input siswa (Role, Task, Context, Format) menjadi SATU MASTER PROMPT R-T-C-F tingkat industri yang siap disalin oleh siswa untuk digunakan pada model AI lain.

PERINGATAN PALING KRUSIAL (DILARANG KERAS):
1. JANGAN PERNAH MENJAWAB, MEMBUATKAN KODE, ATAU MENGEKSEKUSI TUGAS DARI SISWA!
   - Contoh Salah: Jika siswa menulis "Task: Buat kode login", kamu malah membuat kode program login. INI SALAH BESAR!
   - Contoh Benar: Kamu menulis teks rancangan prompt yang memerintahkan AI untuk membuat kode login tersebut.
2. JANGAN tambahkan salam pembuka, kata pengantar, atau kata penutup.
3. JANGAN membuat judul/heading evaluasi seperti "### 1. Evaluasi" atau "### 2. Formula".
4. Tuliskan HANYA teks prompt final siap pakai dengan struktur baku formula R-T-C-F:

Sebagai [Role yang dispesifikasikan dan diberi bobot persona ahli], tugas utamamu adalah [Task yang dijabarkan secara jelas dan operasional dengan kata kerja terukur].

Konteks Operasional & Batasan Kualitas:
- [Context & Batasan teknis siswa yang disempurnakan dengan standar industri vokasi PPLG]
- [Aturan kepatuhan, keamanan data, clean code, atau pencegahan halusinasi]

Format Output yang Diwajibkan:
- [Format luaran yang terstruktur rapi, presisi, dan mudah diimplementasikan]`;

    const userPrompt = `Input pilar formula R-T-C-F siswa:
- Role (Peran): ${role || 'Spesialis Rekayasa Perangkat Lunak & AI'}
- Task (Tugas): ${task || 'Selesaikan implementasi solusi secara komprehensif'}
- Context & Constraints (Konteks & Batasan): ${promptContext || 'Terapkan standar industri terbaik, clean code, dan mitigasi error'}
- Format (Format Luaran): ${format || 'Sajikan terstruktur, sistematis, dan terperinci'}

Rangkai sekarang menjadi SATU teks Master Prompt R-T-C-F siap pakai:`;

    const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (const model of models) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 9000);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
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

        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const text = json.choices?.[0]?.message?.content;
          if (text) return text;
        }
      } catch (e) {
        // Continue to next model
      }
    }
    return null;
  }

  getOfflineSmartSimulation(role, task, context, format) {
    const r = role || 'Senior Software Engineer & AI Specialist';
    const t = task || 'rancang arsitektur dan implementasi solusi teknis secara komprehensif';
    const c = context || 'Gunakan standar industri terbaik, ikuti prinsip clean code, tangani seluruh kemungkinan edge cases, dan terapkan praktik keamanan data';
    const f = format || 'Sajikan penjelasan terstruktur disertai implementasi kode lengkap yang bersih dan panduan pengujian sistematis';

    return `Sebagai ${r}, tugas utamamu adalah: ${t}.

Konteks Operasional & Batasan Kualitas:
- ${c}
- Terapkan alur pemikiran analitis langkah demi langkah (chain-of-thought) untuk memverifikasi setiap asumsi teknis.
- Pastikan solusi yang diberikan efisien, minim halusinasi, dan sesuai dengan standar kejuruan terkini.

Format Output yang Diwajibkan:
- ${f}
- Berikan dokumentasi dan penjelasan yang jelas pada setiap komponen utama.`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatGeminiMarkdown(md) {
    if (!md) return '';
    let html = md
      // Escape HTML brackets
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Code blocks
      .replace(/\`\`\`([a-zA-Z]*)\n([\s\S]*?)\`\`\`/g, (match, lang, code) => {
        return `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`;
      })
      // Inline code
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h3>$1</h3>')
      // Bold & Italic
      .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Lists
      .replace(/^\s*[-*] (.*$)/gim, '<li>$1</li>')
      // Newlines
      .replace(/\n\n/g, '<p></p>')
      .replace(/\n/g, '<br>');

    // Wrap adjacent <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>(\s*<br>)?)+/g, (match) => '<ul>' + match + '</ul>').replace(/<\/li>\s*<br>/g, '</li>');
    return html;
  }

  // ========================================================
  // SUB-UNIT 4: EVALUASI & KUIS CERDAS (25 SOAL, KKTP >= 80)
  // ========================================================
  getQuizQuestions() {
    return [
      {
        q: '1. Seorang siswa SMK ingin menggunakan AI Generator Gambar (Midjourney / DALL-E) untuk membuat poster K3 bengkel mesin. Di bagian formula manakah ia harus mencantumkan "gaya 3D Pixar, pencahayaan dramatis, dan rasio aspek 16:9"?',
        options: [
          'Role (Peran AI)',
          'Context & Constraints (Batasan & Parameter)',
          'Task (Tugas Inti)',
          'Format (Bentuk Luaran Dokumen)'
        ],
        correct: 1,
        explanation: 'Parameter visual seperti gaya pencahayaan, sudut kamera visual, dan rasio aspek (--ar 16:9) masuk ke dalam pilar Context (Konteks & Batasan) untuk membatasi ruang lingkup rendering AI.'
      },
      {
        q: '2. Mengapa penetapan Role (Peran) pada awal prompt sangat krusial dalam interaksi dengan model AI Generatif modern?',
        options: [
          'Agar AI merespons lebih cepat dalam hitungan milidetik',
          'Untuk mengunci ruang probabilitas gaya bahasa, sudut pandang ahli, dan kedalaman terminologi model',
          'Karena AI tidak dapat memproses instruksi tanpa nama profesi manusia',
          'Agar sistem keamanan AI tidak mendeteksi prompt sebagai spam'
        ],
        correct: 1,
        explanation: 'Role (Peran) memfokuskan bobot probabilitas model ke korpus keahlian tertentu (misal: gaya programmer senior vs jurnalis), menghasilkan respons yang jauh lebih berbobot dan akurat.'
      },
      {
        q: '3. Pada perancangan lagu menggunakan AI Musik (Suno / Udio), penulisan tag penanda seperti "[Verse 1]", "[Chorus]", "[Guitar Solo]", dan "[Outro]" ditempatkan pada pilar...',
        options: [
          'Format (Bentuk & Struktur Luaran)',
          'Role (Peran)',
          'Task (Tugas Inti)',
          'Negative Prompt'
        ],
        correct: 0,
        explanation: 'Tag struktur lagu adalah implementasi pilar Format yang mengatur arsitektur pembagian bait dan progresi komposisi musik yang dihasilkan oleh model AI audio.'
      },
      {
        q: '4. Apa implikasi nyata dari prinsip "Garbage In, Garbage Out" (GIGO) dalam konteks rekayasa prompt (prompt engineering)?',
        options: [
          'Komputer akan mengalami kerusakan fisik jika prompt mengandung kata-kata kotor',
          'Prompt yang ambigu, minim konteks, dan tanpa struktur akan menghasilkan keluaran AI yang ngawur, bias, atau halusinasi',
          'AI akan otomatis menghapus file cache yang tidak berguna di memori browser',
          'Model AI akan menolak memproses teks jika ada salah ketik tanda baca'
        ],
        correct: 1,
        explanation: 'Prinsip GIGO menegaskan bahwa kualitas output generatif AI berbanding lurus secara mutlak dengan presisi dan kejelasan instruksi input yang diberikan pengguna.'
      },
      {
        q: '5. Siswa RPL meminta AI membuat fungsi autentikasi login dengan kriteria: "Gunakan bahasa Python, library hashlib bawaan, patuhi PEP-8, dan tangani error password kosong". Instruksi kriteria tersebut merupakan bagian dari...',
        options: [
          'Task (Tugas)',
          'Role (Peran)',
          'Context & Constraints (Batasan & Konteks)',
          'Format (Format Keluaran)'
        ],
        correct: 2,
        explanation: 'Ketentuan teknis, batasan pustaka (standar library), gaya penulisan kode (PEP-8), serta penanganan kondisi error tergolong dalam pilar Context & Constraints.'
      },
      {
        q: '6. Mengapa Large Language Model (LLM) seperti ChatGPT atau Groq terkadang menghasilkan jawaban fakta yang salah tetapi terdengar sangat meyakinkan ("halusinasi")?',
        options: [
          'Karena AI terhubung langsung ke satelit cuaca yang mengalami gangguan',
          'Karena LLM memprediksi urutan kata yang paling mungkin secara statistik, bukan merujuk basis data kebenaran mutlak',
          'Karena kapasitas hard disk server kecerdasan buatan sedang penuh',
          'Karena AI sengaja ingin mengecoh dan menguji kepintaran manusia'
        ],
        correct: 1,
        explanation: 'LLM bekerja berdasarkan kalkulasi probabilitas kemunculan kata berikutnya (token prediction). Tanpa konteks dan sumber referensi yang jelas, model rentan mengarang informasi (halusinasi).'
      },
      {
        q: '7. Di antara kalimat berikut, manakah formulasi pilar Task (Tugas) yang paling spesifik, operasional, dan bebas dari ambiguitas?',
        options: [
          '"Tolong dong buatkan sesuatu yang keren tentang jaringan komputer."',
          '"Bikin laporan praktikum yang bagus ya biar dapet nilai sepuluh."',
          '"Susun 5 langkah konfigurasi VLAN ID dan Port Trunking pada Switch Cisco 2960."',
          '"Jelaskan semua materi komputer dari awal sampai akhir."'
        ],
        correct: 2,
        explanation: 'Pilar Task yang ideal harus memuat kata kerja operasional terukur (susun), objek spesifik (5 langkah konfigurasi VLAN ID dan Trunking), dan target perangkat (Switch Cisco 2960).'
      },
      {
        q: '8. Teknik prompt di mana kita memberikan 2 hingga 3 contoh pasangan masukan-keluaran (input-output) di dalam prompt sebelum meminta AI menyelesaikan kasus baru disebut...',
        options: [
          'Zero-Shot Prompting',
          'Few-Shot Prompting',
          'Negative Prompting',
          'Brute-Force Prompting'
        ],
        correct: 1,
        explanation: 'Few-Shot Prompting adalah teknik menyertakan beberapa contoh demonstrasi pola respons yang diharapkan di dalam prompt agar AI meniru pola tersebut secara presisi.'
      },
      {
        q: '9. Pada AI generator gambar seperti Midjourney, parameter "--no text watermark low-res blurry" berfungsi sebagai...',
        options: [
          'Role Prompt untuk menentukan profesi pelukis',
          'Negative Prompt untuk melarang kemunculan elemen tertentu pada hasil render',
          'Format Prompt untuk mengatur ukuran file gambar dalam kilobyte',
          'Task Prompt untuk mengubah warna kanvas dasar'
        ],
        correct: 1,
        explanation: 'Negative Prompt digunakan untuk memberikan batasan negatif (exclusion), yaitu elemen visual apa saja yang diinstruksikan untuk tidak boleh dimunculkan oleh AI.'
      },
      {
        q: '10. Saat meminta AI presentasi (seperti Gamma atau Canva Magic) merangkum materi PKL, instruksi: "Bagi materi menjadi 5 slide dengan rasio 16:9 berformat Bullet Points" tergolong dalam pilar...',
        options: [
          'Role (Peran)',
          'Task (Tugas)',
          'Format (Bentuk Luaran & Arsitektur)',
          'Context (Latar Belakang)'
        ],
        correct: 2,
        explanation: 'Pilar Format mengatur wujud presentasi akhir, pembagian jumlah halaman/slide, rasio tampilan, dan tata letak hierarki informasi (bullet points).'
      },
      {
        q: '11. Perhatikan prompt ini: "Bertindaklah sebagai Auditor Keamanan Siber Senior bersertifikat CEH dengan gaya bahasa lugas dan objektif". Bagian ini berfungsi menentukan...',
        options: [
          'Role (Peran & Persona Ahli)',
          'Task (Tugas Pekerjaan)',
          'Format (Bentuk Dokumen)',
          'Constraint (Batasan Waktu)'
        ],
        correct: 0,
        explanation: 'Instruksi tersebut menetapkan persona profesional lengkap dengan latar belakang sertifikasi dan gaya komunikasi, yang merupakan definisi pilar Role.'
      },
      {
        q: '12. Apa tujuan teknis menyisipkan instruksi "Berpikirlah secara logis dan jelaskan langkah demi langkah (step-by-step) sebelum memberikan jawaban akhir"?',
        options: [
          'Memperlambat koneksi internet agar server tidak panas',
          'Mengaktifkan penalaran berurutan (Chain-of-Thought) untuk meminimalkan kesalahan logika pada AI',
          'Membuat hasil teks menjadi sangat panjang agar memenuhi kuota kata',
          'Menyembunyikan rumus matematika rahasia dari pengguna'
        ],
        correct: 1,
        explanation: 'Metode Chain-of-Thought (CoT) memaksa model AI mengevaluasi tahap-tahap antara penalaran, secara drastis meningkatkan akurasi pemecahan masalah kompleks.'
      },
      {
        q: '13. Siswa SMK Tata Busana ingin memanfaatkan AI pembuat gambar untuk ide busana kerja batik modern. Manakah rumusan Context yang paling efektif?',
        options: [
          '"Baju yang modis untuk wanita."',
          '"Batik motif Mega Mendung nuansa biru navy, siluet blazer modern wanita karir, pencahayaan studio editorial, latar belakang minimalis."',
          '"Bikin gambar pakaian sekarang juga."',
          '"Sebagai penjahit di pasar tradisional."'
        ],
        correct: 1,
        explanation: 'Konteks yang efektif mendeskripsikan detail motif, palet warna, siluet busana, target pemakai, dan atmosfer pencahayaan secara konkret.'
      },
      {
        q: '14. Pasien prompt berbunyi: "Tolong buatin proposal usaha makanan". Mengapa dokter prompt mendiagnosis prompt ini mengalami "penyakit kritis"?',
        options: [
          'Karena tidak menyertakan ucapan salam pembuka',
          'Karena kehilangan Role, tidak memiliki Context (jenis makanan, target modal, segmentasi), serta tanpa Format bab proposal',
          'Karena proposal makanan dilarang dibuat menggunakan komputer',
          'Karena panjang prompt kurang dari 100 kalimat'
        ],
        correct: 1,
        explanation: 'Prompt tersebut sangat ambigu dan generik (under-specified); AI tidak mengetahui jenis makanan, skala modal, target konsumen, maupun struktur proposal yang dibutuhkan.'
      },
      {
        q: '15. Agar cuplikan kode pemrograman yang dihasilkan oleh AI dapat diuji secara mandiri dan andal, bagian Format sebaiknya secara spesifik meminta...',
        options: [
          'Teks cerita panjang tentang sejarah penemu komputer',
          'Blok kode bersih beranotasi komentar penjelasan serta contoh pemanggilan fungsi (unit test case)',
          'Hanya foto tangkapan layar editor kode tanpa teks skrip',
          'Kode yang diacak agar tidak bisa dibaca oleh orang lain'
        ],
        correct: 1,
        explanation: 'Meminta blok kode beranotasi komentar dan contoh kasus uji (test case) memudahkan verifikasi, debugging, dan implementasi langsung di IDE.'
      },
      {
        q: '16. Setelah menerima hasil sintesis prompt dari AI generatif (baik berupa kode, esai, atau dokumen analisis), sikap profesional yang wajib dilakukan siswa adalah...',
        options: [
          'Langsung menyalin dan mengumpulkan tanpa membaca kembali',
          'Memverifikasi fakta, menguji kode di lingkungan pengembang (runtime), dan menelaah kecocokan terhadap kebutuhan nyata',
          'Menyebarkannya ke media sosial dan mengklaim sebagai karya orisinal tanpa telaah',
          'Menghapus jawaban tersebut karena semua keluaran AI pasti salah'
        ],
        correct: 1,
        explanation: 'Kecakapan kritis (critical thinking) dan pengujian mandiri (human-in-the-loop) adalah keharusan mutlak dalam etika pemanfaatan kecerdasan buatan.'
      },
      {
        q: '17. Apa yang dimaksud dengan istilah "Context Window" pada model AI berbasis teks seperti Groq atau ChatGPT?',
        options: [
          'Jendela aplikasi browser yang sedang terbuka di layar komputer',
          'Kapasitas maksimum token (kata/karakter) yang dapat diingat dan diproses model dalam satu sesi dialog aktif',
          'Waktu jeda tunggu sebelum AI memberikan jawaban',
          'Ukuran monitor yang digunakan untuk mengetik prompt'
        ],
        correct: 1,
        explanation: 'Context Window adalah batas memori kerja model dalam mencerna input dan riwayat obrolan sebelum ia mulai "melupakan" instruksi terdahulu.'
      },
      {
        q: '18. Pada prompt visual 3D: "isometric low-poly laboratory, ambient occlusion, global illumination, Blender 3D render", istilah pencahayaan dan render tersebut berfungsi...',
        options: [
          'Memberikan instruksi parameter grafis realistis pada pilar Context & Constraints',
          'Menjelaskan nama pemilik laboratorium',
          'Menentukan format file ekstensi MP3',
          'Menjadi peran dokter analis'
        ],
        correct: 0,
        explanation: 'Istilah teknis render seperti ambient occlusion dan global illumination mempertegas parameter visual estetika pada pilar Context.'
      },
      {
        q: '19. Bagaimana praktik berintegritas bagi siswa SMK dalam menggunakan AI generatif untuk penyusunan Laporan Praktik Kerja Lapangan (PKL)?',
        options: [
          'Menyuruh AI mengarang seluruh kegiatan harian magang dari hari pertama hingga akhir',
          'Memanfaatkan AI sebagai rekan brainstorming kerangka penulisan, lalu mengisi data teknis faktual dari pengalaman nyata di industri',
          'Menyalin laporan milik industri lain lalu meminta AI mengganti nama industrinya',
          'Memalsukan tanda tangan pembimbing industri dengan generator gambar'
        ],
        correct: 1,
        explanation: 'AI berfungsi sebagai pengungkit produktivitas (scaffolding & perapian bahasa), sementara fakta empiris, data praktikum, dan analisis teknis harus bersumber dari pengalaman nyata siswa.'
      },
      {
        q: '20. Apa perbedaan fundamental antara pilar Task (Tugas) dan Context (Konteks) dalam formula R-T-C-F?',
        options: [
          'Task adalah siapa yang berbicara, sedangkan Context adalah di mana AI berada',
          'Task adalah instruksi tindakan utama yang harus dieksekusi, sedangkan Context adalah parameter latar belakang, batasan, dan kondisi kerja',
          'Task selalu berbentuk tabel, sedangkan Context selalu berupa angka',
          'Task berada di akhir prompt, sedangkan Context selalu di awal prompt'
        ],
        correct: 1,
        explanation: 'Task menjawab "apa pekerjaan yang harus diselesaikan?" sedangkan Context menjawab "apa batasan, situasi, latar belakang, dan aturan main yang mengikat pekerjaan tersebut?".'
      },
      {
        q: '21. Mengapa penggunaan simbol pemisah tegas (delimiter) seperti tanda pagar rangkap tiga (###), tanda kutip tiga ("""), atau tag XML disarankan saat menyertakan bahan teks bacaan di prompt?',
        options: [
          'Agar tampilan prompt terlihat lebih keren dan estetik',
          'Membantu model membedakan secara tegas antara instruksi perintah sistem dan teks bahan yang harus diproses',
          'Karena AI hanya dapat membaca teks jika diberi tanda kutip',
          'Untuk menghemat pemakaian memori kuota internet'
        ],
        correct: 1,
        explanation: 'Delimiter memisahkan hierarki instruksi dan data payload rujukan, mencegah masalah keamanan seperti prompt injection dan kebingungan interpretasi model.'
      },
      {
        q: '22. Jika siswa ingin AI menyajikan perbandingan spesifikasi 3 perangkat keras komputer untuk rekomendasi pengadaan sekolah, bentuk Format luaran manakah yang paling ideal?',
        options: [
          'Satu paragraf teks panjang tanpa spasi',
          'Tabel perbandingan Markdown dengan kolom: Perangkat, Spesifikasi Kunci, Kelebihan, Kekurangan, dan Estimasi Biaya',
          'Daftar lirik lagu anak-anak',
          'File executable (.exe) otomatis'
        ],
        correct: 1,
        explanation: 'Tabel perbandingan Markdown memudahkan keterbacaan data multivariat, perbandingan parameter secara berdampingan, dan mudah disalin ke dokumen laporan.'
      },
      {
        q: '23. Apa yang terjadi jika kita mengubah pilar Role dari "Guru Pengampu Anak TK" menjadi "Profesor Riset Bioteknologi" pada prompt yang menanyakan: "Jelaskan proses fotosintesis"?',
        options: [
          'Jawaban AI akan sama persis tanpa perbedaan sepatah kata pun',
          'AI akan mengubah diksi, analogi penyampaian, kedalaman reaksi biokimiawi, dan kompleksitas terminologi secara drastis',
          'AI akan menolak menjawab karena perbedaan gelar',
          'Komputer akan meminta konfirmasi identitas KTP pengguna'
        ],
        correct: 1,
        explanation: 'Peran yang disematkan secara langsung mengalihkan register bahasa: dari analogi sederhana ramah anak menjadi penjelasan ilmiah mendalam dengan rumus reaksi terang/gelap.'
      },
      {
        q: '24. Jika keluaran pertama yang dihasilkan oleh AI generatif belum memenuhi standar yang kamu inginkan, langkah tepat sesuai siklus rekayasa prompt adalah...',
        options: [
          'Langsung menyerah dan menganggap AI tidak bisa digunakan',
          'Melakukan penyempurnaan berulang (iterative refinement) dengan memberikan umpan balik spesifik pada pilar formula yang masih kurang',
          'Mengulang prompt yang sama persis tanpa mengubah satu huruf pun sebanyak sepuluh kali',
          'Mematikan komputer dan mencabut kabel listrik'
        ],
        correct: 1,
        explanation: 'Iterasi terarah (refinement loop) adalah kompetensi inti: analisis kelemahan output, perbaiki pilar Context atau Format, dan minta perbaikan terfokus.'
      },
      {
        q: '25. Mengapa penguasaan formula R-T-C-F menjadi modal kecakapan digital krusial bagi siswa vokasi SMK di era otomasi kecerdasan buatan?',
        options: [
          'Agar siswa tidak perlu belajar keahlian kejuruan lagi di sekolah',
          'Mengubah peran siswa dari sekadar konsumen pasif menjadi "director" cerdas yang mampu mengarahkan potensi AI secara produktif, etis, dan presisi',
          'Karena semua lapangan pekerjaan di dunia nyata akan digantikan robot dalam setahun',
          'Supaya siswa bisa mengerjakan tugas sekolah tanpa perlu berpikir sama sekali'
        ],
        correct: 1,
        explanation: 'Formula R-T-C-F membekali siswa kerangka berpikir kritis sistematis agar mampu memimpin, memanfaatkan, dan mengontrol alat kecerdasan buatan untuk menyelesaikan masalah nyata di dunia kerja.'
      }
    ];
  }

  renderSubUnit4(container) {
    const questions = this.getQuizQuestions();

    // If quiz is completed, show the official results dashboard
    if (this.quizCompleted) {
      this.renderQuizResult(container, questions);
      return;
    }

    if (this.quizIndex === undefined || this.quizIndex < 0) this.quizIndex = 0;
    if (this.quizIndex >= questions.length) this.quizIndex = questions.length - 1;

    const curQ = questions[this.quizIndex];
    const isAnswered = this.quizAnswers && this.quizAnswers[this.quizIndex] !== undefined;
    const progressPercent = Math.round(((this.quizIndex + 1) / questions.length) * 100);

    // Count answered questions
    const answeredCount = this.quizAnswers ? Object.keys(this.quizAnswers).filter(k => this.quizAnswers[k] !== undefined).length : 0;

    container.innerHTML = `
      <div class="section-header">
        <div class="section-tag">📊 Sub-Unit 4 · Uji Kompetensi Akhir</div>
        <h2 class="section-title">Evaluasi Cerdas: 25 Butir Soal Rekayasa Prompt</h2>
        <p class="section-desc">Kerjakan seluruh 25 soal studi kasus di bawah ini. Batas Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) adalah <strong>minimal 80 poin</strong> (20 soal benar) untuk menerbitkan Sertifikat Digital.</p>
      </div>

      <!-- Quiz CBT Progress Bar -->
      <div class="quiz-progress-bar-wrap" style="margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800; color:var(--ink); margin-bottom:6px;">
          <span>Progres Ujian: ${this.quizIndex + 1} dari 25 Soal (${progressPercent}%)</span>
          <span style="color:var(--tech);">Terjawab: ${answeredCount} / 25 Soal</span>
        </div>
        <div style="width:100%; height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden;">
          <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, var(--tech), #10B981); transition:width 0.3s ease;"></div>
        </div>
      </div>

      <!-- Question Number Map / Quick Jumper -->
      <div style="background:#F8FAFD; border:1px solid #E2E8F0; border-radius:10px; padding:8px 12px; margin-bottom:14px; display:flex; align-items:center; gap:8px; overflow-x:auto;">
        <span style="font-size:11px; font-weight:800; color:var(--ink-2); white-space:nowrap;">Peta Soal:</span>
        <div style="display:flex; gap:4px; flex-wrap:wrap;">
          ${questions.map((q, idx) => {
            const hasAns = this.quizAnswers && this.quizAnswers[idx] !== undefined;
            const isCur = idx === this.quizIndex;
            let bg = hasAns ? '#D1FAE5' : '#FFFFFF';
            let color = hasAns ? '#065F46' : 'var(--ink)';
            let border = hasAns ? '1px solid #10B981' : '1px solid #CBD5E1';
            if (isCur) {
              border = '2px solid var(--tech)';
              bg = '#EBF4FF';
              color = 'var(--tech)';
            }
            return `
              <button class="btn-jump-q" data-idx="${idx}" 
                      style="width:26px; height:26px; font-size:11px; font-weight:800; border-radius:6px; cursor:pointer; background:${bg}; color:${color}; border:${border}; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease;">
                ${idx + 1}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="quiz-card">
        <div class="quiz-header">
          <span class="quiz-number">Pertanyaan No. ${this.quizIndex + 1}</span>
          <span class="quiz-score-badge">Bobot: 4 Poin / Soal (Maks: 100 Poin)</span>
        </div>

        <div class="quiz-question" style="font-size:14.5px; line-height:1.6; margin:14px 0 18px 0; color:var(--ink);">${curQ.q}</div>

        <div class="quiz-options-list">
          ${curQ.options.map((opt, i) => {
            let stateClass = '';
            if (isAnswered) {
              if (i === curQ.correct) stateClass = 'correct';
              else if (i === this.quizAnswers[this.quizIndex]) stateClass = 'wrong';
            }
            return `
              <button class="quiz-option-btn ${stateClass}" data-idx="${i}" ${isAnswered ? 'disabled' : ''}>
                <span class="quiz-option-key">${String.fromCharCode(65 + i)}</span>
                <span>${opt}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Feedback & Discussion Box -->
        <div id="quizFeedbackBox" style="${isAnswered ? 'display:block;' : 'display:none;'} margin-top:16px; padding:12px 16px; border-radius:8px; background:#F8FAFC; border:1px solid #CBD5E1; font-size:13px; line-height:1.5;">
          <strong>💡 Pembahasan Pedagogis:</strong> ${curQ.explanation}
        </div>

        <!-- Navigation Buttons -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:22px;">
          <button class="btn btn-secondary" id="btnPrevQuiz" ${this.quizIndex === 0 ? 'disabled' : ''} style="padding:9px 18px; font-size:13px;">
            ◀ Soal Sebelumnya
          </button>
          
          ${this.quizIndex < questions.length - 1
            ? `<button class="btn btn-primary" id="btnNextQuiz" ${!isAnswered ? 'disabled' : ''} style="padding:9px 20px; font-size:13px;">Soal Berikutnya ▶</button>`
            : `<button class="btn btn-primary" id="btnFinishQuiz" ${!isAnswered ? 'disabled' : ''} style="background:linear-gradient(135deg, #0A6FD6, #00A651); padding:9px 22px; font-size:13px; font-weight:800;">📊 Selesaikan Ujian & Hitung Nilai ➔</button>`}
        </div>
      </div>
    `;

    // 1. Option click handlers
    container.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const picked = parseInt(btn.getAttribute('data-idx'), 10);
        this.answerQuiz(picked, curQ.correct);
      });
    });

    // 2. Question Map Jumper
    container.querySelectorAll('.btn-jump-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        this.quizIndex = idx;
        if (window.audioMgr) window.audioMgr.whoosh();
        this.renderSubUnit4(container);
      });
    });

    // 3. Prev Question
    container.querySelector('#btnPrevQuiz')?.addEventListener('click', () => {
      if (this.quizIndex > 0) {
        this.quizIndex--;
        if (window.audioMgr) window.audioMgr.whoosh();
        this.renderSubUnit4(container);
      }
    });

    // 4. Next Question
    container.querySelector('#btnNextQuiz')?.addEventListener('click', () => {
      if (this.quizIndex < questions.length - 1) {
        this.quizIndex++;
        if (window.audioMgr) window.audioMgr.whoosh();
        this.renderSubUnit4(container);
      }
    });

    // 5. Finish Quiz
    container.querySelector('#btnFinishQuiz')?.addEventListener('click', () => {
      this.evaluateQuiz(questions, container);
    });
  }

  answerQuiz(picked, correct) {
    if (!this.quizAnswers) this.quizAnswers = [];
    this.quizAnswers[this.quizIndex] = picked;

    if (picked === correct) {
      if (window.audioMgr) window.audioMgr.coinDing();
      if (window.robot) window.robot.setState('CHEER', 2200);
      this.showRobotDialogue("Tepat sekali! Pilihan jawabanmu sangat presisi sesuai prinsip R-T-C-F!");
    } else {
      if (window.audioMgr) window.audioMgr.errorBuzz();
      if (window.robot) window.robot.setState('CONFUSE', 2200);
      this.showRobotDialogue("Jawabanmu belum tepat. Simak pembahasan di bawah untuk memperdalam pemahaman!");
    }

    this.renderSubUnit4(document.getElementById('viewContainer'));
  }

  evaluateQuiz(questions, container) {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (this.quizAnswers && this.quizAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    // Score calculation: 25 questions * 4 = 100 points
    const finalScore = correctCount * 4;
    this.state.quizScore = finalScore;
    this.quizCompleted = true;

    // Passing threshold: KKTP >= 80
    const isPassed = finalScore >= 80;

    if (isPassed) {
      this.state.progress.sub4 = true;
      this.saveSession();
      this.renderSidebar();

      if (window.confetti) {
        window.confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      }
      if (window.audioMgr) window.audioMgr.successChime();
      if (window.robot) window.robot.setState('CHEER', 4000);
      this.showRobotDialogue(`SELAMAT! Nilai ujianmu adalah ${finalScore} / 100 (LULUS KOMPETEN). Seluruh kriteria pembelajaran telah terpenuhi!`);
    } else {
      // Score < 80: MUST NOT PASS, Certificate MUST NOT appear
      this.state.progress.sub4 = false;
      this.saveSession();
      this.renderSidebar();

      if (window.audioMgr) window.audioMgr.errorBuzz();
      if (window.robot) window.robot.setState('CONFUSE', 3500);
      this.showRobotDialogue(`Nilai evaluasimu ${finalScore} / 100 (Belum mencapai KKTP minimal 80). Sertifikat kelulusan belum dapat diterbitkan. Silakan pelajari kembali materi dan ulangi kuis!`);
    }

    this.renderQuizResult(container, questions);
  }

  renderQuizResult(container, questions) {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (this.quizAnswers && this.quizAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const finalScore = correctCount * 4;
    const isPassed = finalScore >= 80;
    const is100Pct = this.state.progress.sub1 && 
                     this.state.progress.sub2 && 
                     this.state.progress.sub3 && 
                     this.state.progress.sub4;

    container.innerHTML = `
      <div class="section-header">
        <div class="section-tag">📋 Hasil Uji Kompetensi Akhir</div>
        <h2 class="section-title">Lembar Rekapitulasi Evaluasi & Kuis</h2>
        <p class="section-desc">Hasil pengujian pemahaman formula R-T-C-F dan aplikasi kecerdasan buatan generatif lintas modalitas.</p>
      </div>

      <div class="quiz-result-card">
        ${isPassed ? `
          <span class="result-badge pass">✓ LULUS KOMPETEN (KKTP >= 80 TERPENUHI)</span>
          <div class="result-score-big pass">${finalScore} <span style="font-size:24px; color:var(--ink-2); font-weight:700;">/ 100</span></div>
          <div style="font-size:14px; font-weight:700; color:var(--ink); margin-bottom:8px;">
            Jawaban Benar: <strong style="color:var(--emerald);">${correctCount}</strong> dari 25 Soal (KKTP Minimal: 20 Soal / 80 Poin)
          </div>
          <div class="result-stat-box" style="border-left:4px solid #10B981; text-align:left;">
            <strong>🎉 Selamat, ${this.state.studentName || 'Siswa'}!</strong>
            <p style="margin:6px 0 0 0;">Kamu telah membuktikan kompetensi tinggi dalam rekayasa prompt terstruktur. Sertifikat Digital Kelulusan resmi kini telah aktif dan dapat langsung diterbitkan atau diunduh.</p>
          </div>
        ` : `
          <span class="result-badge fail">⚠️ BELUM LULUS (BELUM MENCAPAI KKTP)</span>
          <div class="result-score-big fail">${finalScore} <span style="font-size:24px; color:var(--ink-2); font-weight:700;">/ 100</span></div>
          <div style="font-size:14px; font-weight:700; color:var(--ink); margin-bottom:8px;">
            Jawaban Benar: <strong style="color:#EF4444;">${correctCount}</strong> dari 25 Soal (Dibutuhkan Minimal: 20 Soal / 80 Poin)
          </div>
          <div class="result-stat-box" style="border-left:4px solid #EF4444; text-align:left;">
            <strong style="color:#DC2626;">⚠️ Sertifikat Belum Dapat Diterbitkan:</strong>
            <p style="margin:6px 0 0 0;">Sesuai ketentuan standar kelulusan KKA, nilai evaluasi kamu (${finalScore}) masih berada di bawah Kriteria Ketercapaian Tujuan Pembelajaran (minimal 80). Sertifikat digital belum dapat muncul sampai kamu mengulang dan meraih skor di atas 80.</p>
          </div>
        `}

        <!-- Action Buttons -->
        <div class="result-actions" style="margin-top:22px;">
          ${isPassed && is100Pct ? `
            <button class="btn btn-primary" id="btnOpenCertResult" style="background:linear-gradient(135deg, #0A6FD6, #00A651); font-size:13.5px; padding:11px 24px; box-shadow:0 4px 14px rgba(10, 111, 214, 0.35);">
              🏆 Buka & Unduh Sertifikat Digital
            </button>
          ` : ''}

          <button class="btn ${isPassed ? 'btn-secondary' : 'btn-primary'}" id="btnRetakeQuiz" 
                  style="${!isPassed ? 'background:#EF4444; border-color:#DC2626;' : ''} font-size:13.5px; padding:11px 22px;">
            🔄 ${isPassed ? 'Ulangi Kuis (Raih Nilai 100 Sempurna)' : 'Ulangi Mengerjakan Evaluasi & Kuis'}
          </button>

          <button class="btn btn-secondary" id="btnReviewSub2" style="font-size:13.5px; padding:11px 20px;">
            🩺 Buka Klinik Prompt Doctor (Sub-2)
          </button>
        </div>
      </div>
    `;

    // 1. Open Certificate Button
    container.querySelector('#btnOpenCertResult')?.addEventListener('click', () => {
      this.openCertificateModal();
    });

    // 2. Retake Quiz Button
    container.querySelector('#btnRetakeQuiz')?.addEventListener('click', () => {
      this.quizIndex = 0;
      this.quizAnswers = [];
      this.quizCompleted = false;
      this.state.quizScore = 0;
      this.state.progress.sub4 = false;
      this.saveSession();
      this.renderSidebar();
      if (window.audioMgr) window.audioMgr.whoosh();
      this.showRobotDialogue("Evaluasi diulang! Mari kita baca setiap studi kasus dengan teliti dan raih nilai di atas 80!");
      this.renderSubUnit4(container);
    });

    // 3. Review Sub-2 Button
    container.querySelector('#btnReviewSub2')?.addEventListener('click', () => {
      this.switchSubUnit(2);
    });
  }

    // ========================================================
  // DIGITAL CERTIFICATE GENERATOR (CANVAS - PPLG SMKN 1 BAWANG)
  // ========================================================
  loadImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      // DO NOT set crossOrigin on data: URIs or local file paths (causes CORS block on file:///)
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Image load error for:', src.slice(0, 40));
        resolve(null);
      };
      img.src = src;
    });
  }

  openCertificateModal() {
    const is100Pct = this.state.progress.sub1 && 
                     this.state.progress.sub2 && 
                     this.state.progress.sub3 && 
                     this.state.progress.sub4;
    if (!is100Pct) {
      this.showToast('⚠️ Sertifikat terkunci! Tuntaskan evaluasi dengan nilai minimal 80.');
      this.showRobotDialogue("Sertifikat digital masih terkunci! Kamu harus mencapai nilai minimal 80 pada Evaluasi & Kuis.");
      return;
    }

    const modal = document.getElementById('genericModal');
    const titleEl = document.getElementById('genericModalTitle');
    const bodyEl = document.getElementById('genericModalBody');

    titleEl.textContent = '🏆 Sertifikat Kompetensi Digital PPLG SMKN 1 Bawang';
    bodyEl.innerHTML = `
      <div class="certificate-view">
        <canvas id="certificateCanvas" width="1000" height="640"></canvas>
        <div style="display:flex; gap:12px; margin-top:14px; flex-wrap:wrap; justify-content:center;">
          <button class="btn btn-primary" id="btnDownloadCert" style="background:linear-gradient(135deg, #0A6FD6, #00A651); padding:10px 22px; font-size:13.5px; font-weight:800;">
            📥 Unduh Gambar Sertifikat Resmi (PNG HD)
          </button>
          <button class="btn btn-secondary" onclick="window.print()" style="padding:10px 18px; font-size:13.5px;">
            🖨️ Cetak Dokumen
          </button>
        </div>
      </div>
    `;

    modal.classList.add('open');
    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    }
    if (window.robot) window.robot.setState('CHEER', 5000);
    this.showRobotDialogue("SELAMAT! Sertifikat resmi dari Jurusan PPLG SMKN 1 Bawang berhasil diterbitkan!");

    // Render immediately and again after brief layout tick
    this.drawCertificate();
    setTimeout(() => {
      this.drawCertificate();
      document.getElementById('btnDownloadCert')?.addEventListener('click', () => {
        const canvas = document.getElementById('certificateCanvas');
        if (!canvas) return;
        const link = document.createElement('a');
        const cleanName = (this.state.studentName || 'Siswa').replace(/\s+/g, '_');
        link.download = `Sertifikat_KKA_PPLG_SMKN1Bawang_${cleanName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.showToast('Sertifikat berhasil diunduh dalam resolusi tinggi!', '🏆');
      });
    }, 100);
  }

  async drawCertificate() {
    const canvas = document.getElementById('certificateCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Use embedded Base64 data URIs first (100% reliable on file:/// and offline)
    const skansaSrc = (window.CERT_ASSETS && window.CERT_ASSETS.logoSkansa) || 'assets/logo_smkn1bawang.png';
    const pplgSrc = (window.CERT_ASSETS && window.CERT_ASSETS.logoPplg) || 'assets/logo_pplg.png';
    const tteSrc = (window.CERT_ASSETS && window.CERT_ASSETS.tteSignature) || 'assets/tte_signature.png';

    // Load Logos & TTE Signature image concurrently
    const [logoSkansa, logoPplg, imgTte] = await Promise.all([
      this.loadImage(skansaSrc),
      this.loadImage(pplgSrc),
      this.loadImage(tteSrc)
    ]);

    // 1. Certificate Background (Soft Paper Texture Gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(0.5, '#F9FBFE');
    bgGrad.addColorStop(1, '#F0F6FC');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial luxury watermark in center
    const radial = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 400);
    radial.addColorStop(0, 'rgba(10, 111, 214, 0.03)');
    radial.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    // 2. Ornate Dual Borders
    // Outer Navy Border
    ctx.strokeStyle = '#0B2A4A';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Inner Gold Accent Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Third Thin Blue Border
    ctx.strokeStyle = 'rgba(10, 111, 214, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // Corner Ornaments
    const drawCorner = (cx, cy) => {
      ctx.fillStyle = '#0B2A4A';
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
    };
    drawCorner(24, 24);
    drawCorner(w - 24, 24);
    drawCorner(24, h - 24);
    drawCorner(w - 24, h - 24);

    // 3. Top Header: Logos & Kop Surat SMKN 1 Bawang
    // Logo SMKN 1 Bawang (Left Top - 72x72)
    if (logoSkansa) {
      ctx.drawImage(logoSkansa, 46, 26, 72, 72);
    }

    // Logo PPLG (Right Top - 72x72)
    if (logoPplg) {
      ctx.drawImage(logoPplg, w - 46 - 72, 26, 72, 72);
    }

    // Kop Surat Text (Center)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('PEMERINTAH PROVINSI JAWA TENGAH', w / 2, 42);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText('DINAS PENDIDIKAN DAN KEBUDAYAAN', w / 2, 59);

    ctx.fillStyle = '#0B2A4A';
    ctx.font = '900 19px Nunito, sans-serif';
    ctx.fillText('SMK NEGERI 1 BAWANG', w / 2, 80);

    ctx.fillStyle = '#0A6FD6';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('KONSENTRASI KEAHLIAN PENGEMBANGAN PERANGKAT LUNAK DAN GIM (PPLG)', w / 2, 97);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Jl. Raya Bawang No. 01, Banjarnegara 53471 · Website: smkn1bawang.sch.id', w / 2, 111);

    // Double Divider Line
    ctx.strokeStyle = '#0A6FD6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(45, 118);
    ctx.lineTo(w - 45, 118);
    ctx.stroke();

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(45, 122);
    ctx.lineTo(w - 45, 122);
    ctx.stroke();

    // 4. Certificate Title
    ctx.fillStyle = '#0B2A4A';
    ctx.font = '900 25px Nunito, sans-serif';
    ctx.fillText('SERTIFIKAT KOMPETENSI SISWA', w / 2, 155);

    const year = new Date().getFullYear();
    const certSerial = `421.5/SKANSA-PPLG/KKA/${year}/${(this.state.studentNis || '2026').slice(-4)}-${Date.now().toString().slice(-4)}`;
    ctx.fillStyle = '#64748B';
    ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Nomor: ${certSerial}`, w / 2, 174);

    // 5. Recipient
    ctx.fillStyle = '#475569';
    ctx.font = '500 12.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Diberikan secara resmi kepada peserta didik:', w / 2, 202);

    // Student Name
    ctx.fillStyle = '#0A6FD6';
    ctx.font = 'bold 27px Nunito, sans-serif';
    const displayName = (this.state.studentName || 'SISWA SMK').toUpperCase();
    ctx.fillText(displayName, w / 2, 235);

    // Student NIS and Class
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13.5px Plus Jakarta Sans, sans-serif';
    const nisText = this.state.studentNis ? `NIS: ${this.state.studentNis}` : 'NIS: -';
    const classText = this.state.studentClass ? `Kelas: ${this.state.studentClass}` : 'Kelas: -';
    ctx.fillText(`${nisText}    |    ${classText}`, w / 2, 256);

    // 6. Narrative of Competency
    ctx.fillStyle = '#334155';
    ctx.font = '500 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Telah menuntaskan seluruh capaian pembelajaran praktik dan evaluasi pada mata pelajaran:', w / 2, 286);

    ctx.fillStyle = '#0B2A4A';
    ctx.font = '900 16.5px Nunito, sans-serif';
    ctx.fillText('KODING DAN KECERDASAN ARTIFISIAL (KKA)', w / 2, 308);

    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Materi: Rekayasa Prompt AI (Prompt Engineering) Berbasis Formula R-T-C-F', w / 2, 328);

    // 7. Score / Competency Badge
    const displayScore = this.state.quizScore || 100;
    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 170, 346, 340, 34, 17);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 12.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Predikat: LULUS KOMPETEN (Nilai Evaluasi: ${displayScore} / 100)`, w / 2, 368);

    // 8. Footer Left: Verification & Issuing Metadata
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = '600 10.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Diterbitkan oleh:', 56, 468);
    ctx.fillStyle = '#0B2A4A';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Konsentrasi Keahlian PPLG SMKN 1 Bawang', 56, 485);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('✓ Terverifikasi Sistem Evaluasi Digital KKA', 56, 504);

    ctx.fillStyle = '#64748B';
    ctx.font = '9.5px JetBrains Mono, monospace';
    ctx.fillText(`ID Dokumen: PPLG-KKA-${this.state.studentNis || '2026'}-${Date.now().toString().slice(-4)}`, 56, 521);
    ctx.fillText('Keaslian sertifikat terdaftar pada pangkalan data sekolah.', 56, 535);

    // 9. Footer Right: Electronic Signature (TTE) Guru Mapel
    const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.textAlign = 'center';
    const signX = w - 175;

    ctx.fillStyle = '#334155';
    ctx.font = '500 11.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Banjarnegara, ${today}`, signX, 450);
    ctx.fillText('Guru Mata Pelajaran,', signX, 466);

    // TTE Signature Image (Uploaded by User: QR Code + BSSN Seal + Key Icon)
    if (imgTte) {
      ctx.drawImage(imgTte, signX - 85, 470, 170, 60);
    }

    // Teacher's Name
    ctx.fillStyle = '#0B2A4A';
    ctx.font = 'bold 13.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Nindita Rahman, S. Kom.', signX, 540);

    // Underline teacher name
    ctx.strokeStyle = '#0B2A4A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(signX - 70, 544);
    ctx.lineTo(signX + 70, 544);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '500 10.5px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Guru Mapel Koding & Kecerdasan Artifisial', signX, 558);

    ctx.fillStyle = '#0A6FD6';
    ctx.font = 'italic 9px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Ditandatangani secara elektronik (TTE) tersertifikasi BSrE - BSSN', signX, 572);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new RoboPromptApp();
});
