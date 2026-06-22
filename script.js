const cache = {};
window.rosTrack = window.rosTrack || {}; 
window.lastVal = 0; 

async function getFile(yr, tm) {
  const num = yr.replace('s', ''); 
  const file = `${num} ${tm}.json`;

  if (cache[file] === undefined) {
    try {
      const url = chrome.runtime.getURL(`data/${file}`);
      const res = await fetch(url);
      cache[file] = res.ok ? await res.json() : null;
    } catch (e) {
      cache[file] = null;
    }
  }
  return cache[file];
}

async function getPts(yr, tm, nm) {
  const db = await getFile(yr, tm);
  if (db && db[yr] && db[yr][tm] && db[yr][tm][nm] !== undefined) {
    return db[yr][tm][nm];
  }
  return "N/A";
}

async function makeBoard(topDrg, mainCol) {
  let curTm = "";
  let curYr = "";
  const fstInfo = document.querySelector('div[draggable] p.text-xs.font-normal.text-muted-foreground');
  
  if (fstInfo) {
    const ptsArr = fstInfo.innerText.split(' · ');
    if (ptsArr.length >= 2) {
      curTm = ptsArr[0].trim();
      curYr = ptsArr[1].trim();
    }
  }

  let eraOn = false;
  const trkBtns = document.querySelectorAll('button[data-slot="tracked-button"]');
  trkBtns.forEach(b => {
    if (b.innerText.includes('Era')) {
      eraOn = !b.hasAttribute('disabled') && !b.disabled;
    }
  });

  const altList = [];
  if (eraOn && curTm && curYr) {
    const decs = ['1960', '1970', '1980', '1990', '2000', '2010', '2020'];
    const curDec = curYr.replace('s', '');

    const tasks = decs.map(async (dec) => {
      if (dec === curDec) return;
      const yrStr = dec + 's';
      const db = await getFile(yrStr, curTm);
      if (db && db[yrStr] && db[yrStr][curTm]) {
        for (const [nm, val] of Object.entries(db[yrStr][curTm])) {
          altList.push({ nm: nm, val: val, yr: yrStr });
        }
      }
    });
    await Promise.all(tasks);
  }
  
  altList.sort((a, b) => b.val - a.val);
  const topAlt = altList.slice(0, 5);

  let box = document.getElementById('top-board');
  if (!box) {
    box = document.createElement('div');
    box.id = 'top-board';
    document.body.appendChild(box);
  }
  
  box.style.cssText = `
    display: block !important;
    position: fixed !important;
    bottom: 80px !important; 
    left: 20px !important;
    background-color: #1e293b !important; 
    border: 2px solid ${mainCol} !important;
    color: white !important;
    padding: 15px !important;
    border-radius: 10px !important;
    z-index: 2147483647 !important;
    min-width: 220px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8) !important;
  `;

  let html = '';

  if (eraOn) {
    html += '<div style="font-size: 14px; font-weight: 900; color: #c084fc; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px;">ERA RE-ROLL (TOP 5)</div>';
    if (topAlt.length === 0) {
      html += '<div style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">No historical data found.</div>';
    } else {
      html += '<div style="margin-bottom: 15px;">';
      topAlt.forEach((p, i) => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 14px;">
            <span style="font-weight: bold; color: #f8fafc;">${i + 1}. ${p.nm} <span style="font-size: 10px; color: #a855f7; margin-left: 4px;">(${p.yr})</span></span>
            <span style="color: #c084fc; font-weight: 900; margin-left: 15px;">${p.val.toFixed(2)}</span>
          </div>
        `;
      });
      html += '</div>';
    }
  }

  html += `<div style="font-size: 14px; font-weight: 900; color: ${mainCol}; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px;">TOP 3 AVAILABLE</div>`;
  if (topDrg.length === 0) {
    html += '<div style="font-size: 13px; color: #94a3b8;">No valid scores found.</div>';
  } else {
    topDrg.forEach((p, i) => {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 16px;">
          <span style="font-weight: bold; color: #f8fafc;">${i + 1}. ${p.nm}</span>
          <span style="color: ${mainCol}; font-weight: 900; margin-left: 15px;">${p.val.toFixed(2)}</span>
        </div>
      `;
    });
  }
  
  box.innerHTML = html;

  // --- SYNC SCAN BUTTON VISIBILITY WITH LEADERBOARD ---
  const curIq = document.querySelector('span[class*="text-amber-400"]') !== null;
  const mBtn = document.getElementById('m-btn');
  if (mBtn) {
    mBtn.style.display = curIq ? 'none' : 'block';
  }
}

