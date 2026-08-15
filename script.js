// ================== VARIABEL GLOBAL ==================
let setAktif = null;
let indexKartu = 0;
let modeAktif = 'flashcard'; // 'flashcard' atau 'kuis'
let soalKuis = [];
let indexSoal = 0;
let skorKuis = 0;
let itemsAcak = [];

// ================== FUNGSI UTAMA ==================
function init() {
  isiDropdownSet();
  setupEventListeners();
  gantiMode('flashcard');
}

function isiDropdownSet() {
  const select = document.getElementById('set-select');
  select.innerHTML = '';
  daftarMateri.forEach((set, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = set.nama;
    select.appendChild(option);
  });
  select.value = 0;
  setAktif = daftarMateri[0];
}

function setupEventListeners() {
  document.getElementById('set-select').addEventListener('change', (e) => {
    setAktif = daftarMateri[parseInt(e.target.value)];
    resetState();
    if (modeAktif === 'flashcard') renderFlashcard();
    else renderKuis();
  });

  document.getElementById('btn-flashcard').addEventListener('click', () => gantiMode('flashcard'));
  document.getElementById('btn-kuis').addEventListener('click', () => gantiMode('kuis'));
}

function gantiMode(mode) {
  modeAktif = mode;
  document.getElementById('btn-flashcard').classList.toggle('active', mode === 'flashcard');
  document.getElementById('btn-kuis').classList.toggle('active', mode === 'kuis');
  resetState();
  if (mode === 'flashcard') renderFlashcard();
  else renderKuis();
}

function resetState() {
  indexKartu = 0;
  indexSoal = 0;
  skorKuis = 0;
  soalKuis = [];
  itemsAcak = [];
}

// ================== MODE FLASHCARD ==================
function renderFlashcard() {
  const area = document.getElementById('content-area');
  if (!setAktif || setAktif.items.length === 0) {
    area.innerHTML = '<p>Tidak ada data.</p>';
    return;
  }

  const item = setAktif.items[indexKartu];
  area.innerHTML = `
    <div class="flashcard-container" id="flashcard-container">
      <div class="flashcard-inner" id="flashcard-inner">
        <div class="flashcard-front">
          <div class="flashcard-label">${setAktif.nama}</div>
          <div class="flashcard-arab">${item.arab}</div>
        </div>
        <div class="flashcard-back">
          <div class="flashcard-label">Cara Baca</div>
          <div class="flashcard-latin">${item.latin}</div>
        </div>
      </div>
    </div>
    <div class="flashcard-nav">
      <button class="btn-nav" id="btn-prev">⬅ Sebelumnya</button>
      <span style="font-weight:600; align-self:center;">${indexKartu + 1} / ${setAktif.items.length}</span>
      <button class="btn-nav" id="btn-next">Berikutnya ➡</button>
    </div>
    <div style="margin-top:1rem;">
      <button class="btn-nav" id="btn-acak">🔀 Acak Kartu</button>
    </div>
  `;

  // Event listener untuk flip
  document.getElementById('flashcard-container').addEventListener('click', flipKartu);

  // Navigasi
  document.getElementById('btn-prev').addEventListener('click', kartuSebelumnya);
  document.getElementById('btn-next').addEventListener('click', kartuBerikutnya);
  document.getElementById('btn-acak').addEventListener('click', acakKartu);
}

function flipKartu() {
  document.getElementById('flashcard-inner').classList.toggle('flipped');
}

function kartuBerikutnya() {
  if (setAktif) {
    indexKartu = (indexKartu + 1) % setAktif.items.length;
    renderFlashcard();
  }
}

function kartuSebelumnya() {
  if (setAktif) {
    indexKartu = (indexKartu - 1 + setAktif.items.length) % setAktif.items.length;
    renderFlashcard();
  }
}

function acakKartu() {
  if (setAktif) {
    indexKartu = Math.floor(Math.random() * setAktif.items.length);
    renderFlashcard();
  }
}

// ================== MODE KUIS ==================
function renderKuis() {
  const area = document.getElementById('content-area');
  if (!setAktif || setAktif.items.length === 0) {
    area.innerHTML = '<p>Tidak ada data.</p>';
    return;
  }

  if (soalKuis.length === 0) {
    soalKuis = buatSoalKuis(setAktif, 10);
  }

  if (indexSoal >= soalKuis.length) {
    tampilkanHasilKuis(area);
    return;
  }

  const soal = soalKuis[indexSoal];
  let pilihanHtml = soal.pilihan.map((pil, i) => {
    return `<button class="btn-pilihan" data-pil="${pil}">${String.fromCharCode(65 + i)}. ${pil}</button>`;
  }).join('');

  area.innerHTML = `
    <div class="kuis-container">
      <div class="kuis-progress">Soal ${indexSoal + 1} dari ${soalKuis.length}</div>
      <div class="kuis-soal-arab">${soal.pertanyaan}</div>
      <p style="font-style:italic; color:#64748b;">Pilih cara baca yang benar:</p>
      <div class="kuis-pilihan">
        ${pilihanHtml}
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-pilihan').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jawaban = e.target.dataset.pil;
      cekJawaban(jawaban, soal.jawaban, area);
    });
  });
}

function buatSoalKuis(set, jumlah) {
  const semuaLatin = set.items.map(item => item.latin);
  const itemsAcak = [...set.items].sort(() => Math.random() - 0.5);
  const soal = [];

  for (let i = 0; i < Math.min(jumlah, itemsAcak.length); i++) {
    const item = itemsAcak[i];
    const jawabanBenar = item.latin;
    const pilihan = new Set([jawabanBenar]);
    while (pilihan.size < 4) {
      const randomLatin = semuaLatin[Math.floor(Math.random() * semuaLatin.length)];
      if (randomLatin !== jawabanBenar) pilihan.add(randomLatin);
    }
    soal.push({
      pertanyaan: item.arab,
      pilihan: [...pilihan].sort(() => Math.random() - 0.5),
      jawaban: jawabanBenar
    });
  }
  return soal;
}

function cekJawaban(jawabanDipilih, jawabanBenar, area) {
  const soal = soalKuis[indexSoal];
  const tombols = area.querySelectorAll('.btn-pilihan');
  tombols.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.pil === jawabanBenar) {
      btn.classList.add('benar');
    } else if (btn.dataset.pil === jawabanDipilih) {
      btn.classList.add('salah');
    }
  });

  if (jawabanDipilih === jawabanBenar) {
    skorKuis++;
  }

  setTimeout(() => {
    indexSoal++;
    renderKuis();
  }, 1500);
}

function tampilkanHasilKuis(area) {
  area.innerHTML = `
    <div class="kuis-container">
      <h2>Kuis Selesai! 🎉</h2>
      <div class="kuis-skor">Skor kamu: ${skorKuis} / ${soalKuis.length}</div>
      <button class="btn-nav" style="margin-top:1rem;" onclick="ulangiKuis()">🔄 Ulangi Kuis</button>
      <button class="btn-nav" style="margin-top:0.5rem;" onclick="gantiMode('flashcard')">📚 Kembali ke Flashcard</button>
    </div>
  `;
}

function ulangiKuis() {
  resetState();
  renderKuis();
}

// ================== INISIALISASI ==================
document.addEventListener('DOMContentLoaded', init);
