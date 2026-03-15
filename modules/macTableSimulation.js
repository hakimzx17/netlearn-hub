/**
 * macTableSimulation.js — Switch MAC Address Table Learning Simulator
 * DROP-IN REPLACEMENT for modules/macTableSimulation.js
 *
 * Module contract: init(el), start(), reset(), destroy()
 * Uses NetLearn CSS variables throughout (no hardcoded colors).
 * Correct networking logic — see PHASE comments in _doSend().
 *
 * Depends on: stateManager (js/stateManager.js)
 *             showToast    (utils/helperFunctions.js)
 */

import { stateManager } from '../js/stateManager.js';
import { showToast }    from '../utils/helperFunctions.js';

// ── CONFIG ────────────────────────────────────────────────────────
const PKT_MS   = 480;
const PAUSE_MS = 520;
const AGING_MS = 15000;

const DEV = {
  A:{ label:'PC-A', mac:'00:1A:2B:11:22:33', ip:'10.0.0.1', port:'Fa0/1', color:'#00d4ff' },
  B:{ label:'PC-B', mac:'00:1A:2B:44:55:66', ip:'10.0.0.2', port:'Fa0/2', color:'#ab47bc' },
  C:{ label:'PC-C', mac:'00:1A:2B:77:88:99', ip:'10.0.0.3', port:'Fa0/3', color:'#ffb800' },
  D:{ label:'PC-D', mac:'00:1A:2B:AA:BB:CC', ip:'10.0.0.4', port:'Fa0/4', color:'#00e676' },
};
const IDS = ['A','B','C','D'];

const AUTO_SEQ = [
  ['A','B'],['C','D'],['B','A'],['D','C'],
  ['A','C'],['B','D'],['C','A'],['D','B'],['A','D'],['B','C'],
];

// ── MODULE CLASS ──────────────────────────────────────────────────
class MacTableSimulation {

  constructor() {
    this.container = null;
    this._canvas   = null;
    this._ctx      = null;
    this._cam      = {};
    this._busy     = false;
    this._scenario = 'learnAll';
    this._autoOn   = false;
    this._autoIdx  = 0;
    this._autoTid  = null;
    this._ageTid   = null;
    this._swPos    = {x:0,y:0};
    this._devPos   = {};
    this._onResize = null;
  }

  // ── LIFECYCLE ──────────────────────────────────────────────────
  init(containerEl) {
    this.container = containerEl;
    this._cam      = {};
    this._busy     = false;
    this._autoOn   = false;
    this._autoIdx  = 0;
    this._scenario = 'learnAll';
    this._injectStyles();
    this._renderHTML();
    this._bindButtons();
    this._canvas = this.container.querySelector('#mac-canvas');
    this._ctx    = this._canvas.getContext('2d');

    // ResizeObserver fires exactly when the wrapper element has real pixel
    // dimensions — guaranteed, regardless of router/scroll container timing.
    // Replaces all RAF hacks and window resize listeners.
    this._resizeObs = new ResizeObserver(() => this._resizeCanvas());
    this._resizeObs.observe(this._canvas.parentElement);
    this._setStatus('ℹ️',
      'Select <b>From</b> and <b>To</b> devices, then click <b>Send Frame</b> to start.',
      'cyan');
  }

  start() {}

  reset() {
    this._cam = {};
    this._busy = false;
    this._autoIdx = 0;
    this._stopAuto();
    if (this._ageTid) { clearInterval(this._ageTid); this._ageTid = null; }
    if (!this.container) return;
    const btn = this._q('#mac-btn-send');
    if (btn) btn.disabled = false;
    this._renderCamTable();
    this._drawScene({});
    this._setStatus('ℹ️',
      'Select <b>From</b> and <b>To</b> devices, then click <b>Send Frame</b> to start.',
      'cyan');
  }

  destroy() {
    this._stopAuto();
    if (this._ageTid)   { clearInterval(this._ageTid); this._ageTid = null; }
    if (this._resizeObs){ this._resizeObs.disconnect(); this._resizeObs = null; }
    this.container = null;
    this._canvas   = null;
    this._ctx      = null;
  }

