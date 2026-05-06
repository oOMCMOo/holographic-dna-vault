/**
 * ArchiveViewer.js
 * ─────────────────────────────────────────────────────────────
 * Genome Archive Viewer — full panel with:
 *  - Animated Three.js double-helix inside a canvas
 *  - Tabs: 3D Helix | Sequence | Codon Map | Analytics
 *  - Live sequence ticker
 *  - Stats footer
 *  - HTML file upload / iframe rendering
 *  - Sky-blue palette throughout
 * ─────────────────────────────────────────────────────────────
 */

const BASES   = ['A','T','G','C'];
const CODONS  = {};
const AA = {
  AAA:'Lys',AAT:'Asn',AAG:'Lys',AAC:'Asn',
  ATA:'Ile',ATT:'Ile',ATG:'Met',ATC:'Ile',
  AGA:'Arg',AGT:'Ser',AGG:'Arg',AGC:'Ser',
  ACA:'Thr',ACT:'Thr',ACG:'Thr',ACC:'Thr',
  TAA:'Stp',TAT:'Tyr',TAG:'Stp',TAC:'Tyr',
  TTA:'Leu',TTT:'Phe',TTG:'Leu',TTC:'Phe',
  TGA:'Stp',TGT:'Cys',TGG:'Trp',TGC:'Cys',
  TCA:'Ser',TCT:'Ser',TCG:'Ser',TCC:'Ser',
  GAA:'Glu',GAT:'Asp',GAG:'Glu',GAC:'Asp',
  GTA:'Val',GTT:'Val',GTG:'Val',GTC:'Val',
  GGA:'Gly',GGT:'Gly',GGG:'Gly',GGC:'Gly',
  GCA:'Ala',GCT:'Ala',GCG:'Ala',GCC:'Ala',
  CAA:'Gln',CAT:'His',CAG:'Gln',CAC:'His',
  CTA:'Leu',CTT:'Leu',CTG:'Leu',CTC:'Leu',
  CGA:'Arg',CGT:'Arg',CGG:'Arg',CGC:'Arg',
  CCA:'Pro',CCT:'Pro',CCG:'Pro',CCC:'Pro',
};

const rand    = (lo,hi) => lo + Math.random()*(hi-lo);
const randInt = (lo,hi) => Math.floor(rand(lo,hi+1));
const randBase= ()=> BASES[Math.floor(Math.random()*4)];
const randSeq = n => Array.from({length:n},randBase).join('');

// ─── Colour per base ─────────────────────────────────────────
const BASE_COLOR = { A:'#87CEEB', T:'#4fc3f7', G:'#b3e5fc', C:'#0288d1' };

