/* ============================================================
   MT_System — shared UI components  → window
   ============================================================ */
const { useState, useMemo, useRef, useEffect } = React;
const D = window.DATA;

/* ---------------- Icons (stroke, 1.7) ---------------- */
function Icon({ name, size = 18, style }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", style };
  const paths = {
    qr: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M21 21v-4M17 21h4"/></>,
    wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 18v3h3l6.5-6.5a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.2-.4-.4-2.2 2.6-2.6Z"/>,
    box: <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5M12 13v8"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    gauge: <><path d="M12 14 8.5 9.5M21 12a9 9 0 1 0-18 0"/><path d="M3 12h2M19 12h2M12 3v2"/></>,
    clipboard: <><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 13l2 2 4-4"/></>,
    check: <path d="M20 6 9 17l-5-5"/>,
    checkCircle: <><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></>,
    x: <path d="M18 6 6 18M6 6l12 12"/>,
    alert: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    chevR: <path d="m9 6 6 6-6 6"/>,
    chevL: <path d="m15 6-6 6 6 6"/>,
    chevD: <path d="m6 9 6 6 6-6"/>,
    arrowUp: <path d="M12 19V5M5 12l7-7 7 7"/>,
    arrowDown: <path d="M12 5v14M5 12l7 7 7-7"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>,
    camera: <><path d="M14.5 4l1.5 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2Z"/><circle cx="12" cy="13" r="3.5"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.2 8.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.1Z"/></>,
    home: <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    truck: <><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></>,
    cal: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>,
    chart: <><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></>,
    machine: <><rect x="3" y="8" width="13" height="11" rx="1"/><path d="M16 12h3l2 2v5h-5M7 8V5h5v3"/><circle cx="9.5" cy="13.5" r="2"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    filter: <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/>,
    play: <path d="M6 4l14 8-14 8V4Z"/>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1"/>,
    pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---------------- Status badges ---------------- */
const STOCK_BADGE = {
  critical: { cls:"b-red",   label:"วิกฤต (ของหมด)" },
  reorder:  { cls:"b-amber", label:"ควรสั่งซื้อ" },
  normal:   { cls:"b-green", label:"ปกติ" },
};
function StockBadge({ status }) {
  const s = STOCK_BADGE[status] || STOCK_BADGE.normal;
  return <span className={"badge " + s.cls}><span className="dot"></span>{s.label}</span>;
}

const JOB_BADGE = {
  "Waiting":     { cls:"b-gray",  label:"รอดำเนินการ" },
  "In Progress": { cls:"b-blue",  label:"กำลังซ่อม" },
  "Completed":   { cls:"b-green", label:"เสร็จสิ้น" },
  "Approved":    { cls:"b-green", label:"อนุมัติแล้ว" },
  "Pending":     { cls:"b-amber", label:"รอตรวจรับ" },
  "Rejected":    { cls:"b-red",   label:"ไม่อนุมัติ" },
};
function JobBadge({ status }) {
  const s = JOB_BADGE[status] || JOB_BADGE["Waiting"];
  return <span className={"badge " + s.cls}><span className="dot"></span>{s.label}</span>;
}

function PriorityTag({ p }) {
  const map = { Low:"low", Medium:"medium", High:"high", Critical:"critical" };
  const th  = { Low:"Low", Medium:"Medium", High:"High", Critical:"Critical" };
  return <span className={"tag tag-" + (map[p]||"low")}>{th[p]||p}</span>;
}

function RiskTag({ zone }) {
  const k = (zone||"").toLowerCase();
  const label = zone === "HIGH" ? "HIGH RISK" : zone === "MEDIUM" ? "MEDIUM RISK" : "LOW RISK";
  return <span className={"risk risk-" + k}>{label}</span>;
}

function RankPill({ rank }) {
  return <span className={"rank rank-" + rank}>{rank}</span>;
}

/* ---------------- KPI card ---------------- */
const STATE_COLOR = { good:"var(--green)", warn:"var(--amber)", bad:"var(--red)", info:"var(--blue)" };
function KpiCard({ k }) {
  const color = STATE_COLOR[k.state] || "var(--blue)";
  const deltaCls = k.state === "good" ? "delta-up" : k.state === "bad" ? "delta-down" : "delta-warn";
  return (
    <div className="kpi">
      <div className="kpi-accent" style={{ background: color }}></div>
      <div className="kpi-name">{k.name}<span className="muted-2 tiny" style={{fontWeight:400}}>· {k.full}</span></div>
      <div>
        <span className="kpi-val" style={{ color:"var(--ink)" }}>{k.value}</span>
        <span className="kpi-unit">{k.unit}</span>
      </div>
      <div className="kpi-foot">
        <span className="kpi-target">เป้า: {k.target}</span>
        <span className={"delta " + deltaCls}>
          {k.trend === "up" && <Icon name="arrowUp" size={13} />}
          {k.trend === "down" && <Icon name="arrowDown" size={13} />}
          {k.delta}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Searchbar / SortHeader ---------------- */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="searchbar">
      <Icon name="search" size={16} style={{ color:"var(--ink-3)" }} />
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder || "ค้นหา..."} />
    </div>
  );
}

function useSort(rows, initial) {
  const [sort, setSort] = useState(initial || { key:null, dir:1 });
  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const r = [...rows].sort((a,b) => {
      const x=a[sort.key], y=b[sort.key];
      if (typeof x === "number" && typeof y === "number") return (x-y)*sort.dir;
      return String(x).localeCompare(String(y),"th")*sort.dir;
    });
    return r;
  }, [rows, sort]);
  const onSort = key => setSort(s => s.key===key ? { key, dir:-s.dir } : { key, dir:1 });
  return { sorted, sort, onSort };
}