function runIq() {
  const rows = document.querySelectorAll('div[draggable]:not(.iq-done)');

  rows.forEach(row => {
    const nmEl = row.querySelector('p.text-sm.font-bold');
    const info = row.querySelector('p.text-xs.font-normal.text-muted-foreground');

    if (!nmEl || !info) return;

    row.classList.add('iq-done'); 
    if (row.querySelector('.my-btn')) return;

    const ptsArr = info.innerText.split(' · ');
    if (ptsArr.length < 2) return;

    const tm = ptsArr[0].trim();
    const yr = ptsArr[1].trim();
    const nm = nmEl.innerText.trim();

    const btn = document.createElement('button');
    btn.className = 'my-btn text-xs font-bold text-primary border border-primary/50 px-2 py-1 rounded-md ml-auto';
    btn.innerText = 'Show Score';
    
    btn.style.cssText = `
      cursor: pointer;
      background: transparent;
      color: inherit;
      z-index: 10;
    `;

    btn.onclick = async (e) => {
      e.stopPropagation();
      if (btn.innerText !== 'Show Score') return; 

      btn.innerText = '...';
      const pts = await getPts(yr, tm, nm);
      
      btn.innerText = pts;
      btn.style.backgroundColor = 'rgba(255, 0, 68, 0.1)';
      btn.style.color = '#ff0044';
      btn.style.border = '1px solid #ff0044';
    };

    row.appendChild(btn);
  });

  if (!document.getElementById('rev-btn')) {
    const btn = document.createElement('button');
    btn.id = 'rev-btn';
    btn.innerText = 'Reveal All';
    btn.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      left: 20px !important;
      background-color: #fbbf24 !important; 
      color: #000 !important;
      padding: 12px 24px !important;
      font-weight: bold !important;
      border-radius: 8px !important;
      z-index: 2147483647 !important;
      cursor: pointer !important;
      border: none !important;
    `;
    
    btn.onclick = async () => {
      if (btn.innerText === 'Loading...') return;
      btn.innerText = 'Loading...';

      const list = [];
      const allRows = document.querySelectorAll('div[draggable]');

      const tasks = Array.from(allRows).map(async (row) => {
        const nmEl = row.querySelector('p.text-sm.font-bold');
        const info = row.querySelector('p.text-xs.font-normal.text-muted-foreground');
        if (!nmEl || !info) return;

        const ptsArr = info.innerText.split(' · ');
        if (ptsArr.length < 2) return;

        const tm = ptsArr[0].trim();
        const yr = ptsArr[1].trim();
        const nm = nmEl.innerText.trim();

        const pts = await getPts(yr, tm, nm);
        const num = parseFloat(pts);
        
        if (!isNaN(num)) {
          list.push({ nm: nm, val: num, row: row });
        }
      });

      await Promise.all(tasks);

      list.sort((a, b) => b.val - a.val);
      
      const topAll = list.slice(0, 3);
      const topDrg = list.filter(item => item.row.getAttribute('draggable') === 'true').slice(0, 3);

      list.forEach(item => {
        const rBtn = item.row.querySelector('.my-btn');
        if (rBtn) {
          rBtn.innerText = item.val.toFixed(2);
          if (topAll.includes(item)) {
            rBtn.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
            rBtn.style.color = '#fbbf24';
            rBtn.style.border = '1px solid #fbbf24';
          } else {
            rBtn.style.backgroundColor = 'rgba(255, 0, 68, 0.1)';
            rBtn.style.color = '#ff0044';
            rBtn.style.border = '1px solid #ff0044';
          }
        }
      });

      await makeBoard(topDrg, '#fbbf24');
      btn.innerText = 'Reveal All';
    };
    
    document.body.appendChild(btn);
  }
}

async function runCalc() {
  const allRows = document.querySelectorAll('div[draggable]');
  const list = [];

  allRows.forEach(row => {
    const stats = row.querySelector('.gap-2');
    const nmEl = row.querySelector('p.text-sm.font-bold');

    if (!stats || !nmEl) return; 

    const vals = stats.querySelectorAll('.w-7 span.text-sm');
    if (vals.length < 5) return;

    const p1 = parseFloat(vals[0].innerText) || 0;
    const p2 = parseFloat(vals[1].innerText) || 0;
    const p3 = parseFloat(vals[2].innerText) || 0;
    const p4 = parseFloat(vals[3].innerText) || 0;
    const p5 = parseFloat(vals[4].innerText) || 0;

    const sum = (0.34 * p1) + (0.59 * p2) + (0.63 * p3) + (1.29 * p4) + (1.55 * p5);
    const nm = nmEl.innerText.trim();

    list.push({ nm: nm, val: sum, row: row });

    if (!row.querySelector('.my-tot')) {
      row.classList.add('calc-done'); 
      
      const box = document.createElement('div');
      box.className = 'flex flex-col items-center w-9 my-tot';
      box.innerHTML = `
        <span class="val-txt text-sm font-bold leading-none" style="color: #ff0044;">${sum.toFixed(2)}</span>
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">TOT</span>
      `;
      stats.appendChild(box);
    }
  });

  list.sort((a, b) => b.val - a.val);
  
  const topAll = list.slice(0, 3);
  const topDrg = list.filter(item => item.row.getAttribute('draggable') === 'true').slice(0, 3);

  list.forEach(item => {
    const span = item.row.querySelector('.val-txt');
    if (span) span.style.color = topAll.includes(item) ? '#fbbf24' : '#ff0044';
  });

  await makeBoard(topDrg, '#ff0044');

  const validRows = Array.from(document.querySelectorAll('div[draggable]'));
  const fstMan = validRows.find(row => row.querySelector('p.text-xs.font-normal.text-muted-foreground'));

  if (fstMan) {
    const info = fstMan.querySelector('p.text-xs.font-normal.text-muted-foreground');
    if (info) {
      const ptsArr = info.innerText.split(' · ');
      if (ptsArr.length >= 2) {
        const tm = ptsArr[0].trim();
        const yr = ptsArr[1].trim();
        
        const db = await getFile(yr, tm);
        const exists = db !== null;
        let dlBtn = document.getElementById('dl-btn');

        if (exists) {
          if (dlBtn) dlBtn.style.display = 'none';
        } else {
          if (!dlBtn) {
            dlBtn = document.createElement('button');
            dlBtn.id = 'dl-btn';
            dlBtn.innerText = 'Download JSON';
            dlBtn.style.cssText = `
              position: fixed !important;
              bottom: 20px !important;
              right: 20px !important;
              background-color: #ff0044 !important;
              color: white !important;
              padding: 12px 24px !important;
              font-weight: bold !important;
              border-radius: 8px !important;
              z-index: 2147483647 !important;
              cursor: pointer !important;
              border: none !important;
            `;
            dlBtn.onclick = save; 
            document.body.appendChild(dlBtn);
          }
          dlBtn.style.display = 'block';
        }
      }
    }
  }
}

function save() {
  const data = {};
  const rows = document.querySelectorAll('div[draggable]');
  let fName = "players";
  let isSet = false;

  rows.forEach(row => {
    const stats = row.querySelector('.gap-2');
    const nmEl = row.querySelector('p.text-sm.font-bold');
    const info = row.querySelector('p.text-xs.font-normal.text-muted-foreground');

    if (!stats || !nmEl || !info) return;

    const vals = stats.querySelectorAll('.w-7 span.text-sm');
    if (vals.length < 5) return;

    const p1 = parseFloat(vals[0].innerText) || 0;
    const p2 = parseFloat(vals[1].innerText) || 0;
    const p3 = parseFloat(vals[2].innerText) || 0;
    const p4 = parseFloat(vals[3].innerText) || 0;
    const p5 = parseFloat(vals[4].innerText) || 0;

    const sum = (0.34 * p1) + (0.59 * p2) + (0.63 * p3) + (1.29 * p4) + (1.55 * p5);

    const ptsArr = info.innerText.split(' · ');
    if (ptsArr.length < 2) return;

    const tm = ptsArr[0].trim();
    const yr = ptsArr[1].trim();
    const nm = nmEl.innerText.trim();

    if (!isSet) {
      const num = yr.replace('s', '');
      fName = `${num} ${tm}`;
      isSet = true;
    }

    if (!data[yr]) data[yr] = {};
    if (!data[yr][tm]) data[yr][tm] = {};
    data[yr][tm][nm] = Number(sum.toFixed(2));
  });

  const str = JSON.stringify(data, null, 2);
  const blob = new Blob([str], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fName}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function drawSum(forceShow = false) {
  let total = 0;
  
  if (window.rosTrack) {
    Object.values(window.rosTrack).forEach(val => total += val);
  }

  let sumBox = document.getElementById('run-sum-box');
  if (!sumBox) {
    sumBox = document.createElement('div');
    sumBox.id = 'run-sum-box';
    sumBox.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      left: 20px !important;
      background-color: #0f172a !important;
      border: 2px solid #10b981 !important;
      color: white !important;
      padding: 10px 20px !important;
      border-radius: 8px !important;
      font-weight: bold !important;
      font-size: 16px !important;
      z-index: 2147483647 !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
      display: none !important;
    `;
    document.body.appendChild(sumBox);
  }
  
  sumBox.innerHTML = `ROSTER SUM: <span style="color: #10b981; font-weight: 900; margin-left: 8px;">${total.toFixed(2)}</span>`;
  
  if (forceShow) {
    sumBox.style.display = 'block';
  }
}