// ─── Panel HTML ───────────────────────────────────────────────
const PANEL_HTML = `
<div id="archivePanel" class="av-panel glass">

  <!-- Header -->
  <div class="av-header">
    <div class="av-title-group">
      <div class="av-status-dot"></div>
      <span class="av-title">GENOMIC ARCHIVE VIEWER</span>
      <span class="av-subtitle mono">3,247,891 BASE PAIRS</span>
    </div>
    <div class="av-header-actions">
      <button class="av-btn" id="avUploadBtn" title="Load HTML genome file">⬆ LOAD HTML</button>
      <input type="file" id="avFileInput" accept=".html,.htm" style="display:none">
      <button class="av-btn av-btn-close" id="avClose">✕ CLOSE</button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="av-tabs">
    <button class="av-tab active" data-tab="helix">⬡ 3D HELIX</button>
    <button class="av-tab" data-tab="sequence">◈ SEQUENCE</button>
    <button class="av-tab" data-tab="codons">≋ CODON MAP</button>
    <button class="av-tab" data-tab="analytics">⌬ ANALYTICS</button>
    <button class="av-tab" data-tab="html">⎗ HTML VIEW</button>
  </div>

  <!-- ── Tab: 3D Helix ── -->
  <div class="av-body" id="tabHelix">
    <canvas id="avHelixCanvas" class="av-helix-canvas"></canvas>
    <div class="av-helix-legend">
      <span class="av-leg-item"><span class="av-leg-dot" style="background:#87CEEB"></span>A · Adenine</span>
      <span class="av-leg-item"><span class="av-leg-dot" style="background:#4fc3f7"></span>T · Thymine</span>
      <span class="av-leg-item"><span class="av-leg-dot" style="background:#b3e5fc"></span>G · Guanine</span>
      <span class="av-leg-item"><span class="av-leg-dot" style="background:#0288d1"></span>C · Cytosine</span>
    </div>
    <div class="av-seq-ticker mono" id="avSeqTicker"></div>
  </div>

  <!-- ── Tab: Sequence ── -->
  <div class="av-body hidden" id="tabSequence">
    <div class="av-seq-controls">
      <span class="av-label">SEQUENCE POSITION</span>
      <input type="range" id="avSeqPos" min="0" max="999" value="0" class="av-slider">
      <span class="mono av-seq-pos-val" id="avSeqPosVal">0</span>
    </div>
    <div class="av-seq-grid" id="avSeqGrid"></div>
    <div class="av-seq-annotation" id="avSeqAnnot"></div>
  </div>

  <!-- ── Tab: Codon Map ── -->
  <div class="av-body hidden" id="tabCodons">
    <div class="av-codon-grid" id="avCodonGrid"></div>
  </div>

  <!-- ── Tab: Analytics ── -->
  <div class="av-body hidden" id="tabAnalytics">
    <div class="av-analytics-grid">
      <div class="av-analytic-card">
        <div class="av-analytic-label">GC CONTENT</div>
        <div class="av-analytic-val" id="anaGC">48.3%</div>
        <canvas id="anaGCChart" class="av-mini-chart" width="180" height="60"></canvas>
      </div>
      <div class="av-analytic-card">
        <div class="av-analytic-label">BASE FREQUENCY</div>
        <canvas id="anaFreqChart" class="av-mini-chart" width="180" height="80"></canvas>
      </div>
      <div class="av-analytic-card">
        <div class="av-analytic-label">ENTROPY SCORE</div>
        <div class="av-analytic-val" id="anaEntropy">1.9974 bits</div>
        <div class="av-analytic-sub">Near-maximum quaternary entropy</div>
      </div>
      <div class="av-analytic-card">
        <div class="av-analytic-label">STRAND INTEGRITY</div>
        <div class="av-analytic-val" style="color:#87CEEB" id="anaIntegrity">99.97%</div>
        <div class="av-progress-track" style="margin-top:8px">
          <div class="av-progress-fill" style="width:99.97%"></div>
        </div>
      </div>
      <div class="av-analytic-card">
        <div class="av-analytic-label">CODON USAGE TOP 5</div>
        <div id="anaCodonTop" class="av-codon-top"></div>
      </div>
      <div class="av-analytic-card">
        <div class="av-analytic-label">REPLICATION STATUS</div>
        <div class="av-analytic-val" style="color:#4fc3f7">ACTIVE</div>
        <div class="av-replication-bars" id="anaRepBars"></div>
      </div>
    </div>
  </div>

  <!-- ── Tab: HTML View ── -->
  <div class="av-body hidden" id="tabHtml">
    <div class="av-html-drop" id="avHtmlDrop">
      <div class="av-drop-icon">⎗</div>
      <div class="av-drop-title">LOAD HTML GENOME FILE</div>
      <div class="av-drop-sub mono">Drag &amp; drop an HTML file here, or use the LOAD HTML button above</div>
      <button class="av-btn av-btn-primary" id="avDropUploadBtn">BROWSE FILE</button>
    </div>
    <iframe id="avHtmlFrame" class="av-html-frame hidden" sandbox="allow-scripts allow-same-origin"></iframe>
  </div>

  <!-- Footer stats -->
  <div class="av-footer">
    <div class="av-foot-stat"><span class="av-foot-label">STRAIN</span><span class="mono" id="avFootStrain">SYN-7A4F2C</span></div>
    <div class="av-foot-sep"></div>
    <div class="av-foot-stat"><span class="av-foot-label">BASE PAIRS</span><span class="mono accent" id="avFootBP">3,247,891</span></div>
    <div class="av-foot-sep"></div>
    <div class="av-foot-stat"><span class="av-foot-label">ALGORITHM</span><span class="mono">KYBER-1024</span></div>
    <div class="av-foot-sep"></div>
    <div class="av-foot-stat"><span class="av-foot-label">STORAGE</span><span class="mono">HOLOGRAPHIC</span></div>
    <div class="av-foot-sep"></div>
    <div class="av-foot-stat"><span class="av-foot-label">STATUS</span><span class="mono" style="color:#87CEEB" id="avFootStatus">SCANNING</span></div>
    <div style="margin-left:auto">
      <div class="av-progress-track" style="width:180px">
        <div class="av-progress-fill" id="avScanProgress" style="width:0%"></div>
      </div>
    </div>
    <span class="mono" style="font-size:8px;color:var(--av-dim)" id="avScanPct">0%</span>
  </div>
</div>
`;

