/* ============================================================
   MT_System — Daily Machine Check-in Screens
   - DailyCheckIn  : mobile check form (operator)
   - DailyCheckStatus : desktop approval dashboard
   ============================================================ */

/* ─── symbols ─────────────────────────────────────────────── */
const RESULT_LABELS = { P: "ปกติ", W: "บกพร่อง", F: "เสีย", V: "แก้ไขแล้ว" };
const RESULT_SYMBOLS = { P: "✓", W: "△", F: "✗", V: "✔" };
const RESULT_COLORS = {
  P: { bg: "#f0fdf4", border: "#86efac", ink: "#166534" },
  W: { bg: "#fffbeb", border: "#fcd34d", ink: "#92400e" },
  F: { bg: "#fff1f2", border: "#fca5a5", ink: "#9f1239" },
  V: { bg: "#eff6ff", border: "#93c5fd", ink: "#1e40af" },
};

/* ─── ResultPicker : single item radio ─────────────────────── */
function ResultPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {["P", "W", "F", "V"].map((r) => {
        const c = RESULT_COLORS[r];
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            style={{
              padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${active ? c.border : "var(--border)"}`,
              background: active ? c.bg : "var(--surface)", color: active ? c.ink : "var(--ink-3)",
              fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer", minWidth: 64, transition: "all .12s",
            }}
          >
            {RESULT_SYMBOLS[r]} {RESULT_LABELS[r]}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 1: DailyCheckIn  (mobile)
   Props: ctx.params.mc = machine code
══════════════════════════════════════════════════════════════ */
function DailyCheckIn({ ctx }) {
  const { useState: uS, useEffect: uE } = React;
  const mc = ctx.params.mc || "";
  const today = new Date().toISOString().slice(0, 10);

  const [template, setTemplate] = uS(null);
  const [existing, setExisting] = uS(null);
  const [results, setResults] = uS({});    // { item_id: { result, remarks } }
  const [operator, setOperator] = uS("");
  const [loading, setLoading] = uS(true);
  const [submitting, setSubmitting] = uS(false);
  const [done, setDone] = uS(null);
  const [err, setErr] = uS(null);

  uE(() => {
    if (!mc) { setErr("ไม่มีรหัสเครื่อง กรุณาสแกน QR ใหม่"); setLoading(false); return; }
    Promise.all([DATA.loadCheckTemplate(mc), DATA.loadCheckRecord(mc, today)])
      .then(([tmpl, rec]) => {
        setTemplate(tmpl);
        if (rec.record && rec.record.status === "submitted") {
          const init = {};
          rec.results.forEach(r => { init[r.item_id] = { result: r.result, remarks: r.remarks || "" }; });
          setExisting(rec.record);
          setResults(init);
          setOperator(rec.record.operator_name || "");
        } else {
          const init = {};
          tmpl.items.forEach(it => { init[it.id] = { result: "P", remarks: "" }; });
          setResults(init);
        }
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [mc]);

  const setResult = (id, val) => setResults(prev => ({ ...prev, [id]: { ...prev[id], result: val } }));
  const setRemarks = (id, val) => setResults(prev => ({ ...prev, [id]: { ...prev[id], remarks: val } }));

  const submit = async () => {
    if (!operator.trim()) { ctx.toast("กรุณากรอกชื่อผู้ตรวจ", "error"); return; }
    const allSet = template.items.every(it => results[it.id]?.result);
    if (!allSet) { ctx.toast("กรุณาเลือกผลตรวจให้ครบทุกรายการ", "error"); return; }
    setSubmitting(true);
    try {
      const payload = template.items.map(it => ({
        item_id: it.id,
        result: results[it.id].result,
        remarks: results[it.id].remarks || null,
      }));
      const res = await DATA.submitCheck(mc, today, operator.trim(), payload);
      setDone(res);
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="muted" style={{ padding: 32, textAlign: "center" }}>กำลังโหลด...</div>;
  if (err) return <div style={{ padding: 32, textAlign: "center", color: "var(--red-ink)" }}>{err}</div>;

  /* Done screen */
  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{done.had_problem ? "⚠️" : "✅"}</div>
        <div className="h-lg" style={{ marginBottom: 8 }}>
          {done.had_problem ? "พบปัญหา — แจ้งซ่อมแล้ว" : "เช็คเสร็จสิ้น — ปกติทุกรายการ"}
        </div>
        <div className="muted small" style={{ marginBottom: 24 }}>
          {mc} · {today}
          {done.had_problem && <><br /><span style={{ color: "var(--red-ink)" }}>ส่งใบแจ้งซ่อมอัตโนมัติแล้ว</span></>}
        </div>
        <button className="btn-primary" onClick={() => { setDone(null); setExisting({ status: "submitted" }); }}>
          ดูผลที่บันทึก
        </button>
      </div>
    );
  }

  const machine = template.machine;
  const isReadOnly = existing?.status === "submitted";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 0 80px" }}>
      {/* Header */}
      <div className="card" style={{ padding: "16px 18px", marginBottom: 16, background: "var(--navy)", color: "#fff" }}>
        <div style={{ fontSize: 11, opacity: .7, letterSpacing: ".06em", marginBottom: 2 }}>
          เช็คความพร้อมประจำวัน · {today}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{machine.code}</div>
        <div style={{ fontSize: 13, opacity: .85 }}>{machine.name}</div>
        <div style={{ fontSize: 11, opacity: .6, marginTop: 2 }}>
          Line {machine.line_group} · {machine.template_type_name}
        </div>
      </div>

      {isReadOnly && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#92400e" }}>
          ✅ บันทึกผลการตรวจแล้ว โดย <b>{existing.operator_name}</b> · {existing.submitted_at?.slice(0, 16)}
        </div>
      )}

      {/* Operator name */}
      {!isReadOnly && (
        <div className="card" style={{ padding: "14px 16px", marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>ชื่อผู้ตรวจ *</label>
          <input
            className="input"
            placeholder="กรอกชื่อ-นามสกุล"
            value={operator}
            onChange={e => setOperator(e.target.value)}
            style={{ width: "100%", fontSize: 14 }}
          />
        </div>
      )}

      {/* Checklist items */}
      {template.items.map((it, idx) => {
        const rv = results[it.id] || { result: "P", remarks: "" };
        const c = RESULT_COLORS[rv.result] || RESULT_COLORS.P;
        const needsRemark = rv.result === "W" || rv.result === "F";
        return (
          <div key={it.id} className="card" style={{
            padding: "14px 16px", marginBottom: 10,
            borderLeft: `4px solid ${c.border}`,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: needsRemark ? 10 : isReadOnly ? 8 : 10 }}>
              <span style={{ background: "var(--surface-2)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700, color: "var(--ink-2)", flex: "none" }}>
                {it.seq_label}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{it.item_desc}</div>
                {it.standard_criteria && (
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    เกณฑ์: {it.standard_criteria}{it.method ? ` · วิธี: ${it.method}` : ""}
                  </div>
                )}
              </div>
            </div>
            {isReadOnly ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.ink, borderRadius: 6, padding: "4px 10px", fontWeight: 700, fontSize: 13 }}>
                  {RESULT_SYMBOLS[rv.result]} {RESULT_LABELS[rv.result]}
                </span>
                {rv.remarks && <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{rv.remarks}</span>}
              </div>
            ) : (
              <>
                <ResultPicker value={rv.result} onChange={v => setResult(it.id, v)} />
                {needsRemark && (
                  <textarea
                    placeholder="บันทึกหมายเหตุ (จำเป็น)..."
                    value={rv.remarks}
                    onChange={e => setRemarks(it.id, e.target.value)}
                    style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, resize: "vertical", minHeight: 56, fontFamily: "inherit" }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Submit button */}
      {!isReadOnly && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 16px", background: "rgba(255,255,255,.95)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--border)", zIndex: 20 }}>
          <button
            className="btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 12 }}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก..." : "ยืนยันผลการตรวจ"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 2: DailyCheckStatus  (desktop)
   Dashboard: line overview + approval buttons
══════════════════════════════════════════════════════════════ */
function DailyCheckStatus({ ctx }) {
  const { useState: uS, useEffect: uE } = React;
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = uS(today);
  const [data, setData] = uS(null);
  const [loading, setLoading] = uS(true);
  const [approving, setApproving] = uS(null);
  const [approverName, setApproverName] = uS("");
  const [approveNotes, setApproveNotes] = uS("");
  const [approveTarget, setApproveTarget] = uS(null); // {line, role}
  const [expandedLine, setExpandedLine] = uS(null);

  const load = async (d) => {
    setLoading(true);
    try { setData(await DATA.loadCheckStatus(d)); }
    catch (e) { ctx.toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  uE(() => { load(date); }, [date]);

  const doApprove = async () => {
    if (!approverName.trim()) { ctx.toast("กรุณากรอกชื่อผู้อนุมัติ", "error"); return; }
    setApproving(approveTarget);
    try {
      await DATA.approveCheck(date, approveTarget.line, approveTarget.role, approverName.trim(), approveNotes.trim());
      ctx.toast("บันทึกการอนุมัติแล้ว", "success");
      setApproveTarget(null);
      setApproverName("");
      setApproveNotes("");
      await load(date);
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setApproving(null);
    }
  };

  const LINE_COLORS = { A: "#3b82f6", B: "#10b981", C: "#f59e0b", D: "#8b5cf6", TFC: "#ef4444" };
  const ROLES = ["PD Supervisor", "MT Leader", "PD Manager"];

  return (
    <div>
      {/* Top bar */}
      <div className="row between wrap" style={{ marginBottom: 24, gap: 12 }}>
        <div>
          <div className="h-lg">สถานะเช็คเครื่องประจำวัน</div>
          <div className="muted small" style={{ marginTop: 2 }}>ติดตามการตรวจและอนุมัติแบบ Batch ต่อ Line</div>
        </div>
        <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border)", fontSize: 14 }} />
      </div>

      {loading && <div className="muted" style={{ textAlign: "center", padding: 40 }}>กำลังโหลด...</div>}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 28 }}>
            {Object.entries(data.lines).map(([line, info]) => {
              const pct = info.total > 0 ? Math.round(100 * info.submitted / info.total) : 0;
              const col = LINE_COLORS[line] || "#64748b";
              return (
                <div key={line} className="card" style={{ padding: "16px 18px", cursor: "pointer", border: expandedLine === line ? `2px solid ${col}` : "1px solid var(--border)" }}
                  onClick={() => setExpandedLine(expandedLine === line ? null : line)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: col, flex: "none" }}></span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Line {line}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? "#16a34a" : pct > 0 ? "#d97706" : "var(--ink-3)" }}>{pct}%</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{info.submitted}/{info.total} เครื่อง</div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: "var(--border)" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: col, width: pct + "%" }}></div>
                  </div>
                  {/* Approval dots */}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {ROLES.map(r => {
                      const done = info.approvals?.[r];
                      return <span key={r} title={r + (done ? " — " + done.approver_name : " — ยังไม่อนุมัติ")} style={{ width: 8, height: 8, borderRadius: 99, background: done ? "#22c55e" : "var(--border)", flex: "none" }}></span>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded line detail */}
          {expandedLine && data.lines[expandedLine] && (() => {
            const info = data.lines[expandedLine];
            const col = LINE_COLORS[expandedLine] || "#64748b";
            return (
              <div className="card" style={{ marginBottom: 24, border: `1.5px solid ${col}` }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 99, background: col, flex: "none" }}></span>
                  <span className="h-md">Line {expandedLine}</span>
                  <span className="badge" style={{ background: col + "22", color: col, border: `1px solid ${col}55` }}>
                    {info.submitted}/{info.total} ส่งแล้ว
                  </span>
                  {info.machines.some(m => m.has_problem) && (
                    <span className="badge" style={{ background: "#fff1f2", color: "#9f1239", border: "1px solid #fca5a5" }}>
                      ⚠ พบปัญหา {info.machines.filter(m => m.has_problem).length} เครื่อง
                    </span>
                  )}
                </div>

                {/* Machine list */}
                <div style={{ padding: "12px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8, marginBottom: 20 }}>
                    {info.machines.map(m => (
                      <div key={m.code} style={{
                        padding: "10px 12px", borderRadius: 8,
                        background: m.has_problem ? "#fff1f2" : m.status === "submitted" || m.status === "approved" ? "#f0fdf4" : "var(--surface-2)",
                        border: `1px solid ${m.has_problem ? "#fca5a5" : m.status === "submitted" || m.status === "approved" ? "#86efac" : "var(--border)"}`,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.code}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                        <div style={{ fontSize: 11 }}>
                          {m.status === "pending" && <span style={{ color: "var(--ink-3)" }}>⏳ รอเช็ค</span>}
                          {(m.status === "submitted" || m.status === "approved") && !m.has_problem && <span style={{ color: "#16a34a" }}>✓ ปกติ</span>}
                          {(m.status === "submitted" || m.status === "approved") && m.has_problem && <span style={{ color: "#9f1239" }}>⚠ พบปัญหา</span>}
                        </div>
                        {m.operator_name && <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>โดย: {m.operator_name}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Approval section */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    <div className="eyebrow" style={{ marginBottom: 12 }}>การอนุมัติ</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {ROLES.map(role => {
                        const ap = info.approvals?.[role];
                        return (
                          <div key={role} style={{ flex: "1 1 200px", padding: "12px 14px", borderRadius: 10, border: `1px solid ${ap ? "#86efac" : "var(--border)"}`, background: ap ? "#f0fdf4" : "var(--surface-2)" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: ap ? "#166534" : "var(--ink-2)" }}>{role}</div>
                            {ap ? (
                              <>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>✓ {ap.approver_name}</div>
                                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{ap.approved_at?.slice(0, 16)}</div>
                              </>
                            ) : (
                              <button
                                className="btn-ghost"
                                style={{ fontSize: 12, padding: "6px 12px", width: "100%" }}
                                onClick={() => setApproveTarget({ line: expandedLine, role })}
                              >
                                + ลงชื่ออนุมัติ
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Approve modal */}
      {approveTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ width: 440, padding: "28px 28px 24px", boxShadow: "var(--sh-3)" }}>
            <div className="h-md" style={{ marginBottom: 4 }}>ลงชื่ออนุมัติ</div>
            <div className="muted small" style={{ marginBottom: 20 }}>
              Line {approveTarget.line} · {approveTarget.role} · {date}
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>ชื่อผู้อนุมัติ *</label>
            <input className="input" placeholder="ชื่อ-นามสกุล" value={approverName} onChange={e => setApproverName(e.target.value)} style={{ width: "100%", marginBottom: 12 }} />
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>หมายเหตุ</label>
            <textarea className="input" placeholder="(ถ้ามี)" value={approveNotes} onChange={e => setApproveNotes(e.target.value)} style={{ width: "100%", minHeight: 72, resize: "vertical", marginBottom: 20 }} />
            <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setApproveTarget(null)}>ยกเลิก</button>
              <button className="btn-primary" onClick={doApprove} disabled={!!approving}>
                {approving ? "กำลังบันทึก..." : "ยืนยันการอนุมัติ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DailyCheckIn, DailyCheckStatus });
