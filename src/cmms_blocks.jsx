/* ============================================================
   MT_System — CMMS shared blocks (charts, stat cards) → window
   ============================================================ */
const C = window.DATA;

/* ---- stat card ---- */
function StatCard({ icon, tone="navy", value, label, foot }){
  const tones={ navy:["var(--navy)","var(--kpi-glow)"], red:["var(--red)","var(--red-bg)"], amber:["var(--amber)","var(--amber-bg)"], green:["var(--green)","var(--green-bg)"], blue:["var(--blue)","var(--blue-bg)"] };
  const [c,bg]=tones[tone]||tones.navy;
  return (
    <div className="stat-card">
      <div className="row between" style={{alignItems:"flex-start"}}>
        <div>
          <div className="v" style={{color:"var(--ink)"}}>{value}</div>
          <div className="k">{label}</div>
        </div>
        <span className="ic-wrap" style={{background:bg,color:c}}><Icon name={icon} size={21}/></span>
      </div>
      {foot && <div style={{marginTop:11}}>{foot}</div>}
    </div>
  );
}

/* ---- vertical bar chart ---- */
function BarChart({ data, height=150, color="var(--navy)", highlightLast }){
  const mx=Math.max(...data.map(d=>d.v));
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:9,height}}>
      {data.map((d,i)=>(
        <div key={i} className="col" style={{flex:1,alignItems:"center",gap:7,justifyContent:"flex-end",height:"100%"}}>
          <span className="mono tiny" style={{fontWeight:700,color:"var(--ink-2)"}}>{d.v}</span>
          <div style={{width:"100%",maxWidth:34,height:Math.max(3,(d.v/mx)*(height-34))+"px",borderRadius:"7px 7px 0 0",
            background: highlightLast&&i===data.length-1?"var(--green)":color, opacity: highlightLast&&i!==data.length-1?.55:1}}></div>
          <span className="tiny muted-2" style={{whiteSpace:"nowrap"}}>{d.m||d.k}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- horizontal pareto bars ---- */
function ParetoBars({ rows, color="var(--navy)", money }){
  const mx=Math.max(...rows.map(r=>r.count||r.v));
  return (
    <div style={{display:"grid",gap:10}}>
      {rows.map((r,i)=>{ const val=r.count||r.v;
        return (
          <div key={i} className="row" style={{gap:12}}>
            <span className="small" style={{width:150,flex:"none",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</span>
            <span className="grow"><HBar pct={val/mx*100} color={i<3?color:"var(--border-2)"}/></span>
            <span className="mono small" style={{width:money?64:30,textAlign:"right",fontWeight:700}}>{money?C.fmtMoney(val):val}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- area/line spark (SVG polyline, data viz) ---- */
function AreaChart({ data, height=200, color="var(--navy)" }){
  const w=600, h=height, pad=28;
  const mx=Math.max(...data.map(d=>d.v))*1.15, mn=0;
  const xs=i=> pad + i*((w-pad*2)/(data.length-1));
  const ys=v=> h-pad - ((v-mn)/(mx-mn))*(h-pad*1.4);
  const line=data.map((d,i)=>`${xs(i)},${ys(d.v)}`).join(" ");
  const area=`${pad},${h-pad} ${line} ${xs(data.length-1)},${h-pad}`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{height}}>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {[0.25,0.5,0.75,1].map((g,i)=><line key={i} x1={pad} x2={w-pad} y1={pad*0.6+g*(h-pad*2)} y2={pad*0.6+g*(h-pad*2)} stroke="var(--border)" strokeWidth="1"/>)}
      <polygon points={area} fill="url(#ag)"/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d,i)=>(<g key={i}><circle cx={xs(i)} cy={ys(d.v)} r="3.5" fill="var(--surface)" stroke={color} strokeWidth="2"/>
        <text x={xs(i)} y={h-8} textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontFamily="var(--font)">{d.m}</text></g>))}
    </svg>
  );
}

/* ---- donut (single ratio) ---- */
function Donut({ pct, color="var(--navy)", label, sub }){
  return (
    <div className="donut" style={{ background:`conic-gradient(${color} ${pct*3.6}deg, var(--surface-3) 0)` }}>
      <div className="hole">
        <div className="mono" style={{fontSize:22,fontWeight:700,color:"var(--ink)"}}>{label}</div>
        {sub && <div className="tiny muted-2">{sub}</div>}
      </div>
    </div>
  );
}

/* ---- generic toggle switch ---- */
function Switch({ on, onClick }){ return <button className={"sw"+(on?" on":"")} onClick={onClick} aria-pressed={on}></button>; }

/* ---- KPI target progress ---- */
function TargetBar({ value, target, lowerBetter, unit, money }){
  const pct = lowerBetter ? Math.min(100, (target/Math.max(value,0.001))*100) : Math.min(100,(value/target)*100);
  const ok = lowerBetter ? value<=target : value>=target;
  const col = ok?"var(--green)":pct>75?"var(--amber)":"var(--red)";
  return (
    <div>
      <div className="row between" style={{marginBottom:6}}>
        <span className="mono" style={{fontWeight:700,fontSize:18,color:"var(--ink)"}}>{money?C.fmtMoney(value):value}{!money&&unit?<span className="muted small"> {unit}</span>:null}</span>
        <span className="tiny muted-2">เป้า {money?C.fmtMoney(target):target}{unit&&!money?" "+unit:""}</span>
      </div>
      <HBar pct={pct} color={col}/>
    </div>
  );
}

Object.assign(window, { StatCard, BarChart, ParetoBars, AreaChart, Donut, Switch, TargetBar });