function Th({ k, sort, onSort, children, align }) {
  const active = sort && sort.key === k;
  return (
    <th className="sortable" onClick={()=>onSort(k)} style={{ textAlign: align||"left" }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
        {children}
        {active && <Icon name={sort.dir>0?"arrowUp":"arrowDown"} size={12} />}
      </span>
    </th>
  );
}

/* ---------------- Timeline ---------------- */
function Timeline({ steps }) {
  return (
    <div className="timeline">
      {steps.map((s,i) => (
        <div className="tl-item" key={i}>
          <span className={"tl-dot " + (s.state||"")}>
            {s.state==="done" && <Icon name="check" size={12} />}
            {s.state==="active" && <span style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}></span>}
          </span>
          <div className="tl-title">{s.title}</div>
          {s.desc && <div className="small muted">{s.desc}</div>}
          {s.time && <div className="tl-time">{s.time}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Bar (mini) ---------------- */
function HBar({ pct, color }) {
  return <div className="progress" style={{flex:1}}><span style={{ width: Math.min(100,pct)+"%", background: color || "var(--navy)" }}></span></div>;
}

/* ---------------- Section header ---------------- */
function PageHead({ title, sub, actions }) {
  return (
    <div className="row between wrap" style={{ marginBottom:18, gap:12 }}>
      <div>
        <div className="h-lg">{title}</div>
        {sub && <div className="muted small" style={{marginTop:2}}>{sub}</div>}
      </div>
      {actions && <div className="row gap-sm wrap">{actions}</div>}
    </div>
  );
}

/* ---------------- QR placeholder (CSS, not a real code) ---------------- */
function QRBox({ size = 132, label }) {
  return (
    <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{
        width:size, height:size, borderRadius:10, padding:10, background:"#fff",
        border:"1px solid var(--border-2)",
        backgroundImage:`
          linear-gradient(90deg,#232019 0 0),
          repeating-conic-gradient(#232019 0 25%, #fff 0 50%)`,
        backgroundSize:`100% 100%`,
      }}>
        <div style={{
          width:"100%", height:"100%", borderRadius:4,
          background:`repeating-conic-gradient(from 0deg, #232019 0% 25%, #ffffff 0% 50%)`,
          backgroundSize:`${size/6}px ${size/6}px`,
          maskImage:`radial-gradient(circle at 18% 18%, #000 9%, transparent 10%)`,
        }}></div>
      </div>
      {label && <div className="mono tiny muted">{label}</div>}
    </div>
  );
}

/* ---------------- Modal ---------------- */
function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(14,26,38,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60, padding:20 }}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{ width: wide?720:480, maxWidth:"100%", maxHeight:"90vh", overflow:"auto", boxShadow:"var(--sh-3)" }}>
        <div className="panel-head">
          <div className="h-md">{title}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
function Toast({ toast }) {
  if (!toast) return null;
  const icon = toast.kind==="error" ? "alert" : toast.kind==="mail" ? "mail" : "checkCircle";
  const color = toast.kind==="error" ? "var(--red)" : toast.kind==="mail" ? "var(--blue)" : "var(--green)";
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:80,
      background:"var(--navy-3)", color:"#fff", padding:"13px 18px", borderRadius:11, boxShadow:"var(--sh-3)",
      display:"flex", alignItems:"center", gap:11, maxWidth:"92vw", fontSize:14, fontWeight:500 }}>
      <span style={{ color }}><Icon name={icon} size={19} /></span>
      <span>{toast.msg}</span>
    </div>
  );
}

Object.assign(window, {
  Icon, StockBadge, JobBadge, PriorityTag, RiskTag, RankPill, KpiCard,
  SearchBar, useSort, Th, Timeline, HBar, PageHead, QRBox, Modal, Toast,
});