function init(forcedMode = null) {
  const topBox = document.getElementById('top-board');
  if (topBox) topBox.style.display = 'none';

  const mBtn = document.getElementById('m-btn');
  if (mBtn) mBtn.style.display = 'none';

  let isIq = false;

  if (forcedMode === 'iq') {
    isIq = true;
  } else if (forcedMode === 'calc') {
    isIq = false;
  } else {
    isIq = document.querySelector('span[class*="text-amber-400"]') !== null;
  }
  
  const sumBox = document.getElementById('run-sum-box');

  if (isIq) {
    if (sumBox) sumBox.style.display = 'none';
    
    const dlBtn = document.getElementById('dl-btn');
    if (dlBtn) dlBtn.style.display = 'none';
    
    const revBtn = document.getElementById('rev-btn');
    if (revBtn) revBtn.style.display = 'block';

    runIq();
  } else {
    if (sumBox && sumBox.style.display !== 'none') sumBox.style.display = 'block';

    const revBtn = document.getElementById('rev-btn');
    if (revBtn) revBtn.style.display = 'none';

    runCalc();
  }

  drawSum();
}

// m-btn starts fully hidden until a valid board calculates
if (!document.getElementById('m-btn')) {
  const btn = document.createElement('button');
  btn.id = 'm-btn';
  btn.innerText = 'Scan Roster';
  btn.style.cssText = `
    display: none !important;
    position: fixed !important;
    top: 15px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background-color: #10b981 !important;
    color: white !important;
    padding: 10px 24px !important;
    font-size: 14px !important;
    font-weight: bold !important;
    border-radius: 8px !important;
    z-index: 2147483647 !important;
    cursor: pointer !important;
    border: 2px solid #047857 !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
  `;
  
  btn.onclick = () => init();
  document.body.appendChild(btn);
}