// ─── CSS ──────────────────────────────────────────────────────
const PANEL_CSS = `
:root {
  --av-sky:    #87CEEB;
  --av-ice:    #4fc3f7;
  --av-pale:   #b3e5fc;
  --av-deep:   #0288d1;
  --av-dark:   rgba(0,14,28,0.55);
  --av-border: rgba(135,206,235,0.2);
  --av-dim:    rgba(135,206,235,0.45);
  --av-bg:     rgba(0,10,22,0.92);
}
.av-panel {
  position:fixed; inset:0;
  display:flex; flex-direction:column;
  background:var(--av-bg);
  border:1px solid var(--av-border);
  z-index:300; pointer-events:all;
  opacity:0; visibility:hidden;
  transform:translateY(18px);
  transition:opacity .3s ease,transform .3s ease,visibility .3s;
  font-family:'Orbitron',monospace;
}
.av-panel.open { opacity:1; visibility:visible; transform:translateY(0); }

/* Header */
.av-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 18px; background:rgba(0,20,40,0.85);
  border-bottom:1px solid var(--av-border); flex-shrink:0;
}
.av-title-group { display:flex; align-items:center; gap:12px; }
.av-status-dot {
  width:8px;height:8px;border-radius:50%;
  background:var(--av-sky);box-shadow:0 0 8px var(--av-sky);
  animation:pulse-dot 2s ease-in-out infinite;
}
.av-title {
  font-size:13px;font-weight:700;letter-spacing:.22em;
  color:var(--av-sky);text-shadow:0 0 12px var(--av-sky);
}
.av-subtitle { font-size:9px; color:var(--av-dim); letter-spacing:.1em; }
.av-header-actions { display:flex; gap:8px; }
.av-btn {
  padding:6px 14px; font-family:'Orbitron',monospace;
  font-size:8px; font-weight:700; letter-spacing:.15em;
  color:var(--av-sky); background:rgba(135,206,235,0.07);
  border:1px solid var(--av-border); border-radius:2px;
  cursor:pointer; transition:all .15s; white-space:nowrap;
}
.av-btn:hover { background:rgba(135,206,235,0.16); border-color:var(--av-sky); }
.av-btn-close { color:var(--av-dim); }
.av-btn-close:hover { color:var(--av-sky); }
.av-btn-primary {
  background:rgba(2,136,209,0.25); border-color:var(--av-ice);
  color:#fff; font-size:9px; padding:8px 20px; margin-top:12px;
}

/* Tabs */
.av-tabs {
  display:flex; gap:0; background:rgba(0,15,30,0.7);
  border-bottom:1px solid var(--av-border); flex-shrink:0;
}
.av-tab {
  padding:9px 18px; font-family:'Orbitron',monospace;
  font-size:8px;font-weight:700;letter-spacing:.15em;
  color:var(--av-dim); background:transparent;
  border:none;border-right:1px solid var(--av-border);
  cursor:pointer; transition:all .2s; position:relative;
}
.av-tab.active {
  color:var(--av-sky); background:rgba(135,206,235,0.08);
  text-shadow:0 0 8px var(--av-sky);
}
.av-tab.active::after {
  content:''; position:absolute; bottom:0; left:0; right:0;
  height:2px; background:var(--av-sky);
}
.av-tab:hover:not(.active) { color:var(--av-sky); background:rgba(135,206,235,0.04); }

/* Body */
.av-body {
  flex:1; overflow:hidden; position:relative; display:flex;
  flex-direction:column; min-height:0;
}
.av-body.hidden { display:none; }

/* Helix canvas */
.av-helix-canvas {
  width:100%; flex:1; min-height:0; display:block;
  background:transparent;
}
.av-helix-legend {
  display:flex; gap:20px; padding:6px 18px;
  background:rgba(0,10,20,0.6); border-top:1px solid var(--av-border);
  flex-shrink:0;
}
.av-leg-item { display:flex;align-items:center;gap:6px;font-size:8px;color:var(--av-dim); }
.av-leg-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
.av-seq-ticker {
  padding:5px 18px; font-size:9px; color:var(--av-ice);
  background:rgba(0,5,15,0.7); border-top:1px solid var(--av-border);
  letter-spacing:.08em; flex-shrink:0; overflow:hidden;
  white-space:nowrap; text-overflow:ellipsis;
}

/* Sequence tab */
.av-seq-controls {
  display:flex;align-items:center;gap:12px;padding:10px 18px;
  background:rgba(0,10,20,0.7);border-bottom:1px solid var(--av-border);
  flex-shrink:0;
}
.av-label { font-size:8px;letter-spacing:.18em;color:var(--av-dim); }
.av-slider { flex:1;accent-color:var(--av-sky); }
.av-seq-pos-val { font-size:9px;color:var(--av-sky);min-width:36px; }
.av-seq-grid {
  flex:1;overflow-y:auto;padding:14px 18px;
  font-family:'JetBrains Mono',monospace;font-size:11px;
  line-height:1.9;letter-spacing:.12em;
  scrollbar-width:thin;scrollbar-color:var(--av-border) transparent;
}
.av-seq-annotation {
  padding:8px 18px;font-family:'JetBrains Mono',monospace;
  font-size:8px;color:var(--av-dim);letter-spacing:.06em;
  background:rgba(0,10,20,0.7);border-top:1px solid var(--av-border);
  flex-shrink:0;
}
.base-A { color:#87CEEB; }
.base-T { color:#4fc3f7; }
.base-G { color:#b3e5fc; }
.base-C { color:#0288d1; }
.av-seq-row { display:flex;gap:12px;margin-bottom:2px; }
.av-seq-addr { color:var(--av-dim);min-width:52px;user-select:none; }
.av-seq-codon { display:inline-block;margin-right:6px;cursor:default;border-radius:2px;padding:0 2px; }
.av-seq-codon:hover { background:rgba(135,206,235,0.12); }

/* Codon map */
.av-codon-grid {
  flex:1;overflow-y:auto;padding:14px;
  display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;
  scrollbar-width:thin;scrollbar-color:var(--av-border) transparent;
}
.av-codon-card {
  background:rgba(0,20,40,0.6);border:1px solid var(--av-border);
  border-radius:2px;padding:8px;text-align:center;
  transition:all .2s; cursor:default;
}
.av-codon-card:hover { border-color:var(--av-sky);background:rgba(135,206,235,0.07); }
.av-codon-seq { font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.1em;margin-bottom:4px; }
.av-codon-aa  { font-size:7px;letter-spacing:.12em;color:var(--av-dim);margin-bottom:4px; }
.av-codon-bar-wrap { height:3px;background:rgba(135,206,235,0.1);border-radius:2px;overflow:hidden; }
.av-codon-bar { height:100%;background:linear-gradient(90deg,var(--av-deep),var(--av-sky));border-radius:2px; }

/* Analytics */
.av-analytics-grid {
  flex:1;overflow-y:auto;padding:14px;
  display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;
  scrollbar-width:thin;scrollbar-color:var(--av-border) transparent;
}
.av-analytic-card {
  background:rgba(0,15,32,0.7);border:1px solid var(--av-border);
  border-radius:2px;padding:14px;
}
.av-analytic-label { font-size:8px;letter-spacing:.2em;color:var(--av-dim);margin-bottom:8px; }
.av-analytic-val   { font-size:22px;font-weight:700;color:var(--av-sky);text-shadow:0 0 12px var(--av-sky);margin-bottom:6px; }
.av-analytic-sub   { font-size:8px;color:var(--av-dim);letter-spacing:.06em; }
.av-mini-chart     { width:100%;display:block; }
.av-progress-track { height:4px;background:rgba(135,206,235,0.1);border-radius:2px;overflow:hidden; }
.av-progress-fill  { height:100%;background:linear-gradient(90deg,var(--av-deep),var(--av-sky));border-radius:2px;transition:width .6s ease; }
.av-codon-top { display:flex;flex-direction:column;gap:5px;margin-top:4px; }
.av-codon-top-row { display:flex;align-items:center;gap:8px;font-size:8px; }
.av-codon-top-seq  { font-family:'JetBrains Mono',monospace;color:var(--av-sky);width:28px; }
.av-codon-top-aa   { color:var(--av-dim);width:28px; }
.av-codon-top-bar  { flex:1;height:3px;background:rgba(135,206,235,0.1);border-radius:2px;overflow:hidden; }
.av-codon-top-fill { height:100%;background:var(--av-ice);border-radius:2px; }
.av-codon-top-pct  { color:var(--av-dim);width:30px;text-align:right; }
.av-replication-bars { display:flex;flex-direction:column;gap:5px;margin-top:8px; }
.av-rep-row { display:flex;align-items:center;gap:8px;font-size:7px;color:var(--av-dim); }
.av-rep-label { width:60px; }
.av-rep-track { flex:1;height:3px;background:rgba(135,206,235,0.1);border-radius:2px;overflow:hidden; }
.av-rep-fill  { height:100%;border-radius:2px;transition:width .8s ease; }

/* HTML tab */
.av-html-drop {
  flex:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:10px;
  border:2px dashed var(--av-border);margin:14px;border-radius:4px;
  background:rgba(0,10,20,0.4);transition:all .2s;
}
.av-html-drop.drag-over { border-color:var(--av-sky);background:rgba(135,206,235,0.06); }
.av-drop-icon  { font-size:40px;color:var(--av-dim); }
.av-drop-title { font-size:11px;letter-spacing:.2em;color:var(--av-sky); }
.av-drop-sub   { font-size:8px;color:var(--av-dim);letter-spacing:.06em;text-align:center;max-width:300px; }
.av-html-frame {
  flex:1;border:none;width:100%;min-height:0;
  background:#fff;
}
.av-html-frame.hidden { display:none; }

/* Footer */
.av-footer {
  display:flex;align-items:center;gap:12px;padding:8px 18px;
  background:rgba(0,15,30,0.85);border-top:1px solid var(--av-border);
  flex-shrink:0;flex-wrap:wrap;
}
.av-foot-stat { display:flex;flex-direction:column;gap:2px; }
.av-foot-label { font-size:7px;letter-spacing:.16em;color:var(--av-dim); }
.av-foot-sep { width:1px;height:28px;background:var(--av-border); }
.accent { color:var(--av-sky);text-shadow:0 0 6px var(--av-sky); }
`;