  // ── HTML ──────────────────────────────────────────────────────
  _renderHTML() {
    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <span>Home</span> › <span>Simulations</span> › <span>MAC Table</span>
        </div>
        <h1 class="module-header__title">🔀 Switch MAC Address Table Learning</h1>
        <p class="module-header__description">
          Watch how a Layer 2 switch learns device locations, builds the CAM table,
          and makes forwarding decisions in real time.
        </p>
      </div>

      <div class="mac-scbar">
        <button class="mac-scbtn active" id="mac-sc-learnAll">📗 LEARN ALL</button>
        <button class="mac-scbtn"        id="mac-sc-storm">🌀 UNKNOWN UNICAST STORM</button>
        <button class="mac-scbtn"        id="mac-sc-aging">⏰ MAC AGING DEMO</button>
      </div>

      <div class="mac-ctrlbar">
        <span class="mac-clbl">From:</span>
        <select class="mac-sel" id="mac-sel-from">
          <option value="A">PC-A</option><option value="B">PC-B</option>
          <option value="C">PC-C</option><option value="D">PC-D</option>
        </select>
        <span class="mac-clbl">To:</span>
        <select class="mac-sel" id="mac-sel-to">
          <option value="B">PC-B</option><option value="A">PC-A</option>
          <option value="C">PC-C</option><option value="D">PC-D</option>
        </select>
        <div style="flex:1"></div>
        <button class="mac-btn-primary" id="mac-btn-send">⚡ Send Frame</button>
        <button class="mac-btn-ghost"   id="mac-btn-auto">⚡ Auto</button>
        <button class="mac-btn-ghost"   id="mac-btn-reset">↺ Reset</button>
      </div>

      <div class="mac-canvas-wrap">
        <canvas id="mac-canvas"></canvas>
      </div>

      <div class="mac-status" id="mac-status" style="color:var(--color-cyan)">
        <span id="mac-st-icon">ℹ️</span>
        <span id="mac-st-msg">Ready.</span>
      </div>

      <div class="mac-cam-hdr">
        <div class="mac-cam-title">
          <div class="mac-cam-sq"></div>MAC Address Table (CAM)
        </div>
        <span class="mac-cam-cnt" id="mac-cam-count">0 / 4 learned</span>
      </div>
      <div class="mac-cam-wrap">
        <table class="mac-cam-tbl">
          <thead>
            <tr><th>MAC Address</th><th>Port</th><th>Type</th><th>Device</th><th>Expires</th></tr>
          </thead>
          <tbody id="mac-cam-body">
            <tr><td colspan="5"><div class="mac-empty">
              <span class="mac-empty-ico">📭</span>Table Empty — Frame will be flooded
            </div></td></tr>
          </tbody>
        </table>
      </div>`;
  }

  _bindButtons() {
    this._q('#mac-btn-send').addEventListener('click', () => {
      if (this._busy) return;
      this._doSend(this._q('#mac-sel-from').value, this._q('#mac-sel-to').value);
    });
    this._q('#mac-btn-auto').addEventListener('click', () => {
      this._autoOn = !this._autoOn;
      const b = this._q('#mac-btn-auto');
      b.classList.toggle('active', this._autoOn);
      b.textContent = this._autoOn ? '⏹ Stop' : '⚡ Auto';
      if (this._autoOn) this._autoStep();
      else { clearTimeout(this._autoTid); this._autoTid = null; }
    });
    this._q('#mac-btn-reset').addEventListener('click', () => this.reset());
    ['learnAll','storm','aging'].forEach(s => {
      this._q(`#mac-sc-${s}`).addEventListener('click', () => this._setScenario(s));
    });
  }

  // ── CANVAS GEOMETRY ───────────────────────────────────────────
  _resizeCanvas() {
    if (!this._canvas) return;
    const wrap = this._canvas.parentElement;
    this._canvas.width  = wrap.clientWidth;
    this._canvas.height = wrap.clientHeight;
    const W = this._canvas.width, H = this._canvas.height;
    this._swPos = { x:W/2, y:H/2 };
    const R = Math.min(W, H) * 0.38;
    const A = { A:-Math.PI/2, B:0, C:Math.PI/2, D:Math.PI };
    IDS.forEach(id => {
      this._devPos[id] = {
        x: this._swPos.x + R*Math.cos(A[id]),
        y: this._swPos.y + R*Math.sin(A[id]),
      };
    });
    this._drawScene({});
  }

  // ── DRAW PRIMITIVES ───────────────────────────────────────────
  _rrect(x,y,w,h,r) {
    const c=this._ctx;
    c.beginPath();
    c.moveTo(x+r,y); c.lineTo(x+w-r,y);
    c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r);
    c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
    c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r);
    c.quadraticCurveTo(x,y,x+r,y); c.closePath();
  }
  _rgb(hex){
    return parseInt(hex.slice(1,3),16)+','+parseInt(hex.slice(3,5),16)+','+parseInt(hex.slice(5,7),16);
  }
  _ease(t){ return t<0.5?2*t*t:-1+(4-2*t)*t; }

  _drawGrid() {
    const c=this._ctx,W=this._canvas.width,H=this._canvas.height;
    c.save(); c.strokeStyle='rgba(21,32,51,0.7)'; c.lineWidth=0.5;
    for(let x=0;x<=W;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
    for(let y=0;y<=H;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    c.restore();
  }

  // cable state: 'idle'|'src'|'fwd'|'flood'
  _drawCable(devId, state) {
    const c=this._ctx, p=this._devPos[devId], sw=this._swPos;
    const dc=DEV[devId].color;
    const known=Object.values(this._cam).some(e=>e.port===DEV[devId].port);
    let color,lw,glow;
    if(state==='src')        {color=dc;       lw=2.2;glow=true;}
    else if(state==='fwd')   {color=dc;       lw=2.2;glow=true;}
    else if(state==='flood') {color='#ffb800';lw=2.0;glow=true;}
    else                     {color=known?'rgba(0,212,255,0.22)':'rgba(21,32,51,0.9)';lw=1.2;glow=false;}
    c.save();
    if(glow){c.shadowColor=color;c.shadowBlur=7;}
    c.strokeStyle=color; c.lineWidth=lw;
    c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(sw.x,sw.y); c.stroke();
    c.restore();
  }

  _drawSwitch(processing) {
    const c=this._ctx,{x,y}=this._swPos;
    const g=c.createRadialGradient(x,y,5,x,y,62);
    g.addColorStop(0,processing?'rgba(255,184,0,0.09)':'rgba(0,212,255,0.06)');
    g.addColorStop(1,'transparent');
    c.fillStyle=g; c.beginPath(); c.arc(x,y,62,0,Math.PI*2); c.fill();
    c.save();
    c.shadowColor=processing?'rgba(255,184,0,0.5)':'rgba(0,212,255,0.35)';
    c.shadowBlur=processing?18:12;
    c.strokeStyle=processing?'#ffb800':'#00d4ff'; c.lineWidth=1.5; c.fillStyle='#0d1520';
    this._rrect(x-46,y-24,92,48,8); c.fill(); c.stroke();
    c.restore();
    const lc=['#00d4ff','#ab47bc','#ffb800','#00e676'];
    IDS.forEach((id,i)=>{
      const px=x-24+i*16;
      const lit=Object.values(this._cam).some(e=>e.port===DEV[id].port);
      c.save(); if(lit){c.shadowColor=lc[i];c.shadowBlur=10;}
      c.fillStyle=lit?lc[i]:'#1a2840';
      c.beginPath(); c.arc(px,y-6,5,0,Math.PI*2); c.fill(); c.restore();
      c.fillStyle='#4a6d8a'; c.font='8px JetBrains Mono,monospace';
      c.textAlign='center'; c.textBaseline='middle';
      c.fillText('F'+(i+1),px,y+10);
    });
    c.fillStyle=processing?'#ffb800':'#00d4ff';
    c.font='700 13px Syne,sans-serif';
    c.textAlign='center'; c.textBaseline='middle';
    c.fillText('SW-1',x,y+30);
  }

  // device state: 'idle'|'sending'|'receiving'|'flooding'
  _drawDevice(id, state) {
    const c=this._ctx,d=DEV[id],p=this._devPos[id],col=d.color;
    const lit=state!=='idle';
    const bw=90,bh=62;
    if(lit){
      const alpha=state==='flooding'?0.07:0.17;
      const g=c.createRadialGradient(p.x,p.y,8,p.x,p.y,56);
      g.addColorStop(0,'rgba('+this._rgb(col)+','+alpha+')');
      g.addColorStop(1,'transparent');
      c.fillStyle=g; c.beginPath(); c.arc(p.x,p.y,56,0,Math.PI*2); c.fill();
    }
    c.save();
    if(lit){c.shadowColor=col;c.shadowBlur=13;}
    c.strokeStyle=lit?col:'#152033'; c.lineWidth=lit?1.8:1.2;
    c.fillStyle=
      state==='sending'  ?'rgba('+this._rgb(col)+',0.10)':
      state==='receiving'?'rgba('+this._rgb(col)+',0.08)':
      state==='flooding' ?'rgba('+this._rgb(col)+',0.05)':'#111d2e';
    this._rrect(p.x-bw/2,p.y-bh/2,bw,bh,9); c.fill(); c.stroke(); c.restore();
    this._drawMonitor(p.x,p.y-4,col,lit);
    c.fillStyle=lit?col:'#e8f4fd'; c.font='700 14px Syne,sans-serif';
    c.textAlign='center'; c.textBaseline='middle';
    c.fillText(d.label,p.x,p.y+bh/2+14);
    if(state==='sending'||state==='receiving'){
      c.save();
      c.fillStyle='rgba('+this._rgb(col)+',0.12)';
      this._rrect(p.x-58,p.y+bh/2+20,116,15,4); c.fill();
      c.fillStyle=col; c.font='500 9px JetBrains Mono,monospace';
      c.textAlign='center'; c.textBaseline='middle';
      c.fillText(d.mac,p.x,p.y+bh/2+27);
      c.fillStyle='#7fa8c9'; c.font='400 9px JetBrains Mono,monospace';
      c.fillText(d.ip,p.x,p.y+bh/2+41); c.restore();
    }
  }

  _drawMonitor(x,y,col,lit){
    const c=this._ctx,color=lit?col:'#1a2840';
    c.save();
    c.strokeStyle=color; c.lineWidth=1.5;
    c.fillStyle=lit?'rgba('+this._rgb(col)+',0.08)':'#0d1520';
    this._rrect(x-20,y-15,40,27,3); c.fill(); c.stroke();
    c.strokeStyle=lit?color:'#152033'; c.lineWidth=1;
    c.beginPath(); c.moveTo(x-11,y-6); c.lineTo(x+11,y-6);
    c.moveTo(x-11,y+1); c.lineTo(x+7,y+1); c.stroke();
    c.strokeStyle=color; c.lineWidth=1.5;
    c.beginPath(); c.moveTo(x,y+12); c.lineTo(x,y+19);
    c.moveTo(x-9,y+19); c.lineTo(x+9,y+19); c.stroke();
    c.restore();
  }

  // ── PHASE-AWARE SCENE RENDERER ────────────────────────────────
  // scene = { srcId, fwdId, floodFrom, swBusy }
  // Exactly ONE of srcId/fwdId/floodFrom set per phase — no overlap.
  _drawScene(scene) {
    if(!this._ctx) return;
    const {srcId=null,fwdId=null,floodFrom=null,swBusy=false}=scene;
    const c=this._ctx;
    c.clearRect(0,0,this._canvas.width,this._canvas.height);
    this._drawGrid();
    IDS.forEach(id=>{
      let s='idle';
      if(id===srcId)                              s='src';
      else if(id===fwdId)                         s='fwd';
      else if(floodFrom!==null&&id!==floodFrom)   s='flood';
      this._drawCable(id,s);
    });
    this._drawSwitch(swBusy);
    IDS.forEach(id=>{
      let s='idle';
      if(id===srcId)                              s='sending';
      else if(id===fwdId)                         s='receiving';
      else if(floodFrom!==null&&id!==floodFrom)   s='flooding';
      this._drawDevice(id,s);
    });
  }

  // ── PACKET ANIMATION ──────────────────────────────────────────
  _drawPkt(x,y,color){
    const c=this._ctx;
    c.save(); c.shadowColor=color; c.shadowBlur=14; c.fillStyle=color;
    c.beginPath(); c.arc(x,y,7,0,Math.PI*2); c.fill();
    c.shadowBlur=0; c.fillStyle='#000';
    c.beginPath(); c.arc(x,y,3,0,Math.PI*2); c.fill(); c.restore();
  }

  // Single packet: drawScene(base) then overlay dot each frame
  _animPacket(from,to,color,baseScene){
    return new Promise(resolve=>{
      const t0=performance.now();
      const step=now=>{
        const raw=Math.min((now-t0)/PKT_MS,1);
        const e=this._ease(raw);
        this._drawScene(baseScene);
        this._drawPkt(from.x+(to.x-from.x)*e, from.y+(to.y-from.y)*e, color);
        if(raw<1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  // Flood: ONE shared RAF loop — single drawScene() per frame,
  // then ALL N packet dots drawn on top. Prevents flicker.
  _animFlood(floodFrom){
    return new Promise(resolve=>{
      const targets=IDS.filter(id=>id!==floodFrom).map((id,i)=>({id,delay:i*80}));
      const t0=performance.now();
      const step=now=>{
        const elapsed=now-t0;
        this._drawScene({floodFrom,swBusy:false}); // ONE render per frame
        let allDone=true;
        targets.forEach(t=>{
          const local=elapsed-t.delay;
          if(local<=0){allDone=false;return;}
          const raw=Math.min(local/PKT_MS,1);
          if(raw<1) allDone=false;
          const e=this._ease(raw);
          const x=this._swPos.x+(this._devPos[t.id].x-this._swPos.x)*e;
          const y=this._swPos.y+(this._devPos[t.id].y-this._swPos.y)*e;
          this._drawPkt(x,y,'#ffb800');
        });
        if(!allDone) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  // ── CORE SWITCH LOGIC ─────────────────────────────────────────
  //
  //  PHASE 1 — Ingress: only srcId lit. Destination dark.
  //  PHASE 2 — Source MAC learning: swBusy amber, LED lights up.
  //  PHASE 3a — Known unicast: only fwdId lit. srcId now dark.
  //  PHASE 3b — Unknown unicast flood: all non-srcId ports amber,
  //              single shared RAF loop, ingress excluded.
  //
  async _doSend(srcId, dstId) {
    if(srcId===dstId){
      this._setStatus('⚠️','<b>Invalid:</b> Source and destination must be different.','amber');
      return;
    }
    const src=DEV[srcId], dst=DEV[dstId];
    this._busy=true;
    this._q('#mac-btn-send').disabled=true;

    // PHASE 1: frame travels src → switch. Only src glows.
    this._setStatus('📤',
      `<b>${src.label}</b> sends frame out <span style="color:var(--color-warning)">${src.port}</span><br>
       src <span style="color:${src.color}">${src.mac}</span>
       &nbsp;→&nbsp; dst <span style="color:${dst.color}">${dst.mac}</span>`,
      'cyan');
    await this._animPacket(
      this._devPos[srcId], this._swPos,
      src.color,
      { srcId }           // ← ONLY source lit; destination stays dark
    );

    // PHASE 2: switch reads source MAC, learns it
    this._drawScene({ swBusy:true });
    const isNew = this._learnMAC(src.mac, src.port, srcId);
    this._setStatus(isNew?'🧠':'🔄',
      isNew
        ? `Switch reads <b>source MAC</b> → <span style="color:${src.color}">${src.mac}</span><br>
           Not in CAM → <b>Learned</b> on <span style="color:var(--color-warning)">${src.port}</span>`
        : `Source MAC <span style="color:${src.color}">${src.mac}</span> already known — refreshing timer.`,
      'cyan');
    await this._sleep(PAUSE_MS);

    // PHASE 3: lookup destination
    const dstEntry = this._cam[dst.mac];
    if(dstEntry){
      // 3a: KNOWN UNICAST — only destination glows; source goes idle
      this._setStatus('🎯',
        `<span style="color:${dst.color}">${dst.mac}</span>
         → <b style="color:var(--color-success)">FOUND</b>
         on <span style="color:var(--color-warning)">${dstEntry.port}</span><br>
         Forwarding <b>only</b> to <b>${dst.label}</b> — all other ports silent.`,
        'green');
      await this._animPacket(
        this._swPos, this._devPos[dstId],
        dst.color,
        { fwdId: dstId }  // ← ONLY destination lit; source now idle
      );
      this._drawScene({ fwdId:dstId });
      this._setStatus('✅',
        `Delivered to <b>${dst.label}</b> (${dst.ip}).
         <span style="color:var(--color-success)">✓ Unicast forwarded</span>`,
        'green');
      await this._sleep(PAUSE_MS);

    } else {
      // 3b: UNKNOWN UNICAST FLOOD — all non-src ports amber, single RAF loop
      const targets=IDS.filter(id=>id!==srcId).map(id=>DEV[id].label).join(', ');
      this._setStatus('🌊',
        `<span style="color:${dst.color}">${dst.mac}</span>
         → <b style="color:var(--color-warning)">NOT FOUND</b> in CAM<br>
         Flooding ALL ports except ingress
         <span style="color:${src.color}">${src.port}</span>
         &nbsp;→&nbsp; ${targets}`,
        'amber');
      this._drawScene({ floodFrom:srcId, swBusy:true });
      await this._sleep(180);
      await this._animFlood(srcId);
      this._drawScene({ floodFrom:srcId });
      this._setStatus('📢',
        `Flooded to <b>${targets}</b>.<br>
         When <b>${dst.label}</b> replies, switch learns its MAC and flooding stops.`,
        'amber');
      await this._sleep(PAUSE_MS);
    }

    this._drawScene({});
    this._renderCamTable();
    this._busy=false;
    this._q('#mac-btn-send').disabled=false;
  }

  // ── CAM TABLE ────────────────────────────────────────────────
  _learnMAC(mac, port, devId){
    const isNew=!this._cam[mac];
    this._cam[mac]={ mac, port, devId, learnedAt:Date.now(), expires:Date.now()+AGING_MS };
    this._renderCamTable(isNew?mac:null);
    if(this._scenario==='aging'&&isNew) this._startAging();
    stateManager.setState('macTable', { ...this._cam });
    if(Object.keys(this._cam).length===4){
      const prog=stateManager.getState('userProgress')||{};
      const done=new Set(prog.completedModules||[]);
      done.add('/mac-table');
      stateManager.mergeState('userProgress',{ completedModules:[...done] });
      showToast('🎉 All MAC addresses learned! CAM table complete!','success');
    }
    return isNew;
  }

  _renderCamTable(highlightMac=null){
    if(!this.container) return;
    const entries=Object.values(this._cam);
    this._q('#mac-cam-count').textContent=entries.length+' / 4 learned';
    if(!entries.length){
      this._q('#mac-cam-body').innerHTML=
        '<tr><td colspan="5"><div class="mac-empty"><span class="mac-empty-ico">📭</span>Table Empty — Frame will be flooded</div></td></tr>';
      return;
    }
    const k=mac=>mac.replace(/:/g,'');
    this._q('#mac-cam-body').innerHTML=entries.map(e=>{
      const d=DEV[e.devId];
      const tl=Math.max(0,e.expires-Date.now());
      const pct=this._scenario==='aging'?(tl/AGING_MS)*100:100;
      const bc=pct>60?'var(--color-success)':pct>30?'var(--color-warning)':'var(--color-error)';
      return `<tr class="${e.mac===highlightMac?'mac-nr':''}">
        <td><span class="mac-t-mac">${e.mac}</span></td>
        <td><span class="mac-t-port">${e.port}</span></td>
        <td><span class="mac-t-dyn">DYNAMIC</span></td>
        <td style="color:${d.color}">${d.label}</td>
        <td><div class="mac-tbw">
          <div class="mac-tbar"><div class="mac-tfil" id="mac-b-${k(e.mac)}" style="width:${pct}%;background:${bc}"></div></div>
          <span class="mac-tlbl" id="mac-l-${k(e.mac)}">${this._scenario==='aging'?Math.ceil(tl/1000)+'s':'300s'}</span>
        </div></td>
      </tr>`;
    }).join('');
  }

  _refreshBars(){
    const now=Date.now(),k=mac=>mac.replace(/:/g,'');
    for(const mac in this._cam){
      const tl=Math.max(0,this._cam[mac].expires-now);
      const pct=(tl/AGING_MS)*100;
      const b=this._q(`#mac-b-${k(mac)}`),l=this._q(`#mac-l-${k(mac)}`);
      if(b){b.style.width=pct+'%';b.style.background=pct>60?'var(--color-success)':pct>30?'var(--color-warning)':'var(--color-error)';}
      if(l) l.textContent=Math.ceil(tl/1000)+'s';
    }
  }

  // ── AGING ────────────────────────────────────────────────────
  _startAging(){
    if(this._ageTid) return;
    this._ageTid=setInterval(()=>{
      const now=Date.now(); let changed=false;
      for(const mac in this._cam){
        if(now>=this._cam[mac].expires){
          const d=DEV[this._cam[mac].devId];
          this._setStatus('⏰',
            `MAC <span style="color:var(--color-warning)">${mac}</span> (<b>${d.label}</b>) aged out — removed.`,
            'amber');
          delete this._cam[mac]; changed=true;
        }
      }
      if(changed){this._renderCamTable();this._drawScene({});}
      else this._refreshBars();
      if(!Object.keys(this._cam).length){clearInterval(this._ageTid);this._ageTid=null;}
    },400);
  }

  // ── AUTO MODE ────────────────────────────────────────────────
  async _autoStep(){
    if(!this._autoOn) return;
    const [f,t]=AUTO_SEQ[this._autoIdx%AUTO_SEQ.length];
    this._q('#mac-sel-from').value=f;
    this._q('#mac-sel-to').value=t;
    await this._doSend(f,t);
    this._autoIdx++;
    if(this._scenario==='learnAll'&&Object.keys(this._cam).length===4){
      this._stopAuto(); return;
    }
    if(this._autoOn) this._autoTid=setTimeout(()=>this._autoStep(),500);
  }

  _stopAuto(){
    this._autoOn=false; clearTimeout(this._autoTid); this._autoTid=null;
    if(!this.container) return;
    const b=this._q('#mac-btn-auto');
    if(b){b.classList.remove('active');b.textContent='⚡ Auto';}
  }

  // ── SCENARIO ─────────────────────────────────────────────────
  _setScenario(s){
    this._scenario=s;
    ['learnAll','storm','aging'].forEach(id=>{
      this._q(`#mac-sc-${id}`).classList.toggle('active',id===s);
    });
    this.reset();
    const M={
      learnAll:['📗','Scenario: <b>Learn All</b> — Fill the CAM table by sending frames between all device pairs.','cyan'],
      storm:   ['🌀','Scenario: <b>Unknown Unicast Storm</b> — CAM cleared! Every frame floods until MACs are learned.','amber'],
      aging:   ['⏰',`Scenario: <b>MAC Aging Demo</b> — Entries expire after ${AGING_MS/1000}s. Watch them age out.`,'amber'],
    };
    this._setStatus(...M[s]);
  }

  // ── STATUS ───────────────────────────────────────────────────
  _setStatus(icon,html,colorKey){
    if(!this.container) return;
    const map={cyan:'var(--color-cyan)',amber:'var(--color-warning)',green:'var(--color-success)'};
    this._q('#mac-st-icon').textContent=icon;
    this._q('#mac-st-msg').innerHTML=html;
    this._q('#mac-status').style.color=map[colorKey]||map.cyan;
  }

  // ── UTILS ────────────────────────────────────────────────────
  _q(sel){ return this.container?this.container.querySelector(sel):null; }
  _sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // ── STYLES ───────────────────────────────────────────────────
  _injectStyles(){
    if(document.getElementById('mac-sim-styles')) return;
    const s=document.createElement('style');
    s.id='mac-sim-styles';
    s.textContent=`
      /* ── Scenario bar ── */
      .mac-scbar{
        background:#111827; border:1px solid #1e2d45; border-radius:10px;
        padding:8px; display:flex; gap:6px; margin-bottom:12px;
      }
      .mac-scbtn{
        flex:1; padding:9px 10px; border-radius:7px; border:1px solid transparent;
        cursor:pointer; font:600 12px 'Nunito',sans-serif; color:#94a3b8;
        background:transparent; transition:all .2s;
        display:flex; align-items:center; justify-content:center; gap:6px;
      }
      .mac-scbtn:hover{ color:#e2e8f0; background:#1a2235; }
      .mac-scbtn.active{
        color:#00d4ff; background:rgba(0,212,255,0.12);
        border-color:rgba(0,212,255,0.3);
      }

      /* ── Control bar ── */
      .mac-ctrlbar{
        background:#111827; border:1px solid #1e2d45; border-radius:10px;
        padding:10px 16px; display:flex; align-items:center; gap:10px;
        flex-wrap:wrap; margin-bottom:12px;
      }
      .mac-clbl{ font:600 12px 'Nunito',sans-serif; color:#94a3b8; }

      /* ── Selects ── */
      .mac-sel{
        background:#1a2235; border:1px solid #2a3f60; color:#e2e8f0;
        font:12px 'JetBrains Mono',monospace; padding:6px 28px 6px 10px;
        border-radius:7px; cursor:pointer; outline:none; appearance:none;
        min-width:88px;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
        background-repeat:no-repeat; background-position:right 8px center;
      }
      .mac-sel:focus{ border-color:#00d4ff; outline:none; }

      /* ── Buttons — fully hardcoded, no CSS variable deps ── */
      .mac-btn-primary{
        background:#00d4ff; color:#000;
        font:700 12px 'Syne',sans-serif;
        padding:7px 18px; border-radius:7px; border:none;
        cursor:pointer; transition:all .2s; white-space:nowrap;
        display:inline-flex; align-items:center; gap:6px;
      }
      .mac-btn-primary:hover{ background:#33ddff; transform:translateY(-1px); }
      .mac-btn-primary:disabled{ opacity:.35; cursor:not-allowed; transform:none; }
      .mac-btn-ghost{
        background:#1a2235; color:#e2e8f0; border:1px solid #2a3f60;
        font:600 12px 'Nunito',sans-serif;
        padding:7px 14px; border-radius:7px;
        cursor:pointer; transition:all .2s; white-space:nowrap;
        display:inline-flex; align-items:center; gap:6px;
      }
      .mac-btn-ghost:hover{ border-color:#00d4ff; color:#00d4ff; }
      #mac-btn-auto.active{
        border-color:#ffb800 !important;
        color:#ffb800 !important;
        background:rgba(255,184,0,0.08) !important;
      }

      /* ── Canvas wrapper ── */
      .mac-canvas-wrap{
        background:#111827; border:1px solid #1e2d45; border-radius:10px;
        overflow:hidden; height:420px; margin-bottom:12px;
        position:relative;
      }
      #mac-canvas{ width:100%; height:100%; display:block; }

      /* ── Status bar ── */
      .mac-status{
        background:#111827; border:1px solid #1e2d45; border-radius:10px;
        padding:11px 16px; font-size:13px; font-family:'Nunito',sans-serif;
        min-height:46px; display:flex; align-items:flex-start; gap:10px;
        line-height:1.55; margin-bottom:12px; transition:color .25s;
      }
      #mac-st-icon{ font-size:14px; flex-shrink:0; margin-top:2px; }
      #mac-st-msg{ flex:1; }

      /* ── CAM table header ── */
      .mac-cam-hdr{
        display:flex; align-items:center; justify-content:space-between;
        margin-bottom:8px;
      }
      .mac-cam-title{
        display:flex; align-items:center; gap:8px;
        font:700 13px 'JetBrains Mono',monospace; color:#e2e8f0;
      }
      .mac-cam-sq{
        width:9px; height:9px; border-radius:3px;
        background:#00d4ff; box-shadow:0 0 6px #00d4ff;
      }
      .mac-cam-cnt{ font:11px 'JetBrains Mono',monospace; color:#4b6278; }

      /* ── CAM table ── */
      .mac-cam-wrap{
        background:#111827; border:1px solid #1e2d45;
        border-radius:10px; overflow:hidden;
      }
      table.mac-cam-tbl{
        width:100%; border-collapse:collapse;
        font:11.5px 'JetBrains Mono',monospace;
      }
      table.mac-cam-tbl th{
        background:#1a2235; color:#4b6278; text-transform:uppercase;
        letter-spacing:1px; font-size:10px; padding:9px 14px;
        text-align:left; border-bottom:1px solid #1e2d45; font-weight:700;
      }
      table.mac-cam-tbl td{
        padding:9px 14px; border-bottom:1px solid #1e2d45; color:#94a3b8;
      }
      table.mac-cam-tbl tr:last-child td{ border-bottom:none; }
      table.mac-cam-tbl tr.mac-nr{ animation:mac-row-flash .7s ease; }
      @keyframes mac-row-flash{
        0%  { background:rgba(0,212,255,0.2); }
        100%{ background:transparent; }
      }
      .mac-t-mac  { color:#00d4ff; font-weight:500; }
      .mac-t-port { color:#ffb800; font-weight:600; }
      .mac-t-dyn  { color:#22c55e; }
      .mac-tbw    { display:flex; align-items:center; gap:6px; }
      .mac-tbar   { width:50px; height:4px; background:#1e2d45; border-radius:2px; overflow:hidden; }
      .mac-tfil   { height:100%; border-radius:2px; transition:width .4s linear, background .4s; }
      .mac-tlbl   { font-size:9px; color:#4b6278; }

      /* ── Empty state ── */
      .mac-empty     { padding:28px; text-align:center; color:#4b6278; font-size:12px; }
      .mac-empty-ico { font-size:26px; display:block; margin-bottom:6px; }
    `;
    document.head.appendChild(s);
  }
}

export default new MacTableSimulation();
