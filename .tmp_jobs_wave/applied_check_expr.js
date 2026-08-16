
(() => {
  const m = document.cookie.match(/JSESSIONID="?([^;]+)/);
  const csrf = m ? m[1].replace(/\"/g,'') : '';
  const hdr = {
    accept: 'application/vnd.linkedin.normalized+json+2.1',
    'csrf-token': csrf,
    'x-restli-protocol-version': '2.0.0'
  };
  async function one(id) {
    try {
      const r = await fetch('https://www.linkedin.com/voyager/api/jobs/jobPostings/' + id, {credentials:'include', headers: hdr});
      if (!r.ok) return {id, err: r.status};
      const j = await r.json();
      const d = j.data || {};
      const incl = j.included || [];
      const applyingUrn = d['*applyingInfo'];
      const applying = incl.find(x => x.entityUrn === applyingUrn) || incl.find(x => (x.$type||'').includes('JobApplyingInfo'));
      const am = d.applyMethod || {};
      return {
        id,
        applied: !!(applying && applying.applied),
        appliedText: applying && applying.activities && applying.activities[0] && applying.activities[0].text,
        type: ((am.$type)||'').split('.').pop() || null,
        apply: am.companyApplyUrl || am.easyApplyUrl || null
      };
    } catch (e) {
      return {id, err: String(e).slice(0,120)};
    }
  }
  async function run() {
    const ids = window.__JOB_IDS || [];
    const out = [];
    for (let i = 0; i < ids.length; i += 6) {
      const part = await Promise.all(ids.slice(i, i+6).map(one));
      out.push(...part);
      await new Promise(r => setTimeout(r, 200));
    }
    window.__appliedScan = out;
    let el = document.getElementById('__applied_scan');
    if (!el) { el = document.createElement('pre'); el.id='__applied_scan'; el.style.cssText='position:fixed;left:0;bottom:0;z-index:99999;max-height:30vh;overflow:auto;background:#111;color:#0f0;font-size:10px'; document.body.appendChild(el); }
    el.textContent = JSON.stringify(out);
    const applied = out.filter(x => x.applied).length;
    const counts = out.reduce((a,x)=>{const k=x.applied?'applied':(x.type||('e'+x.err)); a[k]=(a[k]||0)+1; return a;},{});
    return {n: out.length, applied, counts};
  }
  return run();
})()
