/**
 * main.js — Holographic DNA Vault entry point
 */

import { DataVault }     from './DataVault.js';
import { CryptoUI }      from './CryptoUI.js';
import { ArchiveViewer } from './ArchiveViewer.js';

const canvas       = document.getElementById('canvas');
const loader       = document.getElementById('loader');
const loaderBar    = document.getElementById('loaderBar');
const loaderSub    = document.getElementById('loaderSub');
const dnaStream    = document.getElementById('dnaStream');
const nodeList     = document.getElementById('nodeList');
const strainId     = document.getElementById('strainId');
const basePairs    = document.getElementById('basePairs');
const integrity    = document.getElementById('integrity');
const coords       = document.getElementById('coords');
const strandCount  = document.getElementById('strandCount');
const timestamp    = document.getElementById('timestamp');
const statusText   = document.getElementById('statusText');
const barDensity   = document.getElementById('barDensity');
const barCoherence = document.getElementById('barCoherence');
const barStability = document.getElementById('barStability');

const BASES = 'ATGC';
const LOAD_STEPS = [
  'Allocating holographic memory...',
  'Bootstrapping quaternary encoder...',
  'Synthesizing DNA strand matrix...',
  'Calibrating beam coherence...',
  'Charging vault resonators...',
  'Validating genome checksums...',
  'Establishing archive nodes...',
  'Loading quantum cipher module...',
  'Mounting genomic archive...',
  'Vault online.',
];
const ARCHIVE_NODES = [
  { id: 'NODE-A1', state: 'active'   },
  { id: 'NODE-B2', state: 'active'   },
  { id: 'NODE-C3', state: 'warn'     },
  { id: 'NODE-D4', state: 'active'   },
  { id: 'NODE-E5', state: 'inactive' },
  { id: 'NODE-F6', state: 'active'   },
];
const STATUS_CYCLE = ['SCANNING','ARCHIVING','VERIFYING','ENCODING','IDLE'];

const rand    = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));

function randomCodon(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += BASES[Math.floor(Math.random() * 4)];
  return s;
}
function formatThousands(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function makeTimestamp() {
  const d  = String(randInt(1,365)).padStart(3,'0');
  const hh = String(randInt(0,23)).padStart(2,'0');
  const mm = String(randInt(0,59)).padStart(2,'0');
  const ss = String(randInt(0,59)).padStart(2,'0');
  return `2157.${d}.${hh}:${mm}:${ss}`;
}

async function runLoader() {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < LOAD_STEPS.length; i++) {
    loaderBar.style.width = ((i + 1) / LOAD_STEPS.length * 100) + '%';
    loaderSub.textContent = LOAD_STEPS[i];
    await delay(i === LOAD_STEPS.length - 1 ? 400 : 280);
  }
  await delay(200);
  loader.classList.add('hidden');
  await delay(800);
  loader.style.display = 'none';
}

let streamLines = [];
function buildStreamLines() {
  dnaStream.innerHTML = '';
  streamLines = [];
  for (let i = 0; i < 8; i++) {
    const div = document.createElement('div');
    div.textContent = randomCodon(24);
    dnaStream.appendChild(div);
    streamLines.push(div);
  }
}
function tickStream() {
  const old = streamLines.shift();
  dnaStream.removeChild(old);
  const div = document.createElement('div');
  div.textContent = randomCodon(24);
  dnaStream.appendChild(div);
  streamLines.push(div);
}

function buildNodeList() {
  nodeList.innerHTML = '';
  ARCHIVE_NODES.forEach(n => {
    const item = document.createElement('div');
    item.className = 'node-item';
    item.innerHTML =
      '<div class="node-dot ' + n.state + '"></div>' +
      '<span>' + n.id + '</span>' +
      '<span style="margin-left:auto;opacity:0.5">' + n.state.toUpperCase() + '</span>';
    nodeList.appendChild(item);
  });
}

let basePairCount = 3247891;
let integrityVal  = 99.97;
let densityVal    = 87;
let coherenceVal  = 94;
let stabilityVal  = 76;
let statusCycle   = 0;
let tsInterval, streamInterval, dataInterval;

function updateHUD(vault) {
  const s  = vault.getCameraState();
  const th = (s.theta * 180 / Math.PI).toFixed(2);
  const ph = (s.phi   * 180 / Math.PI).toFixed(2);
  const rr = s.r.toFixed(2);
  coords.textContent      = 'θ: ' + th + '°  φ: ' + ph + '°  r: ' + rr;
  strandCount.textContent = vault.getStrandCount();
}

function startDataSimulation() {
  tsInterval     = setInterval(() => { timestamp.textContent = makeTimestamp(); }, 1000);
  streamInterval = setInterval(tickStream, 180);
  dataInterval   = setInterval(() => {
    basePairCount += randInt(-200, 500);
    basePairs.textContent = formatThousands(basePairCount);
    integrityVal = Math.max(97, Math.min(100, integrityVal + rand(-0.03, 0.04)));
    integrity.textContent = integrityVal.toFixed(2) + '%';
    densityVal   = Math.max(60, Math.min(99, densityVal   + rand(-1.2, 1.4)));
    coherenceVal = Math.max(70, Math.min(99, coherenceVal + rand(-0.8, 1.0)));
    stabilityVal = Math.max(50, Math.min(99, stabilityVal + rand(-1.5, 1.8)));
    barDensity.style.width   = densityVal   + '%';
    barCoherence.style.width = coherenceVal + '%';
    barStability.style.width = stabilityVal + '%';
    if (Math.random() < 0.08) {
      const hex = Array.from({length:6}, () =>
        Math.floor(Math.random()*16).toString(16).toUpperCase()).join('');
      strainId.textContent = 'SYN-' + hex;
    }
    if (Math.random() < 0.25) {
      statusCycle = (statusCycle + 1) % STATUS_CYCLE.length;
      statusText.textContent = STATUS_CYCLE[statusCycle];
    }
    if (Math.random() < 0.12) {
      const idx  = randInt(0, ARCHIVE_NODES.length - 1);
      const pool = ['active','active','active','warn','inactive'];
      ARCHIVE_NODES[idx].state = pool[randInt(0, pool.length - 1)];
      buildNodeList();
    }
  }, 2000);
}

// ES modules are deferred — DOM is ready here
async function boot() {
  buildStreamLines();
  buildNodeList();

  const loadPromise = runLoader();
  const vault       = new DataVault(canvas);

  // Boot UI modules — DOM is fully available
  new CryptoUI();
  new ArchiveViewer();

  await loadPromise;
  startDataSimulation();

  let hudRaf;
  const hudLoop = () => { updateHUD(vault); hudRaf = requestAnimationFrame(hudLoop); };
  hudLoop();

  window.addEventListener('beforeunload', () => {
    clearInterval(tsInterval);
    clearInterval(streamInterval);
    clearInterval(dataInterval);
    cancelAnimationFrame(hudRaf);
    vault.dispose();
  });
}

boot();
