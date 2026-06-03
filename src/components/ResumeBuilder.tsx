// @ts-nocheck
/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';

// ══════════════════════════════════════════════════════════
// RESUME BUILDER — 4 templates, color themes, live preview, PDF export.
// Shared by jobseeker (own) + recruiter (candidate). Client-side only.
// jsPDF + html2canvas loaded from CDN (no npm install needed).
// Footer brand is a single constant — easy to rename later.
// ══════════════════════════════════════════════════════════

const BRAND = 'RecruitBase Pro';   // change here if product renamed

const COLORS = [
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Blue',   hex: '#2563eb' },
  { name: 'Teal',   hex: '#0d9488' },
  { name: 'Green',  hex: '#16a34a' },
  { name: 'Plum',   hex: '#7c3aed' },
  { name: 'Rose',   hex: '#e11d48' },
  { name: 'Amber',  hex: '#d97706' },
  { name: 'Slate',  hex: '#334155' },
];

const TEMPLATES = [
  { id: 'classic',      name: 'Classic',      desc: 'ATS-friendly, single column' },
  { id: 'modern',       name: 'Modern',       desc: '2-column colored sidebar' },
  { id: 'minimal',      name: 'Minimal',      desc: 'Clean, lots of whitespace' },
  { id: 'professional', name: 'Professional', desc: 'Header band, two-column body' },
];

// ---- helpers to read profile safely ----
function arr(v) { return Array.isArray(v) ? v : []; }
function csv(v) { return (v || '').split(',').map(s => s.trim()).filter(Boolean); }
function val(v, d = '') { return (v === null || v === undefined || v === '') ? d : v; }

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res(true);
    const s = document.createElement('script');
    s.src = src; s.onload = () => res(true); s.onerror = () => rej(new Error('load fail ' + src));
    document.body.appendChild(s);
  });
}

