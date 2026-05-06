/**
 * CryptoUI.js — Quantum DNA Cipher Panel (Sky Blue Edition)
 */
import { encryptDNA, decryptDNA, formatDNAStrand, annotateCodeons } from './QuantumDNACrypto.js';

function scorePassphrase(p){
  if(!p) return{score:0,label:'—',color:'transparent'};
  let s=0;
  if(p.length>=8)s++; if(p.length>=16)s++; if(p.length>=32)s++;
  if(/[a-z]/.test(p))s++; if(/[A-Z]/.test(p))s++;
  if(/[0-9]/.test(p))s++; if(/[^a-zA-Z0-9]/.test(p))s++;
  if(p.length>=48)s++;
  const labels=['Very Weak','Weak','Fair','Moderate','Strong','Very Strong','Excellent','Maximum','QUANTUM-SAFE'];
  const colors =['#ff2244','#ff5500','#ffaa00','#ffdd00','#aaff00','#87CEEB','#4fc3f7','#0288d1','#b3e5fc'];
  return{score:s/8,label:labels[Math.min(s,8)],color:colors[Math.min(s,8)]};
}

const PANEL_HTML=`
<div id="cryptoPanel" class="crypto-panel glass">
  <div class="cp-header">
    <div class="cp-title"><span class="cp-icon">⬡</span>QUANTUM DNA CIPHER</div>
    <button id="cpClose" class="cp-close">✕</button>
  </div>
  <div class="cp-alg-badge">KYBER-1024 · AES-256-GCM · HMAC-SHA-512 · PBKDF2×310k</div>
  <div class="cp-tabs">
    <button class="cp-tab active" data-mode="encrypt">ENCRYPT</button>
    <button class="cp-tab"        data-mode="decrypt">DECRYPT</button>
  </div>
  <div class="cp-field">
    <label class="cp-label" id="inputLabel">PLAINTEXT INPUT</label>
    <textarea id="cpInput" class="cp-textarea" placeholder="Enter data to encrypt into DNA strands..."></textarea>
  </div>
  <div class="cp-field">
    <label class="cp-label">PASSPHRASE</label>
    <div class="cp-pass-wrap">
      <input id="cpPass" class="cp-input" type="password" placeholder="Enter quantum-safe passphrase..." autocomplete="off">
      <button id="cpPassToggle" class="cp-pass-toggle">👁</button>
    </div>
    <div class="cp-entropy-bar-wrap"><div class="cp-entropy-bar" id="cpEntropyBar"></div></div>
    <div class="cp-entropy-label" id="cpEntropyLabel">Passphrase strength: —</div>
  </div>
  <button id="cpAction" class="cp-action"><span id="cpActionLabel">⬡ ENCRYPT TO DNA</span></button>
  <div class="cp-progress-wrap" id="cpProgressWrap" style="display:none">
    <div class="cp-progress-track"><div class="cp-progress-fill" id="cpProgressFill"></div></div>
    <div class="cp-progress-text mono" id="cpProgressText">Initializing...</div>
  </div>
  <div class="cp-field" id="cpOutputField" style="display:none">
    <div class="cp-output-header">
      <label class="cp-label" id="outputLabel">DNA STRAND OUTPUT</label>
      <button id="cpCopy" class="cp-copy-btn">COPY</button>
    </div>
    <textarea id="cpOutput" class="cp-textarea cp-output" readonly></textarea>
  </div>
  <div class="cp-dna-vis" id="cpDnaVis" style="display:none">
    <div class="cp-label">STRAND VISUALIZATION</div>
    <div class="cp-dna-scroll" id="cpDnaScroll"></div>
    <div class="cp-codon-annot" id="cpCodonAnnot"></div>
  </div>
  <div class="cp-meta" id="cpMeta" style="display:none">
    <div class="cp-meta-row"><span class="cp-meta-key">ALGORITHM</span><span class="cp-meta-val mono" id="metaAlg">—</span></div>
    <div class="cp-meta-row"><span class="cp-meta-key">DNA STRANDS</span><span class="cp-meta-val mono accent" id="metaStrands">—</span></div>
    <div class="cp-meta-row"><span class="cp-meta-key">BASE PAIRS</span><span class="cp-meta-val mono" id="metaBP">—</span></div>
    <div class="cp-meta-row"><span class="cp-meta-key">ENTROPY</span><span class="cp-meta-val mono accent" id="metaEntropy">—</span></div>
    <div class="cp-meta-row"><span class="cp-meta-key">AUTH TAG</span><span class="cp-meta-val mono" id="metaTag">—</span></div>
  </div>
  <div class="cp-error"   id="cpError"   style="display:none"></div>
  <div class="cp-success" id="cpSuccess" style="display:none"></div>
</div>`;

