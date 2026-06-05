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
  m_detail: { comp: MobileDetail, field: true, title: "รายละเอียดใบแจ้ง", back: true },
  d_requests: { comp: RequestList, shell: "desktop" },
  d_detail: { comp: RequestDetail, shell: "desktop" },
  d_verify: { comp: VerifyQueue, shell: "desktop" },
  d_pm: { comp: PmSchedule, shell: "desktop" },
  d_master: { comp: MasterData, shell: "desktop" },
  d_reorder: { comp: ReorderList, shell: "desktop" },
  d_stock: { comp: StockInOut, shell: "desktop" },
  d_dashboard: { comp: Dashboard, shell: "desktop" },
  d_admin: { comp: Admin, shell: "desktop" }
};

/* ---- per-role navigation (all desktop web) ---- */
const NAV = {
  "Operator": { home: "m_machine", menu: [
    ["แจ้งซ่อม", [["m_machine", "เครื่องจักร (QR)", "machine"], ["m_requests", "ใบแจ้งของฉัน", "list"]]]]
  },
  "Technician": { home: "m_queue", menu: [
    ["งานช่าง", [["m_queue", "คิวงานซ่อม", "wrench"], ["m_requests", "ใบแจ้งทั้งหมด", "list"]]]]
  },
  "Supervisor": { home: "d_verify", menu: [
    ["งานซ่อม", [["d_verify", "ตรวจรับงาน", "checkCircle"], ["d_requests", "ใบแจ้งซ่อม", "list"], ["d_pm", "แผน PM", "cal"]]],
    ["ภาพรวม", [["d_dashboard", "Dashboard", "gauge"]]]]
  },
  "Store Keeper": { home: "d_master", menu: [
    ["คลังอะไหล่", [["d_master", "Master Data", "box"], ["d_reorder", "รายการสั่งซื้อ", "truck"], ["d_stock", "รับเข้า/เบิกออก", "download"]]]]
  },
  "Manager": { home: "d_dashboard", menu: [
    ["ภาพรวมบริหาร", [["d_dashboard", "Dashboard KPI", "gauge"]]]]
  },
  "Admin": { home: "d_admin", menu: [
    ["จัดการระบบ", [["d_admin", "Master Data / Users", "cog"]]]]
  }
};

