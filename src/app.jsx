/* ============================================================
   MT_System — App shell, routing, role switch, tweaks
   Premium white desktop web app
   ============================================================ */
const { useState: uS, useEffect: uE } = React;

/* ---- screen registry ---- */
const SCREENS = {
  login: { comp: LoginScreen, shell: "full" },
  m_machine: { comp: MachineScreen, field: true, title: "ข้อมูลเครื่องจักร", sub: "สแกน QR เพื่อเปิดข้อมูลเครื่องและแจ้งซ่อม" },
  m_report: { comp: ReportForm, field: true, title: "แจ้งซ่อมเครื่องจักร", sub: "กรอกรายละเอียดอาการเสีย", back: true },
  m_lowpart: { comp: LowPartForm, field: true, title: "แจ้งอะไหล่ใกล้หมด", sub: "แจ้งคลังเมื่อพบอะไหล่ใกล้หมดที่หน้างาน", back: true, wide: true },
  m_queue: { comp: TechQueue, field: true, title: "คิวงานซ่อม", sub: "รายการงานที่รอและกำลังดำเนินการ", wide: true },
  m_repair: { comp: RepairForm, field: true, title: "บันทึกการซ่อม", sub: "บันทึกผลและอะไหล่ที่ใช้", back: true },
  m_requests: { comp: MobileRequests, field: true, title: "ใบแจ้งซ่อม", sub: "ติดตามสถานะใบแจ้งซ่อม", wide: true },
  m_history: { comp: RecentHistory, field: true, title: "ประวัติการแจ้งซ่อมล่าสุด", sub: "รายการแจ้งซ่อมทั้งหมด เรียงล่าสุด", wide: true },
  m_detail: { comp: MobileDetail, field: true, title: "รายละเอียดใบแจ้ง", back: true },
  d_requests: { comp: RequestList, shell: "desktop" },
  d_detail: { comp: RequestDetail, shell: "desktop" },
  d_verify: { comp: VerifyQueue, shell: "desktop" },
  d_prodverify: { comp: ProductionVerify, shell: "desktop" },
  d_pm: { comp: PmSchedule, shell: "desktop" },
  d_master: { comp: MasterData, shell: "desktop" },
  d_reorder: { comp: ReorderList, shell: "desktop" },
  d_pohistory: { comp: POHistory, shell: "desktop" },
  d_stock: { comp: StockInOut, shell: "desktop" },
  d_dashboard: { comp: Dashboard, shell: "desktop" },
  d_reliability: { comp: ReliabilityDashboard, shell: "desktop" },
  d_monthly_report: { comp: MonthlyReport, shell: "desktop" },
  d_check_status: { comp: DailyCheckStatus, shell: "desktop" },
  m_checkin: { comp: DailyCheckIn, field: true, title: "เช็คความพร้อมเครื่องจักร", sub: "บันทึกผลตรวจประจำวัน", back: true, wide: false },
  d_admin: { comp: Admin, shell: "desktop" }
};

/* ---- per-role navigation (all desktop web) ---- */
const NAV = {
  "Operator": { home: "m_machine", menu: [
    ["แจ้งซ่อม", [["m_machine", "เครื่องจักร (QR)", "machine"], ["m_requests", "ใบแจ้งของฉัน", "list"], ["m_history", "ประวัติการแจ้งซ่อมล่าสุด", "clock"]]],
    ["เช็คประจำวัน", [["m_checkin", "เช็คความพร้อมเครื่อง", "checkCircle"]]]]
  },
  "Maintenance": { home: "m_queue", menu: [
    ["งานซ่อมบำรุง", [["m_queue", "คิวงานซ่อม", "wrench"], ["d_requests", "ใบแจ้งซ่อมทั้งหมด", "list"], ["d_pm", "แผน PM", "cal"]]],
    ["เช็คประจำวัน", [["d_check_status", "สถานะเช็คเครื่อง", "checkCircle"]]],
    ["จัดการข้อมูล", [["d_admin", "จัดการเครื่องจักร", "machine"]]],
    ["ภาพรวม", [["d_dashboard", "Dashboard", "gauge"]]]]
  },
  "Production": { home: "d_prodverify", menu: [
    ["ฝ่ายผลิต", [["d_prodverify", "ตรวจสอบใบแจ้งซ่อม", "checkCircle"], ["d_requests", "ใบแจ้งซ่อมทั้งหมด", "list"]]]]
  },
  "Store Keeper": { home: "d_master", menu: [
    ["คลังอะไหล่", [["d_master", "Master Data", "box"], ["d_reorder", "รายการสั่งซื้อ", "truck"], ["d_pohistory", "ประวัติใบสั่งซื้อ", "clock"], ["d_stock", "รับเข้า/เบิกออก", "download"]]]]
  },
  "Manager": { home: "d_dashboard", menu: [
    ["ภาพรวมบริหาร", [["d_dashboard", "Dashboard KPI", "gauge"], ["d_reliability", "Reliability Analysis", "chart"], ["d_monthly_report", "รายงานประจำเดือน", "download"]]],
    ["เช็คประจำวัน", [["d_check_status", "สถานะเช็คเครื่อง", "checkCircle"]]]]
  },
  "Admin": { home: "d_admin", menu: [
    ["จัดการระบบ", [["d_admin", "Master Data / Users", "cog"]]]]
  }
};