// ─── ArchiveViewer class ──────────────────────────────────────
export class ArchiveViewer {
  constructor() {
    this._tab         = 'helix';
    this._helixRaf    = null;
    this._tickerIntvl = null;
    this._scanIntvl   = null;
    this._scanPct     = 0;
    this._seqData     = randSeq(6000);
    this._codonCounts = this._countCodons(this._seqData);
    this._inject();
    this._bind();
    this._buildCodonMap();
    this._buildAnalytics();
    this._startTicker();
    this._startScan();
  }

  // ── Inject HTML + CSS ────────────────────────────────────────
  _inject() {
    // CSS
    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    document.head.appendChild(style);

    // Panel
    const wrap = document.createElement('div');
    wrap.innerHTML = PANEL_HTML;
    document.body.appendChild(wrap.firstElementChild);

    // Trigger button
    const btn = document.createElement('button');
    btn.id        = 'archiveTrigger';
    btn.className = 'crypto-trigger glass';
    btn.style.cssText = 'bottom:100px;right:20px;';
    btn.innerHTML = '⬡ OPEN ARCHIVE';
    document.getElementById('hud').appendChild(btn);

    this._panel  = document.getElementById('archivePanel');
    this._trigger= btn;
  }

  // ── Event bindings ───────────────────────────────────────────
  _bind() {
    this._trigger.addEventListener('click', () => this.open());
    document.getElementById('avClose').addEventListener('click', () => this.close());

    // Tabs
    document.querySelectorAll('.av-tab').forEach(t => {
      t.addEventListener('click', () => this._switchTab(t.dataset.tab));
    });

    // Sequence slider
    const slider = document.getElementById('avSeqPos');
    slider.addEventListener('input', () => {
      document.getElementById('avSeqPosVal').textContent = slider.value;
      this._renderSequence(parseInt(slider.value));
    });

    // File upload — both buttons
    const fileInput = document.getElementById('avFileInput');
    document.getElementById('avUploadBtn').addEventListener('click', () => fileInput.click());
    document.getElementById('avDropUploadBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) this._loadHTMLFile(e.target.files[0]);
    });