export class CryptoUI{
  constructor(){
    this._mode='encrypt'; this._busy=false;
    this._injectStyles(); this._injectHTML(); this._bind();
  }

  _injectStyles(){
    if(document.getElementById('cpStyles')) return;
    const s=document.createElement('style');
    s.id='cpStyles';
    s.textContent=`
      #cpClose{background:none;border:1px solid var(--border);color:var(--dim);width:26px;height:26px;border-radius:2px;cursor:pointer;font-size:11px;font-family:var(--font-mono);}
      #cpClose:hover{color:var(--sky);border-color:var(--sky);}
    `;
    document.head.appendChild(s);
  }

  _injectHTML(){
    const wrap=document.createElement('div');
    wrap.innerHTML=PANEL_HTML;
    document.body.appendChild(wrap.firstElementChild);

    const btn=document.createElement('button');
    btn.id='cryptoTrigger'; btn.className='crypto-trigger glass';
    btn.style.bottom='60px'; btn.innerHTML='⬡ DNA CIPHER';
    document.getElementById('hud').appendChild(btn);

    this._panel=document.getElementById('cryptoPanel');
    this._trigger=btn;
  }

  _bind(){
    this._trigger.addEventListener('click',()=>this.open());
    document.getElementById('cpClose').addEventListener('click',()=>this.close());
    document.querySelectorAll('.cp-tab').forEach(t=>t.addEventListener('click',()=>this._switchMode(t.dataset.mode)));
    document.getElementById('cpPass').addEventListener('input',e=>this._updateStrength(e.target.value));
    document.getElementById('cpPassToggle').addEventListener('click',()=>{
      const i=document.getElementById('cpPass'); i.type=i.type==='password'?'text':'password';
    });
    document.getElementById('cpAction').addEventListener('click',()=>{ if(!this._busy) this._run(); });
    document.getElementById('cpCopy').addEventListener('click',()=>{
      navigator.clipboard.writeText(document.getElementById('cpOutput').value).catch(()=>{});
      const b=document.getElementById('cpCopy'); b.textContent='COPIED!';
      setTimeout(()=>b.textContent='COPY',1500);
    });
  }