const ROLES = ["Operator", "Technician", "Supervisor", "Store Keeper", "Manager", "Admin"];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "fontFamily": "IBM Plex Sans Thai",
  "density": "cozy",
  "brand": "#232019"
} /*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = uS("login");
  const [params, setParams] = uS({});
  const [role, setRole] = uS("Operator");
  const [stack, setStack] = uS([]);
  const [toast, setToast] = uS(null);
  const [roleMenu, setRoleMenu] = uS(false);
  /* live update: re-render เมื่อ api-bridge แจ้งว่าสถานะเปลี่ยน (คงหน้าจอเดิม) */
  const [, __setTick] = uS(0);
  uE(() => {
    const h = () => __setTick((x) => x + 1);
    window.addEventListener("mt-data-refresh", h);
    return () => window.removeEventListener("mt-data-refresh", h);
  }, []);

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
  const login = (r, home) => {setRole(r);setScreen(home);setParams({});setStack([]);};
  const switchRole = (r) => {setRole(r);setScreen(NAV[r].home);setParams({});setStack([]);setRoleMenu(false);};
  const logout = () => {setScreen("login");setStack([]);setRoleMenu(false);};

  const ctx = { go, back, login, role, params, toast: showToast };
  const meta = SCREENS[screen] || SCREENS.login;
  const Comp = meta.comp;
  const user = DATA.roleUser[role];

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
          <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)" }}>{role} · {DATA.roleLabelTH[role]}</span>
        </span>
        <Icon name="chevD" size={15} style={{ color: "var(--ink-3)" }} />
      </button>
      {roleMenu &&
    <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 248, zIndex: 50, boxShadow: "var(--sh-3)", overflow: "hidden" }}>
          <div className="eyebrow" style={{ padding: "12px 14px 6px" }}>สลับบทบาท · prototype</div>
          {ROLES.map((r) =>
      <button key={r} className="row between" style={{ width: "100%", padding: "10px 14px", background: r === role ? "var(--surface-2)" : "transparent", border: 0, cursor: "pointer", textAlign: "left" }} onClick={() => switchRole(r)}>
              <span><span style={{ fontWeight: 600, fontSize: 13.5 }}>{r}</span><span className="tiny muted-2" style={{ display: "block" }}>{DATA.roleLabelTH[r]}</span></span>
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
      {/* sidebar — white premium */}
      <aside style={{ width: 256, flex: "none", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "22px 20px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="wrench" size={21} /></span>
          <div>
            <div className="h-md" style={{ lineHeight: 1.1, fontSize: "15px" }}>Maintenance System</div>
            <div className="tiny" style={{ color: "var(--ink-3)", letterSpacing: ".04em", marginTop: 1, fontSize: "10px" }}>Machine Maintenance Console</div>
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "18px 14px" }}>
          {nav.menu.map(([section, items]) =>
          <div key={section} style={{ marginBottom: 22 }}>
              <div className="eyebrow" style={{ padding: "0 12px 10px", fontSize: 10.5 }}>{section}</div>
              {items.map(([s, l, ic]) => {
              const active = screen === s ||
              s === "d_verify" && screen === "d_detail" && role === "Supervisor" ||
              s === "d_requests" && screen === "d_detail" && role !== "Supervisor" ||
              s === "m_machine" && screen === "m_report" ||
              s === "m_machine" && screen === "m_lowpart" ||
              s === "m_queue" && screen === "m_repair" ||
              s === "m_requests" && screen === "m_detail";
              return (
                <button key={s} onClick={() => {setStack([]);setScreen(s);setParams({});}} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", marginBottom: 3, borderRadius: 10, cursor: "pointer", textAlign: "left",
                  border: 0, position: "relative",
                  background: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--ink)" : "var(--ink-2)", fontWeight: active ? 700 : 500, fontSize: 14 }}>
                    {active && <span style={{ position: "absolute", left: 0, top: 9, bottom: 9, width: 3, borderRadius: 3, background: "var(--accent)" }}></span>}
                    <Icon name={ic} size={18} style={{ color: active ? "var(--accent)" : "var(--ink-3)" }} /> {l}
                  </button>);

            })}
            </div>
          )}
        </nav>
        <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
          <div className="eyebrow" style={{ padding: "0 4px 9px", fontSize: 10 }}>เข้าสู่ระบบ</div>
          <button className="row between" onClick={() => setRoleMenu((m) => !m)} style={{ width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 11, padding: "9px 11px", color: "var(--ink)", cursor: "pointer" }}>
            <span className="row gap-sm"><span className="avatar" style={{ width: 30, height: 30 }}>{user.short}</span><span style={{ textAlign: "left" }}><span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{user.name}</span><span className="tiny" style={{ display: "block", color: "var(--ink-3)" }}>{role}</span></span></span>
            <Icon name="chevD" size={14} style={{ color: "var(--ink-3)" }} />
          </button>
        </div>
      </aside>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 64, flex: "none", background: "rgba(255,255,255,.82)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 30 }}>
          <div className="row gap-sm">
            <span className="eyebrow">{DATA.roleLabelTH[role]}</span>
            <span style={{ color: "var(--ink-3)" }}>/</span>
            <span className="small" style={{ fontWeight: 600 }}>{screenTitle(screen, meta)}</span>
          </div>
          <div className="row gap-sm">
            <button className="icon-btn" onClick={() => showToast("3 การแจ้งเตือนใหม่", "mail")} style={{ position: "relative" }}>
              <Icon name="bell" size={18} /><span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }}></span>
            </button>
            <RoleSwitch />
          </div>
        </header>

        <main style={{ flex: 1, padding: "30px 32px 60px", width: "100%" }}>
          {meta.field ?
          <div style={{ maxWidth: meta.wide ? 960 : 760, margin: "0 auto" }}>
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

          <div style={{ maxWidth: 1340 }}><Comp ctx={ctx} /></div>
          }
        </main>
      </div>
      <Toast toast={toast} />{tweaksPanel(t, setTweak)}
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
  const m = { d_requests: "ใบแจ้งซ่อม", d_detail: "รายละเอียดใบแจ้ง", d_verify: "ตรวจรับงาน", d_pm: "แผน PM",
    d_master: "คลังอะไหล่ Master Data", d_reorder: "รายการสั่งซื้อ", d_stock: "รับเข้า/เบิกออก",
    d_dashboard: "Dashboard ผู้บริหาร", d_admin: "ผู้ดูแลระบบ" };
  return m[s] || "";
}

/* dual-mode mount: static data.js mounts now / bridge waits for "mt-data-ready" */
function __mtMount() { ReactDOM.createRoot(document.getElementById("root")).render(<App />); }
if (window.__MT_READY || (window.DATA && window.DATA.machines)) __mtMount();
else window.addEventListener("mt-data-ready", __mtMount, { once: true });