    // Drag & drop
    const drop = document.getElementById('avHtmlDrop');
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this._loadHTMLFile(file);
    });
  }

  // ── Tab switching ────────────────────────────────────────────
  _switchTab(tab) {
    this._tab = tab;
    document.querySelectorAll('.av-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    const bodies = { helix:'tabHelix', sequence:'tabSequence', codons:'tabCodons', analytics:'tabAnalytics', html:'tabHtml' };
    Object.entries(bodies).forEach(([k,id]) => {
      document.getElementById(id).classList.toggle('hidden', k !== tab);
    });
    if (tab === 'helix' && !this._helixRunning) this._startHelix();
    if (tab === 'sequence') this._renderSequence(parseInt(document.getElementById('avSeqPos').value));
  }

  // ── Open / Close ─────────────────────────────────────────────
  open() {
    this._panel.classList.add('open');
    requestAnimationFrame(() => this._startHelix());
  }
  close() {
    this._panel.classList.remove('open');
    this._stopHelix();
  }

  // ─────────────────────────────────────────────────────────────
  // 3D HELIX CANVAS (pure Canvas2D, no Three.js dependency here)
  // ─────────────────────────────────────────────────────────────
  _startHelix() {
    if (this._helixRunning) return;
    this._helixRunning = true;
    const canvas = document.getElementById('avHelixCanvas');
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);
    this._helixResizeFn = resize;

    const ctx    = canvas.getContext('2d');
    let   t      = 0;
    const SPEED  = 0.5;

    // Pre-generate random base sequence for rungs
    const SEQ_LEN = 120;
    const seq = Array.from({length:SEQ_LEN}, randBase);

    const loop = () => {
      if (!this._helixRunning) return;
      this._helixRaf = requestAnimationFrame(loop);
      t += SPEED;

      const W  = canvas.width;
      const H  = canvas.height;
      const dpr= devicePixelRatio;
      ctx.clearRect(0, 0, W, H);

      // Background subtle radial
      const grad = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.6);
      grad.addColorStop(0, 'rgba(0,40,80,0.18)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,W,H);

      // Draw multiple helices at different depths
      const helices = [
        { x:W/2, amplitude:W*0.22, yStart:H*0.04, yEnd:H*0.96, strands:2, alpha:0.95, width:2.5*dpr, phase:0 },
        { x:W*0.27, amplitude:W*0.10, yStart:H*0.08, yEnd:H*0.92, strands:2, alpha:0.45, width:1.4*dpr, phase:1.3 },
        { x:W*0.73, amplitude:W*0.10, yStart:H*0.08, yEnd:H*0.92, strands:2, alpha:0.45, width:1.4*dpr, phase:2.6 },
      ];

      helices.forEach(h => {
        this._drawHelix(ctx, h, seq, t, W, H, dpr);
      });
    };
    loop();
  }

  _drawHelix(ctx, h, seq, t, W, H, dpr) {
    const { x, amplitude, yStart, yEnd, alpha, width, phase } = h;
    const totalH  = yEnd - yStart;
    const STEPS   = 180;
    const FREQ    = 3.5; // full twists visible
    const TWO_PI  = Math.PI * 2;

    // Build point arrays for both strands
    const ptsA = [], ptsB = [];
    for (let i = 0; i <= STEPS; i++) {
      const frac  = i / STEPS;
      const y     = yStart + frac * totalH;
      const angle = frac * TWO_PI * FREQ - t * 0.04 + phase;
      const fade  = Math.sin(frac * Math.PI); // fade in/out at ends
      const ax    = x + Math.cos(angle) * amplitude * fade;
      const bx    = x + Math.cos(angle + Math.PI) * amplitude * fade;
      ptsA.push({ x: ax, y, fade });
      ptsB.push({ x: bx, y, fade });
    }

    // Draw strand A
    this._drawStrand(ctx, ptsA, '#87CEEB', alpha, width);
    // Draw strand B
    this._drawStrand(ctx, ptsB, '#4fc3f7', alpha, width);

    // Draw rungs (base pairs)
    const RUNG_STEP = 5;
    for (let i = 0; i < STEPS; i += RUNG_STEP) {
      const a  = ptsA[i];
      const b  = ptsB[i];
      const fa = a.fade * alpha;
      if (fa < 0.05) continue;

      const base = seq[Math.floor(i / RUNG_STEP) % seq.length];
      const col  = BASE_COLOR[base] || '#87CEEB';

      // Rung line
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(179,229,252,${fa * 0.5})`;
      ctx.lineWidth   = 1 * dpr;
      ctx.stroke();

      // End dots
      const dotR = 3.5 * dpr * fa;
      ctx.beginPath();
      ctx.arc(a.x, a.y, dotR, 0, Math.PI*2);
      ctx.fillStyle = col;
      ctx.shadowColor= col;
      ctx.shadowBlur = 8 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(b.x, b.y, dotR, 0, Math.PI*2);
      ctx.fillStyle = col;
      ctx.shadowColor= col;
      ctx.shadowBlur = 8 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawStrand(ctx, pts, color, alpha, width) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);

    const grad = ctx.createLinearGradient(0, pts[0].y, 0, pts[pts.length-1].y);
    grad.addColorStop(0,   `${color}00`);
    grad.addColorStop(0.15,`${color}${Math.round(alpha*255).toString(16).padStart(2,'0')}`);
    grad.addColorStop(0.85,`${color}${Math.round(alpha*255).toString(16).padStart(2,'0')}`);
    grad.addColorStop(1,   `${color}00`);

    ctx.strokeStyle = grad;
    ctx.lineWidth   = width;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 14;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  }

  _stopHelix() {
    this._helixRunning = false;
    if (this._helixRaf) cancelAnimationFrame(this._helixRaf);
    if (this._helixResizeFn) window.removeEventListener('resize', this._helixResizeFn);
  }

  // ── Sequence tab ─────────────────────────────────────────────
  _renderSequence(offset) {
    const grid  = document.getElementById('avSeqGrid');
    const annot = document.getElementById('avSeqAnnot');
    const chunk = this._seqData.slice(offset * 60, offset * 60 + 480);
    grid.innerHTML = '';

    for (let row = 0; row < 8; row++) {
      const slice = chunk.slice(row * 60, row * 60 + 60);
      if (!slice) break;
      const div   = document.createElement('div');
      div.className = 'av-seq-row';
      const addr  = document.createElement('span');
      addr.className   = 'av-seq-addr';
      addr.textContent = String(offset * 60 + row * 60).padStart(7, '0');
      div.appendChild(addr);

      const seq = document.createElement('span');
      // Colour each base, group into codons
      let html = '';
      for (let i = 0; i < slice.length; i += 3) {
        const codon = slice.slice(i, i+3);
        html += `<span class="av-seq-codon" title="${codon}: ${AA[codon]||'???'}">`;
        for (const b of codon) html += `<span class="base-${b}">${b}</span>`;
        html += '</span>';
      }
      seq.innerHTML = html;
      div.appendChild(seq);
      grid.appendChild(div);
    }

    // Annotation line
    const first = chunk.slice(0, 60);
    const aas   = [];
    for (let i = 0; i < Math.min(first.length-2, 20*3); i+=3) {
      const c = first.slice(i,i+3);
      if (c.length === 3) aas.push(`${c}:${AA[c]||'???'}`);
    }
    annot.textContent = aas.join('  ');
  }

  // ── Codon map tab ────────────────────────────────────────────
  _countCodons(seq) {
    const counts = {};
    for (let i = 0; i < seq.length-2; i+=3) {
      const c = seq.slice(i,i+3);
      if (c.length===3) counts[c] = (counts[c]||0)+1;
    }
    return counts;
  }

  _buildCodonMap() {
    const grid = document.getElementById('avCodonGrid');
    const max  = Math.max(...Object.values(this._codonCounts));
    Object.entries(AA).forEach(([codon, aa]) => {
      const count = this._codonCounts[codon] || 0;
      const pct   = max ? count/max : 0;
      const card  = document.createElement('div');
      card.className = 'av-codon-card';
      // Colour the codon letters
      const coloured = [...codon].map(b => `<span class="base-${b}">${b}</span>`).join('');
      card.innerHTML = `
        <div class="av-codon-seq">${coloured}</div>
        <div class="av-codon-aa">${aa}</div>
        <div class="av-codon-bar-wrap">
          <div class="av-codon-bar" style="width:${(pct*100).toFixed(1)}%"></div>
        </div>`;
      grid.appendChild(card);
    });
  }

  // ── Analytics tab ────────────────────────────────────────────
  _buildAnalytics() {
    // GC content chart
    this._drawGCChart();
    // Frequency bars
    this._drawFreqChart();
    // Top codons
    this._buildTopCodons();
    // Replication bars
    this._buildRepBars();
  }

  _drawGCChart() {
    const canvas = document.getElementById('anaGCChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    // Fake GC content rolling line
    const pts = Array.from({length:40}, (_,i) =>
      46 + 4*Math.sin(i*0.5) + rand(-1,1));
    ctx.beginPath();
    pts.forEach((v,i) => {
      const x = (i/(pts.length-1))*W;
      const y = H - (v/60)*H;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = '#87CEEB';
    ctx.shadowBlur  = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  _drawFreqChart() {
    const canvas = document.getElementById('anaFreqChart');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    const freqs = { A:0, T:0, G:0, C:0 };
    for (const b of this._seqData) freqs[b] = (freqs[b]||0)+1;
    const total = this._seqData.length;
    const bars  = Object.entries(freqs);
    const bW    = (W / bars.length) * 0.6;
    const gap   = W / bars.length;
    bars.forEach(([base, count], i) => {
      const pct = count/total;
      const bH  = pct * (H-16);
      const x   = i*gap + (gap-bW)/2;
      const y   = H-bH-16;
      ctx.fillStyle   = BASE_COLOR[base];
      ctx.shadowColor = BASE_COLOR[base];
      ctx.shadowBlur  = 6;
      ctx.fillRect(x, y, bW, bH);
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = 'rgba(135,206,235,0.6)';
      ctx.font        = `9px monospace`;
      ctx.textAlign   = 'center';
      ctx.fillText(base, x+bW/2, H-4);
      ctx.fillText((pct*100).toFixed(1)+'%', x+bW/2, y-3);
    });
  }

  _buildTopCodons() {
    const el   = document.getElementById('anaCodonTop');
    const top5 = Object.entries(this._codonCounts)
      .sort((a,b)=>b[1]-a[1]).slice(0,5);
    const max  = top5[0]?.[1] || 1;
    el.innerHTML = top5.map(([c,n]) => `
      <div class="av-codon-top-row">
        <span class="av-codon-top-seq">${c}</span>
        <span class="av-codon-top-aa">${AA[c]||'???'}</span>
        <div class="av-codon-top-bar">
          <div class="av-codon-top-fill" style="width:${(n/max*100).toFixed(0)}%"></div>
        </div>
        <span class="av-codon-top-pct">${(n/this._seqData.length*300*100).toFixed(1)}%</span>
      </div>`).join('');
  }

  _buildRepBars() {
    const el   = document.getElementById('anaRepBars');
    const rows = [
      { label:'STRAND A', pct:94, col:'#87CEEB' },
      { label:'STRAND B', pct:87, col:'#4fc3f7' },
      { label:'LIGATION', pct:76, col:'#b3e5fc' },
    ];
    el.innerHTML = rows.map(r => `
      <div class="av-rep-row">
        <span class="av-rep-label">${r.label}</span>
        <div class="av-rep-track">
          <div class="av-rep-fill" style="width:${r.pct}%;background:${r.col}"></div>
        </div>
        <span>${r.pct}%</span>
      </div>`).join('');
  }

  // ── Sequence ticker ───────────────────────────────────────────
  _startTicker() {
    const el = document.getElementById('avSeqTicker');
    if (!el) return;
    let pos = 0;
    this._tickerIntvl = setInterval(() => {
      const chunk = this._seqData.slice(pos, pos+80);
      el.textContent = `POS ${String(pos).padStart(7,'0')} › ${chunk}`;
      pos = (pos + 4) % (this._seqData.length - 80);
    }, 120);
  }

  // ── Scan progress ─────────────────────────────────────────────
  _startScan() {
    const bar = document.getElementById('avScanProgress');
    const pct = document.getElementById('avScanPct');
    const statusLabels = ['SCANNING','READING','VERIFYING','MAPPING','ENCODING'];
    const statusEl = document.getElementById('avFootStatus');
    let si = 0;
    this._scanIntvl = setInterval(() => {
      this._scanPct = Math.min(100, this._scanPct + rand(0.05, 0.25));
      if (bar) bar.style.width = this._scanPct + '%';
      if (pct) pct.textContent = this._scanPct.toFixed(1) + '%';
      if (this._scanPct >= 100) {
        this._scanPct = 0;
        si = (si+1) % statusLabels.length;
        if (statusEl) statusEl.textContent = statusLabels[si];
        // Regenerate sequence
        this._seqData     = randSeq(6000);
        this._codonCounts = this._countCodons(this._seqData);
      }
    }, 80);
  }

  // ── Load HTML file ────────────────────────────────────────────
  _loadHTMLFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      // Switch to html tab
      this._switchTab('html');
      const drop  = document.getElementById('avHtmlDrop');
      const frame = document.getElementById('avHtmlFrame');
      drop.classList.add('hidden');
      frame.classList.remove('hidden');
      // Use blob URL so relative paths work
      const blob = new Blob([e.target.result], { type:'text/html' });
      const url  = URL.createObjectURL(blob);
      frame.src  = url;
      frame.onload = () => URL.revokeObjectURL(url);
    };
    reader.readAsText(file);
  }
}