const ROLES = ["Operator", "Maintenance", "Production", "Store Keeper", "Manager", "Admin"];

/* responsive: true when viewport is phone/tablet width */
function useIsMobile(bp) {
  const q = bp || 860;
  const [m, setM] = uS(() => typeof window !== "undefined" && window.innerWidth <= q);
  uE(() => {
    const on = () => setM(window.innerWidth <= q);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [q]);
  return m;
}

/* Production role identity is scoped to this app (not in shared data.js) */
const EXTRA_USERS = { "Production": { name: "Kanya P.", short: "KP" } };
const EXTRA_LABELS = { "Production": "ฝ่ายผลิต" };
const userOf = (r) => DATA.roleUser[r] || EXTRA_USERS[r] || { name: r, short: r.slice(0, 2) };
const labelOf = (r) => DATA.roleLabelTH[r] || EXTRA_LABELS[r] || r;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "fontFamily": "IBM Plex Sans Thai",
  "density": "cozy",
  "brand": "#232019"
} /*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  /* อ่าน ?mc= จาก URL เมื่อสแกน QR */
  const _qs = new URLSearchParams(window.location.search);
  const initialMC = _qs.get("mc") || null;
  const initialCheckMode = _qs.get("check") === "1";
  const [screen, setScreen] = uS(() => initialMC ? (initialCheckMode ? "m_checkin" : "m_machine") : "login");
  const [params, setParams] = uS(() => initialMC ? { mc: initialMC } : {});
  const [role, setRole] = uS("Operator");
  const [stack, setStack] = uS([]);
  const [pendingMC, setPendingMC] = uS(initialMC);
  /* guest: เข้ามาจากสแกน QR โดยตรง ยังไม่ได้ login */
  const [guest, setGuest] = uS(() => !!initialMC);
  const [toast, setToast] = uS(null);
  const [roleMenu, setRoleMenu] = uS(false);
  /* live update: re-render เมื่อ api-bridge แจ้งว่าสถานะเปลี่ยน (คงหน้าจอเดิม) */
  const [, __setTick] = uS(0);
  uE(() => {
    const h = () => __setTick((x) => x + 1);
    window.addEventListener("mt-data-refresh", h);
    return () => window.removeEventListener("mt-data-refresh", h);
  }, []);
  /* ลบ ?mc= ออกจาก URL หลังอ่านค่าแล้ว เพื่อไม่ให้ reload ซ้ำกลับมาที่ guest mode */
  uE(() => {
    if (initialMC) window.history.replaceState({}, "", window.location.pathname);
  }, []);
  const isMobile = useIsMobile(860);
  const [drawer, setDrawer] = uS(false);
  const [navCollapsed, setNavCollapsed] = uS(() => typeof localStorage !== "undefined" && localStorage.getItem("mt_nav_collapsed") === "1");
  uE(() => { try { localStorage.setItem("mt_nav_collapsed", navCollapsed ? "1" : "0"); } catch {} }, [navCollapsed]);
  const collapsed = !isMobile && navCollapsed;
  /* close the drawer whenever we navigate or switch role */
  uE(() => {setDrawer(false);}, [screen, role]);

  uE(() => {
    const fams = {
      "IBM Plex Sans Thai": '"IBM Plex Sans Thai",sans-serif',
      "Noto Sans Thai": '"Noto Sans Thai",sans-serif',
      "Sarabun": '"Sarabun",sans-serif'
    };
    document.documentElement.style.setProperty("--font", fams[t.fontFamily] || fams["IBM Plex Sans Thai"]);
    document.documentElement.style.setProperty("--navy", t.brand);
    document.documentElement.setAttribute("data-density", t.density);
  }, [t]);

  const showToast = (msg, kind) => {setToast({ msg, kind });clearTimeout(window.__tt);window.__tt = setTimeout(() => setToast(null), 3200);};
  const go = (s, p = {}) => {setStack((st) => [...st, { screen, params }]);setScreen(s);setParams(p);document.querySelector("main")?.scrollTo(0, 0);window.scrollTo(0, 0);};
  const back = () => {setStack((st) => {if (st.length === 0) return st;const prev = st[st.length - 1];setScreen(prev.screen);setParams(prev.params);return st.slice(0, -1);});};
  const login = (r, home) => {
    if (pendingMC && r === "Operator") {
      setRole(r); setScreen("m_machine"); setParams({ mc: pendingMC }); setStack([]);
      window.history.replaceState({}, "", window.location.pathname);
    } else {
      setRole(r); setScreen(home); setParams({}); setStack([]);
    }
  };
  const switchRole = (r) => {setRole(r);setScreen(NAV[r].home);setParams({});setStack([]);setRoleMenu(false);};
  const logout = () => {setScreen("login");setStack([]);setRoleMenu(false);};
  const exitGuest = () => {setGuest(false);setPendingMC(null);setScreen("login");setParams({});setStack([]);};

  const ctx = { go, back, login, role, params, toast: showToast, pendingMC, guest, exitGuest };
  const meta = SCREENS[screen] || SCREENS.login;
  const Comp = meta.comp;
  const user = userOf(role);

  /* ---------- login (full) ---------- */
  if (meta.shell === "full") {
    return <><Comp ctx={ctx} /><Toast toast={toast} />{tweaksPanel(t, setTweak)}</>;
  }

  /* ---------- role switcher ---------- */
  const RoleSwitch = () =>
  <div style={{ position: "relative" }}>
      <button className="row gap-sm" onClick={() => setRoleMenu((m) => !m)} style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 11, padding: "6px 11px 6px 8px", color: "var(--ink)", cursor: "pointer" }}>
        <span className="avatar" style={{ width: 32, height: 32 }}>{user.short}</span>
        <span style={{ textAlign: "left", lineHeight: 1.25 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{user.name}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)" }}>{role} · {labelOf(role)}</span>
        </span>
        <Icon name="chevD" size={15} style={{ color: "var(--ink-3)" }} />
      </button>
      {roleMenu &&
    <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 248, zIndex: 50, boxShadow: "var(--sh-3)", overflow: "hidden" }}>
          <div className="eyebrow" style={{ padding: "12px 14px 6px" }}>สลับบทบาท · prototype</div>
          {ROLES.map((r) =>
      <button key={r} className="row between" style={{ width: "100%", padding: "10px 14px", background: r === role ? "var(--surface-2)" : "transparent", border: 0, cursor: "pointer", textAlign: "left" }} onClick={() => switchRole(r)}>
              <span><span style={{ fontWeight: 600, fontSize: 13.5 }}>{r}</span><span className="tiny muted-2" style={{ display: "block" }}>{labelOf(r)}</span></span>
              {r === role && <Icon name="check" size={15} style={{ color: "var(--accent)" }} />}
            </button>
      )}
          <div className="divider"></div>
          <button className="row gap-sm" style={{ width: "100%", padding: "12px 14px", border: 0, background: "transparent", cursor: "pointer", color: "var(--red-ink)", fontWeight: 600, fontSize: 13.5 }} onClick={logout}>
            <Icon name="logout" size={16} /> ออกจากระบบ
          </button>
        </div>
    }
    </div>;


  const nav = NAV[role];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* backdrop for mobile drawer */}
      {isMobile && drawer && !guest &&
      <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,28,40,.42)", zIndex: 55, backdropFilter: "blur(1px)" }}></div>
      }
      {/* sidebar — white premium (drawer on mobile), hidden for guest (scanned-QR, ยังไม่ login) */}
      {!guest &&
      <aside className="no-print" style={isMobile ?
      { width: 280, maxWidth: "84vw", flex: "none", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, height: "100vh", zIndex: 60, transform: drawer ? "translateX(0)" : "translateX(-102%)", transition: "transform .26s cubic-bezier(.4,0,.2,1)", boxShadow: drawer ? "var(--sh-3)" : "none" } :
      { width: collapsed ? 76 : 256, flex: "none", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", transition: "width .18s ease" }}>
        <div style={{ padding: collapsed ? "18px 8px" : "22px 20px 20px", display: "flex", alignItems: "center", gap: 12, justifyContent: collapsed ? "center" : "flex-start", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="wrench" size={21} /></span>
          {!collapsed && <div>
            <div className="h-md" style={{ lineHeight: 1.1, fontSize: "15px" }}>Maintenance System</div>
            <div className="tiny" style={{ color: "var(--ink-3)", letterSpacing: ".04em", marginTop: 1, fontSize: "10px" }}>Machine Maintenance Console</div>
          </div>}
        </div>
        {!isMobile &&
        <button className="icon-btn" onClick={() => setNavCollapsed((c) => !c)} title={collapsed ? "ขยายเมนู" : "ย่อเมนู"} aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"} style={{ alignSelf: collapsed ? "center" : "flex-end", margin: collapsed ? "8px 0 0" : "8px 10px 0 0" }}>
          <Icon name={collapsed ? "chevR" : "chevL"} size={15} />
        </button>
        }
        <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "10px 8px" : "18px 14px" }}>
          {nav.menu.map(([section, items]) =>
          <div key={section} style={{ marginBottom: 22 }}>
              {!collapsed && <div className="eyebrow" style={{ padding: "0 12px 10px", fontSize: 10.5 }}>{section}</div>}
              {items.map(([s, l, ic]) => {
              const active = screen === s ||
              s === "d_prodverify" && screen === "d_detail" && role === "Production" ||
              s === "d_requests" && screen === "d_detail" && role !== "Production" ||
              s === "m_machine" && screen === "m_report" ||
              s === "m_machine" && screen === "m_lowpart" ||
              s === "m_checkin" && screen === "m_checkin" ||
              s === "m_queue" && screen === "m_repair" ||
              s === "m_requests" && screen === "m_detail";
              return (
                <button key={s} title={collapsed ? l : undefined} onClick={() => {setStack([]);setScreen(s);setParams({});}} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : 12, padding: collapsed ? "11px 0" : "11px 12px", justifyContent: collapsed ? "center" : "flex-start", marginBottom: 3, borderRadius: 10, cursor: "pointer", textAlign: "left",
                  border: 0, position: "relative",
                  background: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--ink)" : "var(--ink-2)", fontWeight: active ? 700 : 500, fontSize: 14 }}>
                    {active && <span style={{ position: "absolute", left: 0, top: 9, bottom: 9, width: 3, borderRadius: 3, background: "var(--accent)" }}></span>}
                    <Icon name={ic} size={18} style={{ color: active ? "var(--accent)" : "var(--ink-3)" }} /> {!collapsed && l}
                    {!collapsed && s === "d_prodverify" && (() => { const n = (DATA.requests||[]).filter(r => (r.status==="Completed"||r.status==="Resubmitted") && !r.prodDecision).length; return n > 0 ? <span style={{ marginLeft:"auto", background:"var(--red)", color:"#fff", borderRadius:99, fontSize:11, fontWeight:700, padding:"1px 7px", minWidth:20, textAlign:"center" }}>{n}</span> : null; })()}
                  </button>);

            })}
            </div>
          )}
        </nav>
        <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
          {!collapsed && <div className="eyebrow" style={{ padding: "0 4px 9px", fontSize: 10 }}>เข้าสู่ระบบ</div>}
          <button className="row between" title={collapsed ? user.name + " · " + role : undefined} onClick={() => setRoleMenu((m) => !m)} style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 11, padding: collapsed ? "9px 0" : "9px 11px", color: "var(--ink)", cursor: "pointer", justifyContent: collapsed ? "center" : "space-between" }}>
            <span className="row gap-sm" style={{ justifyContent: collapsed ? "center" : "flex-start" }}><span className="avatar" style={{ width: 30, height: 30 }}>{user.short}</span>{!collapsed && <span style={{ textAlign: "left" }}><span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{user.name}</span><span className="tiny" style={{ display: "block", color: "var(--ink-3)" }}>{role}</span></span>}</span>
            {!collapsed && <Icon name="chevD" size={14} style={{ color: "var(--ink-3)" }} />}
          </button>
        </div>
      </aside>
      }

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="no-print" style={{ height: 64, flex: "none", background: "rgba(255,255,255,.82)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 14px" : "0 28px", position: "sticky", top: 0, zIndex: 30 }}>
          <div className="row gap-sm" style={{ minWidth: 0 }}>
            {isMobile && !guest &&
            <button className="icon-btn" onClick={() => setDrawer(true)} aria-label="เมนู"><Icon name="menu" size={20} /></button>
            }
            <span className="eyebrow" style={{ whiteSpace: "nowrap", cursor: guest ? "default" : "pointer" }} onClick={guest ? undefined : () => { setStack([]); setScreen(nav.home); setParams({}); }}>{guest ? "สแกน QR" : labelOf(role)}</span>
            {!isMobile && <span style={{ color: "var(--ink-3)" }}>/</span>}
            {!isMobile && <span className="small" style={{ fontWeight: 600 }}>{screenTitle(screen, meta)}</span>}
          </div>
          <div className="row gap-sm">
            {guest ?
            <button className="row gap-sm" onClick={exitGuest} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 11, padding: "8px 14px", color: "var(--ink)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              <Icon name="user" size={16} /> เข้าสู่ระบบ (สำหรับพนักงาน)
            </button> :
            <RoleSwitch />}
          </div>
        </header>

        <main style={{ flex: 1, padding: isMobile ? "18px 14px 88px" : "30px 32px 60px", width: "100%" }}>
          {meta.field ?
          <div style={{ maxWidth: isMobile ? "100%" : meta.wide ? 960 : 760, margin: "0 auto" }}>
              <div className="row between wrap" style={{ marginBottom: 20, gap: 12 }}>
                <div className="row gap-sm">
                  {meta.back && <button className="icon-btn" onClick={back}><Icon name="chevL" size={18} /></button>}
                  <div>
                    <div className="h-lg">{meta.title}</div>
                    {meta.sub && <div className="muted small" style={{ marginTop: 2 }}>{meta.sub}</div>}
                  </div>
                </div>
              </div>
              <Comp ctx={ctx} />
            </div> :

          <div style={{ maxWidth: isMobile ? "100%" : 1340 }}><Comp ctx={ctx} /></div>
          }
        </main>
      </div>
      <div className="no-print"><Toast toast={toast} />{tweaksPanel(t, setTweak)}</div>
    </div>);

}