export default function ResumeBuilder({ profile, onClose }) {
  const p = profile || {};
  const [tpl, setTpl] = useState('classic');
  const [color, setColor] = useState('#4f46e5');
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);

  // normalised data
  const data = {
    name: val(p.name, 'Your Name'),
    role: val(p.role || p.designation, ''),
    email: val(p.email),
    mobile: val(p.mobile ? `${p.country_code || ''} ${p.mobile}` : ''),
    city: val(p.city),
    linkedin: val(p.linkedin),
    github: val(p.github),
    summary: val(p.ai_summary || p.summary),
    skills: csv(p.skills),
    languages: csv(p.languages),
    experience: val(p.experience || p.total_experience),
    expected_ctc: val(p.expected_ctc),
    current_company: val(p.current_company),
    work: arr(p.work_experiences),
    education: arr(p.education),
    achievements: arr(p.achievements),
    certifications: typeof p.certifications === 'string' ? csv(p.certifications) : arr(p.certifications),
    photo: val(p.photo_url),
  };

  async function downloadPDF() {
    if (!previewRef.current) return;
    setBusy(true);
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const html2canvas = window.html2canvas;
      const { jsPDF } = window.jspdf;
      const node = previewRef.current;
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = 210, pdfH = 297;
      const imgH = canvas.height * pdfW / canvas.width;
      let heightLeft = imgH, position = 0;
      pdf.addImage(img, 'JPEG', 0, position, pdfW, imgH);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, position, pdfW, imgH);
        heightLeft -= pdfH;
      }
      pdf.save(`${(data.name || 'resume').replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (e) {
      alert('PDF generate nahi ho paaya. Internet check karein aur dobara try karein.');
    }
    setBusy(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ background: '#1a1a2e', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', borderBottom: '1px solid #2a2a40' }}>
        <strong style={{ color: '#fff', fontSize: 15 }}>📄 Resume Builder</strong>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTpl(t.id)} title={t.desc}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${tpl === t.id ? color : '#3a3a55'}`, background: tpl === t.id ? color : 'transparent', color: tpl === t.id ? '#fff' : '#aab', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              {t.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {COLORS.map(c => (
            <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name}
              style={{ width: 22, height: 22, borderRadius: '50%', background: c.hex, border: color === c.hex ? '3px solid #fff' : '2px solid #444', cursor: 'pointer', padding: 0 }} />
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={downloadPDF} disabled={busy} style={{ background: color, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: busy ? 0.6 : 1 }}>{busy ? 'Generating…' : '⬇ Download PDF'}</button>
          <button onClick={onClose} style={{ background: 'transparent', color: '#fff', border: '1px solid #3a3a55', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Close</button>
        </div>
      </div>

      {/* Scrollable preview area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 12px', display: 'flex', justifyContent: 'center', background: '#4a4a5e' }}>
        <div ref={previewRef} style={{ width: 794, minHeight: 1123, background: '#fff', boxShadow: '0 4px 30px rgba(0,0,0,0.4)', color: '#1a1a2e', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {tpl === 'classic' && <Classic d={data} c={color} />}
          {tpl === 'modern' && <Modern d={data} c={color} />}
          {tpl === 'minimal' && <Minimal d={data} c={color} />}
          {tpl === 'professional' && <Professional d={data} c={color} />}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── shared bits ─────────────────────────
function Foot() {
  return <div style={{ textAlign: 'center', fontSize: 8, color: '#bbb', padding: '8px 0 4px' }}>Created with {BRAND}</div>;
}
function Contact({ d, dark }) {
  const col = dark ? '#e8e8f0' : '#444';
  const items = [d.email, d.mobile, d.city, d.linkedin, d.github].filter(Boolean);
  return <div style={{ fontSize: 11, color: col, lineHeight: 1.7 }}>{items.map((x, i) => <div key={i} style={{ wordBreak: 'break-word' }}>{x}</div>)}</div>;
}
function expLine(w) {
  const t = [w.title, w.org || w.company].filter(Boolean).join(' · ');
  const d = [w.from, w.to].filter(Boolean).join(' – ');
  return { t, d, desc: w.desc || w.description || '' };
}
function eduLine(e) {
  const t = [e.course || e.level, e.branch].filter(Boolean).join(' — ');
  const inst = e.institution || e.college || '';
  const yr = e.year || (e.study_status === 'pursuing' ? (e.current_period || 'Pursuing') : '');
  const grade = e.percentage_or_cgpa || e.cgpa || '';
  return { t, inst, yr, grade };
}

// ───────────────────────── TEMPLATE: Classic ─────────────────────────
function Classic({ d, c }) {
  const H = ({ children }) => <div style={{ fontSize: 13, fontWeight: 800, color: c, borderBottom: `2px solid ${c}`, paddingBottom: 3, margin: '16px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</div>;
  return (
    <div style={{ padding: '38px 44px', display: 'flex', flexDirection: 'column', minHeight: 1123 - 0 }}>
      <div style={{ flex: 1 }}>
        <div style={{ textAlign: 'center', borderBottom: `3px solid ${c}`, paddingBottom: 12, marginBottom: 6 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e' }}>{d.name}</div>
          {d.role && <div style={{ fontSize: 14, color: c, fontWeight: 600, marginTop: 2 }}>{d.role}</div>}
          <div style={{ marginTop: 8 }}><Contact d={d} /></div>
        </div>
        {d.summary && <><H>Summary</H><div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#333' }}>{d.summary}</div></>}
        {d.work.length > 0 && <><H>Experience</H>{d.work.map((w, i) => { const e = expLine(w); return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><b>{e.t}</b><span style={{ color: '#777' }}>{e.d}</span></div>
            {e.desc && <div style={{ fontSize: 11, color: '#444', marginTop: 2, lineHeight: 1.5 }}>{e.desc}</div>}
          </div>); })}</>}
        {d.education.length > 0 && <><H>Education</H>{d.education.map((ed, i) => { const e = eduLine(ed); return (
          <div key={i} style={{ marginBottom: 7, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{e.t}</b><span style={{ color: '#777' }}>{e.yr}</span></div>
            <div style={{ fontSize: 11, color: '#555' }}>{e.inst}{e.grade ? ` · ${e.grade}` : ''}</div>
          </div>); })}</>}
        {d.skills.length > 0 && <><H>Skills</H><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.skills.map((s, i) => <span key={i} style={{ fontSize: 11, background: `${c}18`, color: c, padding: '3px 10px', borderRadius: 4, fontWeight: 600 }}>{s}</span>)}</div></>}
        {d.achievements.length > 0 && <><H>Achievements</H>{d.achievements.map((a, i) => <div key={i} style={{ fontSize: 11.5, color: '#333', marginBottom: 3 }}>• {typeof a === 'string' ? a : (a.title || a.text || '')}</div>)}</>}
        {d.certifications.length > 0 && <><H>Certifications</H>{d.certifications.map((a, i) => <div key={i} style={{ fontSize: 11.5, color: '#333', marginBottom: 3 }}>• {typeof a === 'string' ? a : (a.name || a.title || '')}</div>)}</>}
        {d.languages.length > 0 && <><H>Languages</H><div style={{ fontSize: 11.5, color: '#333' }}>{d.languages.join(' · ')}</div></>}
      </div>
      <Foot />
    </div>
  );
}

// ───────────────────────── TEMPLATE: Modern (2-col) ─────────────────────────
function Modern({ d, c }) {
  const SH = ({ children }) => <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 7px', opacity: 0.9 }}>{children}</div>;
  const MH = ({ children }) => <div style={{ fontSize: 13, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: 0.5, margin: '15px 0 7px' }}>{children}</div>;
  return (
    <div style={{ display: 'flex', minHeight: 1123 }}>
      <div style={{ width: 250, background: c, color: '#fff', padding: '34px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {d.photo && <img src={d.photo} crossOrigin="anonymous" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)', marginBottom: 14 }} />}
          <SH>Contact</SH><Contact d={d} dark />
          {d.skills.length > 0 && <><SH>Skills</SH>{d.skills.map((s, i) => <div key={i} style={{ fontSize: 11, marginBottom: 4 }}>{s}</div>)}</>}
          {d.languages.length > 0 && <><SH>Languages</SH>{d.languages.map((s, i) => <div key={i} style={{ fontSize: 11, marginBottom: 3 }}>{s}</div>)}</>}
        </div>
      </div>
      <div style={{ flex: 1, padding: '34px 30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{d.name}</div>
          {d.role && <div style={{ fontSize: 14, color: c, fontWeight: 600 }}>{d.role}</div>}
          {d.summary && <><MH>Profile</MH><div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#333' }}>{d.summary}</div></>}
          {d.work.length > 0 && <><MH>Experience</MH>{d.work.map((w, i) => { const e = expLine(w); return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{e.t}</div>
              <div style={{ fontSize: 10.5, color: '#888' }}>{e.d}</div>
              {e.desc && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{e.desc}</div>}
            </div>); })}</>}
          {d.education.length > 0 && <><MH>Education</MH>{d.education.map((ed, i) => { const e = eduLine(ed); return (
            <div key={i} style={{ marginBottom: 7, fontSize: 12 }}><b>{e.t}</b><div style={{ fontSize: 11, color: '#666' }}>{e.inst} {e.yr ? `· ${e.yr}` : ''}{e.grade ? ` · ${e.grade}` : ''}</div></div>); })}</>}
          {d.achievements.length > 0 && <><MH>Achievements</MH>{d.achievements.map((a, i) => <div key={i} style={{ fontSize: 11.5, color: '#333', marginBottom: 3 }}>• {typeof a === 'string' ? a : (a.title || a.text || '')}</div>)}</>}
        </div>
        <Foot />
      </div>
    </div>
  );
}

// ───────────────────────── TEMPLATE: Minimal ─────────────────────────
function Minimal({ d, c }) {
  const H = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, margin: '20px 0 8px' }}>{children}</div>;
  return (
    <div style={{ padding: '50px 56px', display: 'flex', flexDirection: 'column', minHeight: 1123 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: 1 }}>{d.name}</div>
        {d.role && <div style={{ fontSize: 14, color: c, marginTop: 2, letterSpacing: 0.5 }}>{d.role}</div>}
        <div style={{ marginTop: 10, fontSize: 11, color: '#666', display: 'flex', gap: 14, flexWrap: 'wrap' }}>{[d.email, d.mobile, d.city, d.linkedin].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}</div>
        <div style={{ height: 1, background: '#e5e5e5', margin: '16px 0' }} />
        {d.summary && <div style={{ fontSize: 12, lineHeight: 1.7, color: '#444' }}>{d.summary}</div>}
        {d.work.length > 0 && <><H>Experience</H>{d.work.map((w, i) => { const e = expLine(w); return (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ fontWeight: 600 }}>{e.t}</span><span style={{ color: '#999' }}>{e.d}</span></div>
            {e.desc && <div style={{ fontSize: 11, color: '#555', marginTop: 3, lineHeight: 1.55 }}>{e.desc}</div>}
          </div>); })}</>}
        {d.education.length > 0 && <><H>Education</H>{d.education.map((ed, i) => { const e = eduLine(ed); return (
          <div key={i} style={{ marginBottom: 7, fontSize: 12 }}><span style={{ fontWeight: 600 }}>{e.t}</span> <span style={{ color: '#999' }}>{e.inst} {e.yr}</span></div>); })}</>}
        {d.skills.length > 0 && <><H>Skills</H><div style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>{d.skills.join('  ·  ')}</div></>}
        {d.achievements.length > 0 && <><H>Achievements</H>{d.achievements.map((a, i) => <div key={i} style={{ fontSize: 11.5, color: '#444', marginBottom: 3 }}>— {typeof a === 'string' ? a : (a.title || a.text || '')}</div>)}</>}
      </div>
      <Foot />
    </div>
  );
}

// ───────────────────────── TEMPLATE: Professional ─────────────────────────
function Professional({ d, c }) {
  const H = ({ children }) => <div style={{ fontSize: 12.5, fontWeight: 800, color: c, margin: '14px 0 7px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 1123 }}>
      <div style={{ background: c, color: '#fff', padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {d.photo && <img src={d.photo} crossOrigin="anonymous" style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)' }} />}
        <div>
          <div style={{ fontSize: 27, fontWeight: 800 }}>{d.name}</div>
          {d.role && <div style={{ fontSize: 14, opacity: 0.92 }}>{d.role}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ width: 220, background: '#f4f5f8', padding: '24px 22px' }}>
          <H>Contact</H><Contact d={d} />
          {d.skills.length > 0 && <><H>Skills</H>{d.skills.map((s, i) => <div key={i} style={{ fontSize: 11, marginBottom: 4, color: '#444' }}>• {s}</div>)}</>}
          {d.languages.length > 0 && <><H>Languages</H><div style={{ fontSize: 11, color: '#444' }}>{d.languages.join(', ')}</div></>}
          {d.certifications.length > 0 && <><H>Certifications</H>{d.certifications.map((a, i) => <div key={i} style={{ fontSize: 11, color: '#444', marginBottom: 3 }}>• {typeof a === 'string' ? a : (a.name || a.title || '')}</div>)}</>}
        </div>
        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {d.summary && <><H>Summary</H><div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#333' }}>{d.summary}</div></>}
            {d.work.length > 0 && <><H>Experience</H>{d.work.map((w, i) => { const e = expLine(w); return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><b>{e.t}</b><span style={{ color: '#888' }}>{e.d}</span></div>
                {e.desc && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{e.desc}</div>}
              </div>); })}</>}
            {d.education.length > 0 && <><H>Education</H>{d.education.map((ed, i) => { const e = eduLine(ed); return (
              <div key={i} style={{ marginBottom: 6, fontSize: 12 }}><b>{e.t}</b><div style={{ fontSize: 11, color: '#666' }}>{e.inst} {e.yr ? `· ${e.yr}` : ''}{e.grade ? ` · ${e.grade}` : ''}</div></div>); })}</>}
            {d.achievements.length > 0 && <><H>Achievements</H>{d.achievements.map((a, i) => <div key={i} style={{ fontSize: 11.5, color: '#333', marginBottom: 3 }}>• {typeof a === 'string' ? a : (a.title || a.text || '')}</div>)}</>}
          </div>
          <Foot />
        </div>
      </div>
    </div>
  );
}