  _switchMode(mode){
    this._mode=mode;
    document.querySelectorAll('.cp-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode===mode));
    document.getElementById('inputLabel').textContent  =mode==='encrypt'?'PLAINTEXT INPUT':'ENCRYPTED ENVELOPE (JSON)';
    document.getElementById('outputLabel').textContent =mode==='encrypt'?'DNA STRAND OUTPUT':'DECRYPTED PLAINTEXT';
    document.getElementById('cpActionLabel').textContent=mode==='encrypt'?'⬡ ENCRYPT TO DNA':'⬡ DECRYPT FROM DNA';
    document.getElementById('cpInput').placeholder     =mode==='encrypt'?'Enter data to encrypt into DNA strands...':'Paste the full JSON envelope here...';
    this._resetOutput();
  }

  _updateStrength(p){
    const{score,label,color}=scorePassphrase(p);
    const bar=document.getElementById('cpEntropyBar');
    bar.style.width=(score*100)+'%'; bar.style.background=color; bar.style.boxShadow=`0 0 8px ${color}`;
    document.getElementById('cpEntropyLabel').textContent='Passphrase strength: '+label;
  }

  async _run(){
    const input=document.getElementById('cpInput').value.trim();
    const pass =document.getElementById('cpPass').value;
    this._clearMessages();
    if(!input) return this._showError('Input is empty.');
    if(!pass)  return this._showError('Passphrase is required.');
    this._busy=true; this._resetOutput(); this._showProgress(true);
    const onP=(msg,pct)=>{
      document.getElementById('cpProgressText').textContent=msg;
      document.getElementById('cpProgressFill').style.width=pct+'%';
    };
    try{
      if(this._mode==='encrypt') await this._doEncrypt(input,pass,onP);
      else                       await this._doDecrypt(input,pass,onP);
    }catch(err){ this._showError(err.message||'Unknown error.'); }
    finally{ this._busy=false; this._showProgress(false); }
  }

  async _doEncrypt(pt,pass,onP){
    const env=await encryptDNA(pt,pass,onP);
    document.getElementById('cpOutput').value=JSON.stringify(env,null,2);
    document.getElementById('cpOutputField').style.display='block';
    // DNA vis
    const preview=env.dna.slice(0,300);
    const scroll=document.getElementById('cpDnaScroll'); scroll.innerHTML='';
    formatDNAStrand(preview,60).split('\n').forEach((line,i)=>{
      const d=document.createElement('div'); d.className='cp-dna-line';
      d.innerHTML=`<span class="cp-dna-addr">${String(i*20).padStart(6,'0')}</span>${this._colorBases(line)}`;
      scroll.appendChild(d);
    });
    document.getElementById('cpCodonAnnot').textContent=annotateCodeons(env.dna,12);
    document.getElementById('cpDnaVis').style.display='block';
    this._showMeta(env);
    this._showSuccess(`Encrypted → ${env.meta.basePairs.toLocaleString()} base pairs / ${env.meta.strands} strands.`);
  }

  async _doDecrypt(input,pass,onP){
    let env;
    try{ env=JSON.parse(input); }catch{ throw new Error('Input is not valid JSON. Paste the full envelope.'); }
    const pt=await decryptDNA(env,pass,onP);
    document.getElementById('cpOutput').value=pt;
    document.getElementById('cpOutputField').style.display='block';
    if(env.meta) this._showMeta(env);
    this._showSuccess('Decryption successful — HMAC-SHA-512 verified.');
  }

  _colorBases(line){
    return line.replace(/[ATGC]/g,b=>{
      const c={A:'#87CEEB',T:'#4fc3f7',G:'#b3e5fc',C:'#0288d1'};
      return `<span style="color:${c[b]}">${b}</span>`;
    });
  }

  _showMeta(env){
    document.getElementById('metaAlg').textContent    =env.alg||'—';
    document.getElementById('metaStrands').textContent=(env.meta?.strands||0).toLocaleString();
    document.getElementById('metaBP').textContent     =(env.meta?.basePairs||0).toLocaleString();
    document.getElementById('metaEntropy').textContent=env.meta?.entropy?env.meta.entropy+' bits/sym':'—';
    document.getElementById('metaTag').textContent    =env.tag?env.tag.slice(0,24)+'...':'—';
    document.getElementById('cpMeta').style.display   ='block';
  }

  _showProgress(show){
    document.getElementById('cpProgressWrap').style.display=show?'block':'none';
    if(show) document.getElementById('cpProgressFill').style.width='0%';
  }

  _resetOutput(){
    document.getElementById('cpOutputField').style.display='none';
    document.getElementById('cpDnaVis').style.display='none';
    document.getElementById('cpMeta').style.display='none';
    document.getElementById('cpOutput').value='';
  }

  _clearMessages(){
    document.getElementById('cpError').style.display='none';
    document.getElementById('cpSuccess').style.display='none';
  }

  _showError(msg){
    const e=document.getElementById('cpError'); e.textContent='⚠ '+msg; e.style.display='block';
  }

  _showSuccess(msg){
    const e=document.getElementById('cpSuccess'); e.textContent='✓ '+msg; e.style.display='block';
  }

  open() { this._panel.classList.add('open'); }
  close(){ this._panel.classList.remove('open'); }
}