function tweaksPanel(t, setTweak) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="ตัวอักษร" />
      <TweakSelect label="ฟอนต์" value={t.fontFamily} options={["IBM Plex Sans Thai", "Noto Sans Thai", "Sarabun"]} onChange={(v) => setTweak("fontFamily", v)} />
      <TweakRadio label="ความหนาแน่น" value={t.density} options={["compact", "cozy"]} onChange={(v) => setTweak("density", v)} />
      <TweakSection label="โทนแบรนด์" />
      <TweakColor label="สี Chrome" value={t.brand} options={["#232019", "#1f2a24", "#2a2433", "#26201a"]} onChange={(v) => setTweak("brand", v)} />
    </TweaksPanel>);

}

function screenTitle(s, meta) {
  if (meta && meta.field) return meta.title;
  const m = { d_requests: "ใบแจ้งซ่อม", d_detail: "รายละเอียดใบแจ้ง", d_verify: "ตรวจรับงาน", d_prodverify: "ตรวจสอบใบแจ้งซ่อม (ฝ่ายผลิต)", d_pm: "แผน PM",
    d_master: "คลังอะไหล่ Master Data", d_reorder: "รายการสั่งซื้อ", d_pohistory: "ประวัติใบสั่งซื้อ", d_stock: "รับเข้า/เบิกออก",
    d_dashboard: "Dashboard ผู้บริหาร", d_admin: "ผู้ดูแลระบบ",
    d_check_status: "สถานะเช็คเครื่องประจำวัน" };
  return m[s] || "";
}

/* dual-mode mount: static data.js mounts now / bridge waits for "mt-data-ready" */
function __mtMount() { ReactDOM.createRoot(document.getElementById("root")).render(<App />); }
if (window.__MT_READY || (window.DATA && window.DATA.machines)) __mtMount();
else window.addEventListener("mt-data-ready", __mtMount, { once: true });