document.addEventListener('click', (e) => {
  const rowNode = e.target.closest('div[draggable]');
  if (rowNode && rowNode.querySelector('p.text-sm.font-bold')) {
    let rawVal = 0;
    const scoreEl = rowNode.querySelector('.val-txt');
    
    if (scoreEl) {
      rawVal = parseFloat(scoreEl.innerText) || 0;
    } else {
      const stats = rowNode.querySelectorAll('.w-7 span.text-sm');
      if (stats.length >= 5) {
        const p1 = parseFloat(stats[0].innerText) || 0;
        const p2 = parseFloat(stats[1].innerText) || 0;
        const p3 = parseFloat(stats[2].innerText) || 0;
        const p4 = parseFloat(stats[3].innerText) || 0;
        const p5 = parseFloat(stats[4].innerText) || 0;
        rawVal = (0.34 * p1) + (0.59 * p2) + (0.63 * p3) + (1.29 * p4) + (1.55 * p5);
      }
    }
    window.lastVal = rawVal;
  }

  const curIq = document.querySelector('span[class*="text-amber-400"]') !== null;
  if (!curIq) {
    const slotBtn = e.target.closest('button[data-slot="tracked-button"]');
    if (slotBtn) {
      const btnTxt = slotBtn.innerText.trim();
      
      if (!btnTxt.includes('Team') && !btnTxt.includes('Era')) {
        const wrapper = slotBtn.closest('.absolute');
        if (wrapper) {
          const slotId = wrapper.style.top + '_' + wrapper.style.left;
          const isReady = slotBtn.querySelector('span.text-primary') !== null;
          const noSlot = slotBtn.querySelector('span.text-white\\/40') !== null;

          if (isReady && window.lastVal > 0) {
            window.rosTrack[slotId] = window.lastVal;
            window.lastVal = 0; 

            const topBox = document.getElementById('top-board');
            if (topBox) topBox.style.display = 'none';
            const mBtn = document.getElementById('m-btn');
            if (mBtn) mBtn.style.display = 'none';

          } else if (!isReady && !noSlot) {
            window.rosTrack[slotId] = 0;
            
            const topBox = document.getElementById('top-board');
            if (topBox) topBox.style.display = 'none';
            const mBtn = document.getElementById('m-btn');
            if (mBtn) mBtn.style.display = 'none';
          }
          drawSum(true);
        }
      }
    }
  }

  const btn = e.target.closest('button[data-slot="button"], button[data-slot="tracked-button"]');
  if (btn) {
    const txt = btn.innerText.trim();
    let fired = false;

    if (txt === 'Play Classic' || txt === 'Play') {
      fired = true;
      window.rosTrack = {}; 
      drawSum(true); 
      setTimeout(() => init('calc'), 3400);
    } else if (txt === 'Play HoopIQ') {
      fired = true;
      setTimeout(() => init('iq'), 3400);
    } else if (txt === 'SPIN' || txt.includes('Team') || txt.includes('Era')) {
      fired = true;
      if (!curIq) drawSum(true); 
      setTimeout(() => init(), 3400);
    } else if (txt === 'Build Another') {
      window.rosTrack = {};
      if (!curIq) drawSum(true);
    }

    if (fired) {
      const topBox = document.getElementById('top-board');
      if (topBox) topBox.style.display = 'none';
      const mBtn = document.getElementById('m-btn');
      if (mBtn) mBtn.style.display = 'none';
    }
  }
}, true);