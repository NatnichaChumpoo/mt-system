/* ============================================================
   MT_System — Daily Machine Check-in Screens
   - DailyCheckIn  : mobile check form (operator)
   - DailyCheckStatus : desktop approval dashboard
   ============================================================ */

/* ─── constants ─────────────────────────────────────────────── */
const RESULT_LABELS = { P: "ปกติ", W: "บกพร่อง", F: "เสีย", V: "แก้ไขแล้ว" };
const RESULT_SYMBOLS = { P: "P", W: "△", F: "✗", V: "✓" };
const RESULT_COLORS = {
  P: { bg: "#f0fdf4", border: "#86efac", ink: "#166534" },
  W: { bg: "#fffbeb", border: "#fcd34d", ink: "#92400e" },
  F: { bg: "#fff1f2", border: "#fca5a5", ink: "#9f1239" },
  V: { bg: "#eff6ff", border: "#93c5fd", ink: "#1e40af" },
};

function fmtDateTH(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const thY = Number(y) + 543;
  const months = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${Number(d)} ${months[Number(m)]} ${thY}`;
}

/* ─── SignaturePad ─────────────────────────────────────────── */
function SignaturePad({ onSign, readOnly, existingData }) {
  const canvasRef = React.useRef(null);
  const drawing = React.useRef(false);
  const [hasSig, setHasSig] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (existingData) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
      img.src = existingData;
      setHasSig(true);
    }
  }, [existingData]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    if (readOnly) return;
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(e);
    canvasRef.current.getContext("2d").beginPath();
    canvasRef.current.getContext("2d").moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSig) setHasSig(true);
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onSign && onSign(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onSign && onSign(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={560}
        height={120}
        style={{
          display: "block", width: "100%",
          border: `1.5px solid ${readOnly ? "#e2e8f0" : "#93c5fd"}`,
          borderRadius: 8, background: readOnly ? "#f8fafc" : "#fafeff",
          touchAction: "none", cursor: readOnly ? "default" : "crosshair",
        }}
        onMouseDown={startDraw} onMouseMove={draw}
        onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>เซ็นชื่อด้วยนิ้วในกล่องด้านบน</span>
          {hasSig && (
            <button onClick={clear} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              ✕ ล้างลายเซ็น
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── ResultPicker ─────────────────────────────────────────── */
function ResultPicker({ value, onChange, readonly }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
      {["P", "W", "F", "V"].map((r) => {
        const c = RESULT_COLORS[r];
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => !readonly && onChange(r)}
            style={{
              padding: "6px 0", flex: 1, minWidth: 44,
              borderRadius: 7, border: `1.5px solid ${active ? c.border : "#d1d5db"}`,
              background: active ? c.bg : "#f9fafb",
              color: active ? c.ink : "#9ca3af",
              fontWeight: active ? 700 : 500, fontSize: 13,
              cursor: readonly ? "default" : "pointer",
              transition: "all .1s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{RESULT_SYMBOLS[r]}</span>
            <span style={{ fontSize: 9 }}>{RESULT_LABELS[r]}</span>
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
  const [results, setResults] = uS({});
  const [operator, setOperator] = uS(() => {
    try { return localStorage.getItem("mt_operator_name") || ""; } catch { return ""; }
  });
  const [sigData, setSigData] = uS(null);
  const [lineApprovals, setLineApprovals] = uS({});
  const [loading, setLoading] = uS(true);
  const [submitting, setSubmitting] = uS(false);
  const [done, setDone] = uS(null);
  const [err, setErr] = uS(null);

  uE(() => {
    if (!mc) { setErr("ไม่มีรหัสเครื่อง กรุณาสแกน QR ใหม่"); setLoading(false); return; }
    Promise.all([DATA.loadCheckTemplate(mc), DATA.loadCheckRecord(mc, today), DATA.loadCheckStatus(today)])
      .then(([tmpl, rec, statusData]) => {
        setTemplate(tmpl);
        const lg = tmpl.machine?.line_group;
        if (lg && statusData?.lines?.[lg]) setLineApprovals(statusData.lines[lg].approvals || {});
        if (rec.record && rec.record.status === "submitted") {
          const init = {};
          rec.results.forEach(r => { init[r.item_id] = { result: r.result, remarks: r.remarks || "" }; });
          setExisting(rec.record);
          setResults(init);
          setOperator(rec.record.operator_name || "");
          setSigData(rec.record.signature_data || null);
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
    if (!sigData) { ctx.toast("กรุณาเซ็นลายมือชื่อก่อนบันทึก", "error"); return; }
    setSubmitting(true);
    try {
      const payload = template.items.map(it => ({
        item_id: it.id,
        result: results[it.id].result,
        remarks: results[it.id].remarks || null,
      }));
      const res = await DATA.submitCheck(mc, today, operator.trim(), payload, sigData);
      setDone(res);
    } catch (e) {
      ctx.toast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="muted" style={{ padding: 32, textAlign: "center" }}>กำลังโหลด...</div>;
  if (err) return <div style={{ padding: 32, textAlign: "center", color: "#dc2626" }}>{err}</div>;

  /* Done screen */
  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{done.had_problem ? "⚠️" : "✅"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {done.had_problem ? "พบปัญหา — แจ้งซ่อมแล้ว" : "เช็คเสร็จสิ้น — ปกติทุกรายการ"}
        </div>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
          {mc} · {fmtDateTH(today)}
          {done.had_problem && <><br /><span style={{ color: "#dc2626" }}>ส่งใบแจ้งซ่อมอัตโนมัติแล้ว</span></>}
        </div>
        <button className="btn-primary" onClick={() => { setDone(null); setExisting({ status: "submitted", operator_name: operator }); }}>
          ดูผลที่บันทึก
        </button>
      </div>
    );
  }

  const machine = template.machine;
  const isReadOnly = existing?.status === "submitted";
  const safetyLines = (machine.safety_precautions || "").split("\n").filter(Boolean);
  const postUseLines = (machine.post_use_note || "").split("\n").filter(Boolean);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 0 100px", fontFamily: "inherit" }}>

      {/* ═══ FORM HEADER ═══════════════════════════════════════ */}
      <div style={{
        background: "#1e3a5f", color: "#fff",
        padding: "16px 18px 14px", borderRadius: "0 0 12px 12px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: ".08em", opacity: .65, marginBottom: 2 }}>CHIANG RAI AUTOMOTIVE RUBBER CO.,LTD.</div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>ใบตรวจเช็คสภาพเครื่องจักรประจำวัน</div>
            <div style={{ fontSize: 11, opacity: .75, marginTop: 1 }}>Machine Daily Check Sheet</div>
          </div>
          <div style={{ textAlign: "right", flex: "none" }}>
            <div style={{ fontSize: 10, opacity: .6 }}>วันที่</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtDateTH(today)}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", fontSize: 13 }}>
          <span style={{ opacity: .65 }}>รหัสเครื่อง</span>
          <span style={{ fontWeight: 700, letterSpacing: ".04em" }}>{machine.code}</span>
          <span style={{ opacity: .65 }}>ชื่อเครื่องจักร</span>
          <span style={{ fontWeight: 600 }}>{machine.name}</span>
          <span style={{ opacity: .65 }}>Line / ประเภท</span>
          <span style={{ opacity: .85 }}>Line {machine.line_group} · {machine.template_type_name}</span>
        </div>
      </div>

      {/* ═══ MACHINE PHOTO ══════════════════════════════════════ */}
      {machine.photo_path && (
        <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <img
            src={(window.API_BASE || "") + machine.photo_path}
            alt={machine.name}
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      {/* ═══ SAFETY PRECAUTIONS ════════════════════════════════ */}
      {safetyLines.length > 0 && (
        <div style={{
          background: "#fefce8", border: "1px solid #fde047",
          borderRadius: 10, padding: "12px 14px", marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#854d0e", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
            ⚠ ข้อควรระวังในการปฏิบัติงาน
          </div>
          {safetyLines.map((ln, i) => (
            <div key={i} style={{ fontSize: 12, color: "#713f12", lineHeight: 1.6 }}>{ln}</div>
          ))}
        </div>
      )}

      {/* ═══ POST-USE NOTES ════════════════════════════════════ */}
      {postUseLines.length > 0 && (
        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: 10, padding: "12px 14px", marginBottom: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
            📋 ข้อควรปฏิบัติหลังเลิกใช้เครื่องจักร
          </div>
          {postUseLines.map((ln, i) => (
            <div key={i} style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.6 }}>{ln}</div>
          ))}
        </div>
      )}

      {/* ═══ LEGEND ════════════════════════════════════════════ */}
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "10px 14px", marginBottom: 12,
        display: "flex", flexWrap: "wrap", gap: "6px 16px", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>สัญลักษณ์การบันทึกผล:</span>
        {[
          { sym: "P", label: "ปกติ", col: "#166534", bg: "#f0fdf4" },
          { sym: "△", label: "บกพร่อง", col: "#92400e", bg: "#fffbeb" },
          { sym: "✗", label: "เสีย/ชำรุด", col: "#9f1239", bg: "#fff1f2" },
          { sym: "✓", label: "แก้ไขแล้ว", col: "#1e40af", bg: "#eff6ff" },
        ].map(({ sym, label, col, bg }) => (
          <span key={sym} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <span style={{ background: bg, color: col, borderRadius: 5, padding: "2px 6px", fontWeight: 700, border: `1px solid ${col}33` }}>{sym}</span>
            <span style={{ color: "#4b5563" }}>{label}</span>
          </span>
        ))}
      </div>

      {/* ═══ ALREADY SUBMITTED banner ══════════════════════════ */}
      {isReadOnly && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #86efac",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
          fontSize: 13, color: "#166534",
        }}>
          ✅ บันทึกผลการตรวจแล้ว โดย <b>{existing.operator_name}</b>
          {existing.submitted_at && <span style={{ color: "#4b5563" }}> · {existing.submitted_at.slice(0, 16)}</span>}
        </div>
      )}

      {/* ═══ OPERATOR INPUT ════════════════════════════════════ */}
      {!isReadOnly && (
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: "12px 14px", marginBottom: 12,
        }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "#374151" }}>
            ผู้ตรวจ <span style={{ color: "#dc2626" }}>*</span>
            {operator && <span style={{ fontSize: 10, fontWeight: 500, color: "#16a34a", marginLeft: 6 }}>✓ เติมจากผู้ที่ล็อกอิน</span>}
          </label>
          <input
            className="input"
            placeholder="กรอกชื่อ-นามสกุลผู้ตรวจ"
            value={operator}
            onChange={e => setOperator(e.target.value)}
            style={{ width: "100%", fontSize: 14 }}
          />
        </div>
      )}

      {/* ═══ CHECK ITEMS ════════════════════════════════════════ */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, paddingLeft: 2, letterSpacing: ".06em" }}>
        รายการตรวจสอบ ({template.items.length} รายการ)
      </div>

      {template.items.map((it, idx) => {
        const rv = results[it.id] || { result: "P", remarks: "" };
        const c = RESULT_COLORS[rv.result] || RESULT_COLORS.P;
        const needsRemark = !isReadOnly && (rv.result === "W" || rv.result === "F");

        return (
          <div key={it.id} style={{
            background: "#fff",
            border: `1px solid ${isReadOnly && rv.result !== "P" ? c.border : "#e2e8f0"}`,
            borderLeft: `4px solid ${c.border}`,
            borderRadius: 10, marginBottom: 8, overflow: "hidden",
          }}>
            {/* Item header row */}
            <div style={{ padding: "10px 14px 8px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{
                background: "#f1f5f9", color: "#475569",
                borderRadius: 6, padding: "2px 8px", fontSize: 11,
                fontWeight: 700, flex: "none", marginTop: 1,
              }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.35, marginBottom: 3 }}>
                  {it.item_desc}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                  {it.standard_criteria && (
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      <span style={{ color: "#9ca3af" }}>มาตรฐาน:</span> {it.standard_criteria}
                    </span>
                  )}
                  {it.method && (
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      <span style={{ color: "#9ca3af" }}>วิธีการ:</span> {it.method}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Result row */}
            <div style={{ padding: "0 14px 10px" }}>
              {isReadOnly ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    background: c.bg, border: `1px solid ${c.border}`, color: c.ink,
                    borderRadius: 6, padding: "4px 12px", fontWeight: 700, fontSize: 13,
                  }}>
                    {RESULT_SYMBOLS[rv.result]} {RESULT_LABELS[rv.result]}
                  </span>
                  {rv.remarks && (
                    <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>หมายเหตุ: {rv.remarks}</span>
                  )}
                </div>
              ) : (
                <>
                  <ResultPicker value={rv.result} onChange={v => setResult(it.id, v)} />
                  {needsRemark && (
                    <textarea
                      placeholder="บันทึกหมายเหตุ / ปัญหาที่พบ (จำเป็น)..."
                      value={rv.remarks}
                      onChange={e => setRemarks(it.id, e.target.value)}
                      style={{
                        width: "100%", marginTop: 8, padding: "8px 10px",
                        borderRadius: 8, border: "1px solid #fca5a5",
                        fontSize: 13, resize: "vertical", minHeight: 52,
                        fontFamily: "inherit", background: "#fff7f7",
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* ═══ SIGNATURE SECTION ══════════════════════════════════ */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 10, padding: "14px", marginTop: 16, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 10, letterSpacing: ".06em" }}>
          ลายมือชื่อผู้ตรวจ
        </div>
        <SignaturePad
          readOnly={isReadOnly}
          existingData={sigData}
          onSign={(data) => setSigData(data)}
        />
        {operator && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#374151", fontWeight: 600, textAlign: "center" }}>
            {operator}
          </div>
        )}
        <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 2 }}>
          ผู้ตรวจ (Operator)
        </div>

        {/* Approval signatures — แสดงเมื่อ read-only */}
        {isReadOnly && (
          <div style={{ marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 10, letterSpacing: ".06em" }}>
              ลายมือชื่อผู้อนุมัติ
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {["PD Supervisor", "MT Leader", "PD Manager"].map(role => {
                const ap = lineApprovals[role];
                return (
                  <div key={role} style={{ textAlign: "center" }}>
                    <div style={{
                      border: "1px solid #e2e8f0", borderRadius: 6, height: 60, marginBottom: 4,
                      background: ap ? "#f8fafc" : "#fafafa", overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {ap?.signature_data
                        ? <img src={ap.signature_data} alt="sig" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <span style={{ fontSize: 10, color: "#d1d5db" }}>—</span>
                      }
                    </div>
                    {ap && <div style={{ fontSize: 10, color: "#374151", fontWeight: 600 }}>{ap.approver_name}</div>}
                    <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>{role}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ SUBMIT BUTTON ══════════════════════════════════════ */}
      {!isReadOnly && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 16px",
          background: "rgba(255,255,255,.96)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid #e2e8f0",
          zIndex: 20,
        }}>
          <button
            className="btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: 16, borderRadius: 12 }}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก..." : "✓ ยืนยันผลการตรวจประจำวัน"}
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
  const [expandedLine, setExpandedLine] = uS(null);
  const [detailMc, setDetailMc] = uS(null);
  const [detailData, setDetailData] = uS(null);
  const [loadingDetail, setLoadingDetail] = uS(false);

  const load = async (d) => {
    setLoading(true);
    try { setData(await DATA.loadCheckStatus(d)); }
    catch (e) { ctx.toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  uE(() => { load(date); }, [date]);

  const openDetail = async (m) => {
    if (m.status !== "submitted" && m.status !== "approved") return;
    setDetailMc(m);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const [rec, tmpl] = await Promise.all([
        DATA.loadCheckRecord(m.code, date),
        DATA.loadCheckTemplate(m.code),
      ]);
      setDetailData({ rec, tmpl });
    } catch (e) { ctx.toast(e.message, "error"); }
    finally { setLoadingDetail(false); }
  };

  const LINE_COLORS = { A: "#3b82f6", B: "#10b981", C: "#f59e0b", D: "#8b5cf6", TFC: "#ef4444" };

  return (
    <div>
      {/* Top bar */}
      <div className="row between wrap" style={{ marginBottom: 24, gap: 12 }}>
        <div>
          <div className="h-lg">สถานะเช็คเครื่องประจำวัน</div>
          <div className="muted small" style={{ marginTop: 2 }}>ติดตามสถานะการตรวจเช็คประจำวัน</div>
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

                <div style={{ padding: "12px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8, marginBottom: 20 }}>
                    {info.machines.map(m => {
                      const checked = m.status === "submitted" || m.status === "approved";
                      return (
                      <div key={m.code} onClick={() => openDetail(m)} style={{
                        padding: "10px 12px", borderRadius: 8,
                        background: m.has_problem ? "#fff1f2" : checked ? "#f0fdf4" : "var(--surface-2)",
                        border: `1px solid ${m.has_problem ? "#fca5a5" : checked ? "#86efac" : "var(--border)"}`,
                        cursor: checked ? "pointer" : "default",
                        transition: "box-shadow .12s",
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.code}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                        <div style={{ fontSize: 11 }}>
                          {m.status === "pending" && <span style={{ color: "var(--ink-3)" }}>⏳ รอเช็ค</span>}
                          {checked && !m.has_problem && <span style={{ color: "#16a34a" }}>✓ ปกติ</span>}
                          {checked && m.has_problem && <span style={{ color: "#9f1239" }}>⚠ พบปัญหา</span>}
                        </div>
                        {m.operator_name && <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>โดย: {m.operator_name}</div>}
                        {checked && <div style={{ fontSize: 9, color: "#93c5fd", marginTop: 3 }}>กดดูรายละเอียด →</div>}
                      </div>
                    );})}
                  </div>

                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── Check detail modal ─────────────────────────────────── */}
      {detailMc && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div className="card" style={{ width:"100%", maxWidth:600, maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"var(--sh-3)" }}>

            {/* Header */}
            <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid var(--border)", flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div className="h-md">{detailMc.code} — {detailMc.name}</div>
                <div className="muted small">วันที่ {date} · ผู้ตรวจ: {detailMc.operator_name || "—"}</div>
              </div>
              <button className="btn-ghost" onClick={() => { setDetailMc(null); setDetailData(null); }} style={{ fontSize:18, padding:"2px 10px" }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ overflowY:"auto", flex:1, padding:"12px 0" }}>
              {loadingDetail && <div className="muted" style={{ textAlign:"center", padding:32 }}>กำลังโหลด...</div>}
              {!loadingDetail && detailData && (() => {
                const results = detailData.rec.results || [];
                const resMap = Object.fromEntries(results.map(r => [r.item_id, r]));
                const items  = detailData.tmpl.items || [];
                return (
                  <>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead>
                        <tr style={{ background:"var(--surface-2)" }}>
                          <th style={{ padding:"9px 16px", textAlign:"left", fontWeight:600, width:40 }}>#</th>
                          <th style={{ padding:"9px 16px", textAlign:"left", fontWeight:600 }}>รายการ</th>
                          <th style={{ padding:"9px 16px", textAlign:"center", fontWeight:600, width:80 }}>ผล</th>
                          <th style={{ padding:"9px 16px", textAlign:"left", fontWeight:600 }}>หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(it => {
                          const r = resMap[it.id];
                          const c = r ? RESULT_COLORS[r.result] : null;
                          return (
                            <tr key={it.id} style={{ borderTop:"1px solid var(--border)", background: r?.result === "W" || r?.result === "F" ? (RESULT_COLORS[r.result]?.bg || "#fff") : "transparent" }}>
                              <td style={{ padding:"9px 16px", color:"var(--ink-3)", fontSize:11 }}>{it.seq_label || it.id}</td>
                              <td style={{ padding:"9px 16px" }}>{it.item_desc}</td>
                              <td style={{ padding:"9px 16px", textAlign:"center", whiteSpace:"nowrap" }}>
                                {r ? (
                                  <span style={{ padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:700, whiteSpace:"nowrap", background: c?.bg, color: c?.ink, border:`1px solid ${c?.border}` }}>
                                    {RESULT_SYMBOLS[r.result]} {RESULT_LABELS[r.result]}
                                  </span>
                                ) : <span style={{ color:"var(--ink-3)" }}>—</span>}
                              </td>
                              <td style={{ padding:"9px 16px", fontSize:12, color:"var(--ink-3)" }}>{r?.remarks || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Signature */}
                    {detailData.rec.record?.signature_data && (
                      <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", marginTop:4 }}>
                        <div style={{ fontSize:11, color:"var(--ink-3)", marginBottom:6 }}>ลายมือชื่อผู้ตรวจ</div>
                        <img src={detailData.rec.record.signature_data} alt="signature"
                          style={{ height:72, objectFit:"contain", border:"1px solid var(--border)", borderRadius:8, background:"#fafafa" }} />
                        <div style={{ fontSize:12, fontWeight:600, marginTop:4 }}>{detailMc.operator_name}</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 3: DailyCheckEdit  (desktop — MT role)
   แก้ไขรายการตรวจ + อัปโหลดรูปเครื่อง  — แบ่งตาม Line
══════════════════════════════════════════════════════════════ */
const LINE_ORDER = ["A", "B", "C", "D", "TFC"];
const LINE_COLORS_EDIT = { A: "#3b82f6", B: "#10b981", C: "#f59e0b", D: "#8b5cf6", TFC: "#ef4444" };
const LINE_LABEL = { A: "Line A", B: "Line B", C: "Line C", D: "Line D", TFC: "TFCMC" };

/* Sub-component: check items editor for one template type */
function TemplateTypeEditor({ type, ctx, onRefresh }) {
  const { useState: uS, useEffect: uE } = React;
  const [items, setItems] = uS(null);
  const [open, setOpen] = uS(false);
  const [safety, setSafety] = uS(type.safety_precautions || "");
  const [postUse, setPostUse] = uS(type.post_use_note || "");
  const [editItem, setEditItem] = uS(null);
  const [saving, setSaving] = uS(false);

  const loadItems = async () => {
    try {
      setItems(await DATA.loadCheckTemplateItems(type.id));
    } catch (e) { ctx.toast(e.message, "error"); }
  };

  uE(() => { if (open && items === null) loadItems(); }, [open]);

  const saveSafety = async () => {
    setSaving(true);
    try {
      await DATA.saveTemplateType(type.id, safety, postUse);
      ctx.toast("บันทึกข้อความแล้ว", "success");
      onRefresh();
    } catch (e) { ctx.toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const saveItem = async () => {
    if (!editItem?.item_desc?.trim()) { ctx.toast("กรุณากรอกรายการตรวจ", "error"); return; }
    setSaving(true);
    try {
      if (editItem.id) await DATA.updateTemplateItem(editItem.id, editItem);
      else await DATA.addTemplateItem(type.id, editItem);
      ctx.toast(editItem.id ? "แก้ไขรายการแล้ว" : "เพิ่มรายการแล้ว", "success");
      setEditItem(null);
      await loadItems();
    } catch (e) { ctx.toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deleteItem = async (it) => {
    if (!window.confirm(`ลบรายการ "${it.item_desc}" ?`)) return;
    try {
      await DATA.deleteTemplateItem(it.id);
      ctx.toast("ลบรายการแล้ว", "success");
      await loadItems();
    } catch (e) { ctx.toast(e.message, "error"); }
  };

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: open ? "#f0f9ff" : "#f8fafc",
          border: 0, cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: open ? "#0369a1" : "#1e293b" }}>{type.name}</span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {type.machines.length} เครื่อง · {items !== null ? items.length : "?"} รายการตรวจ
          </span>
        </div>
        <span style={{ fontSize: 16, color: "#64748b" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "16px" }}>
          {/* Safety text */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#854d0e", marginBottom: 6 }}>⚠ ข้อควรระวัง</div>
              <textarea value={safety} onChange={e => setSafety(e.target.value)}
                style={{ width: "100%", minHeight: 80, padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical", fontFamily: "inherit" }}
                placeholder="แต่ละข้อขึ้นบรรทัดใหม่" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 6 }}>📋 ข้อปฏิบัติหลังเลิกใช้</div>
              <textarea value={postUse} onChange={e => setPostUse(e.target.value)}
                style={{ width: "100%", minHeight: 80, padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical", fontFamily: "inherit" }}
                placeholder="แต่ละข้อขึ้นบรรทัดใหม่" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: "7px 16px" }} onClick={saveSafety} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกข้อความ"}
            </button>
          </div>

          {/* Items */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>รายการตรวจสอบ</div>
              <button className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}
                onClick={() => setEditItem({ seq_label: "", item_desc: "", standard_criteria: "", method: "", sort_order: "" })}>
                + เพิ่มรายการ
              </button>
            </div>

            {/* Edit form */}
            {editItem && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "14px", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#0369a1" }}>
                  {editItem.id ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 80px", gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>ลำดับ</label>
                    <input className="input" value={editItem.seq_label || ""} onChange={e => setEditItem(p => ({ ...p, seq_label: e.target.value }))} placeholder="1a" style={{ width: "100%", fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>รายการตรวจ *</label>
                    <input className="input" value={editItem.item_desc || ""} onChange={e => setEditItem(p => ({ ...p, item_desc: e.target.value }))} placeholder="รายการตรวจ" style={{ width: "100%", fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>มาตรฐาน</label>
                    <input className="input" value={editItem.standard_criteria || ""} onChange={e => setEditItem(p => ({ ...p, standard_criteria: e.target.value }))} placeholder="เกณฑ์" style={{ width: "100%", fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>Order</label>
                    <input className="input" type="number" value={editItem.sort_order || ""} onChange={e => setEditItem(p => ({ ...p, sort_order: Number(e.target.value) }))} style={{ width: "100%", fontSize: 13 }} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 3 }}>วิธีการตรวจ</label>
                  <input className="input" value={editItem.method || ""} onChange={e => setEditItem(p => ({ ...p, method: e.target.value }))} placeholder="วิธีการ/เครื่องมือ" style={{ width: "100%", fontSize: 13 }} />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditItem(null)}>ยกเลิก</button>
                  <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveItem} disabled={saving}>
                    {saving ? "..." : (editItem.id ? "บันทึก" : "เพิ่ม")}
                  </button>
                </div>
              </div>
            )}

            {items === null ? (
              <div className="muted" style={{ fontSize: 13, padding: "10px 0" }}>กำลังโหลด...</div>
            ) : items.length === 0 ? (
              <div className="muted" style={{ fontSize: 13, padding: "10px 0" }}>ยังไม่มีรายการตรวจ</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["ลำดับ", "รายการตรวจ", "มาตรฐาน", "วิธีการ", ""].map(h => (
                        <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "7px 10px", color: "#6b7280", fontWeight: 600 }}>{it.seq_label || "-"}</td>
                        <td style={{ padding: "7px 10px", maxWidth: 260 }}>{it.item_desc}</td>
                        <td style={{ padding: "7px 10px", color: "#6b7280", maxWidth: 160, fontSize: 12 }}>{it.standard_criteria || "-"}</td>
                        <td style={{ padding: "7px 10px", color: "#6b7280", fontSize: 12 }}>{it.method || "-"}</td>
                        <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 8px", marginRight: 4 }} onClick={() => { setEditItem({ ...it }); }}>แก้ไข</button>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: "3px 8px", color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => deleteItem(it)}>ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Machine photo card */
function MachinePhotoCard({ m, onPhotoChange, uploading }) {
  const API_BASE = window.API_BASE || "";
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ height: 120, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {m.photo_path ? (
          <img src={API_BASE + m.photo_path + "?t=" + Date.now()} alt={m.code}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: 28, marginBottom: 2 }}>📷</div>
            <div style={{ fontSize: 10 }}>ยังไม่มีรูป</div>
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
            กำลังอัปโหลด...
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.code}</div>
        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
        <div style={{ display: "flex", gap: 5 }}>
          <label style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 6, border: "1px solid #3b82f6", color: "#1d4ed8", fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#eff6ff" }}>
            {m.photo_path ? "เปลี่ยน" : "+ รูป"}
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) onPhotoChange(m.code, e.target.files[0], false); e.target.value = ""; }} />
          </label>
          {m.photo_path && (
            <button onClick={() => onPhotoChange(m.code, null, true)}
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #fca5a5", color: "#dc2626", background: "#fff1f2", fontSize: 11, cursor: "pointer" }}>
              ลบ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyCheckEdit({ ctx }) {
  const { useState: uS, useEffect: uE } = React;
  const [types, setTypes] = uS([]);
  const [loading, setLoading] = uS(true);
  const [selLine, setSelLine] = uS("A");
  const [uploadingFor, setUploadingFor] = uS(null);

  const loadTypes = async () => {
    try { setTypes(await DATA.loadCheckTemplateTypes()); }
    catch (e) { ctx.toast(e.message, "error"); }
    finally { setLoading(false); }
  };
  uE(() => { loadTypes(); }, []);

  /* Build lineMap: { "A": { machines: [...], types: [...] } } */
  const lineMap = {};
  for (const t of types) {
    for (const m of t.machines) {
      const lg = m.line_group || "?";
      if (!lineMap[lg]) lineMap[lg] = { machines: [], types: [] };
      lineMap[lg].machines.push(m);
      if (!lineMap[lg].types.find(x => x.id === t.id)) lineMap[lg].types.push(t);
    }
  }
  const availLines = LINE_ORDER.filter(l => lineMap[l]);

  const handlePhotoChange = async (code, file, isDelete) => {
    if (isDelete) {
      if (!window.confirm(`ลบรูปเครื่อง ${code} ?`)) return;
      try { await DATA.deleteMachinePhoto(code); ctx.toast("ลบรูปแล้ว", "success"); await loadTypes(); }
      catch (e) { ctx.toast(e.message, "error"); }
      return;
    }
    setUploadingFor(code);
    try { await DATA.uploadMachinePhoto(code, file); ctx.toast(`อัปโหลดรูป ${code} แล้ว`, "success"); await loadTypes(); }
    catch (e) { ctx.toast(e.message, "error"); }
    finally { setUploadingFor(null); }
  };

  if (loading) return <div className="muted" style={{ padding: 40, textAlign: "center" }}>กำลังโหลด...</div>;

  const lineInfo = lineMap[selLine];
  const lineColor = LINE_COLORS_EDIT[selLine] || "#64748b";

  return (
    <div style={{ display: "flex", gap: 0, minHeight: 0 }}>

      {/* ── Left: Line selector ───────────────────────── */}
      <div style={{ width: 180, flex: "none", borderRight: "1px solid #e2e8f0", paddingRight: 14, marginRight: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: ".06em", marginBottom: 10 }}>
          แบ่งตาม Line
        </div>
        {availLines.map(lg => {
          const info = lineMap[lg];
          const col = LINE_COLORS_EDIT[lg] || "#64748b";
          const active = selLine === lg;
          return (
            <button key={lg} onClick={() => { setSelLine(lg); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                padding: "11px 12px", marginBottom: 4, borderRadius: 9,
                border: active ? `1.5px solid ${col}` : "1px solid #e2e8f0",
                background: active ? col + "15" : "#fff",
                cursor: "pointer",
              }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: col, flex: "none" }}></span>
              <div>
                <div style={{ fontWeight: active ? 700 : 600, fontSize: 14, color: active ? col : "#1e293b" }}>
                  {LINE_LABEL[lg]}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                  {info.machines.length} เครื่อง · {info.types.length} ประเภท
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Right: content ───────────────────────────── */}
      {lineInfo && (
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Line header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, background: lineColor, flex: "none" }}></span>
            <div>
              <div className="h-md">{LINE_LABEL[selLine]}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {lineInfo.machines.length} เครื่อง · {lineInfo.types.map(t => t.name).join(", ")}
              </div>
            </div>
          </div>

          {/* ── Machine photos ── */}
          <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
              รูปเครื่องจักร
              <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 12, color: "#6b7280" }}>
                ({lineInfo.machines.filter(m => m.photo_path).length}/{lineInfo.machines.length} มีรูป)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
              {[...lineInfo.machines].sort((a, b) => a.code.localeCompare(b.code)).map(m => (
                <MachinePhotoCard key={m.code} m={m} uploading={uploadingFor === m.code} onPhotoChange={handlePhotoChange} />
              ))}
            </div>
          </div>

          {/* ── Template type sections ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: ".06em", marginBottom: 10 }}>
            แม่แบบรายการตรวจสอบ ({lineInfo.types.length} ประเภท)
          </div>
          {lineInfo.types.map(t => (
            <TemplateTypeEditor key={t.id} type={t} ctx={ctx} onRefresh={loadTypes} />
          ))}

        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCREEN 4: DailyCheckMonthly (desktop)
   รายงานเช็คเครื่องประจำเดือน — grid 30 วัน + ลายเซ็นรายเดือน
══════════════════════════════════════════════════════════════ */
const TH_MONTHS = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const MONTH_LINE_COLORS = { A:"#3b82f6", B:"#10b981", C:"#f59e0b", D:"#8b5cf6", TFC:"#ef4444" };
const MONTH_LINE_LABEL  = { A:"Line A", B:"Line B", C:"Line C", D:"Line D", TFC:"TFCMC" };
const MONTH_LINE_ORDER  = ["A","B","C","D","TFC"];
const MONTH_ROLES       = ["PD Supervisor","MT Leader","PD Manager"];

function DailyCheckMonthly({ ctx }) {
  const { useState: uS, useEffect: uE } = React;
  const now = new Date();
  const [year, setYear]           = uS(now.getFullYear());
  const [month, setMonth]         = uS(now.getMonth() + 1);
  const [data, setData]           = uS(null);
  const [loading, setLoading]     = uS(true);
  const [activeLine, setActiveLine] = uS(null);
  const [detailMc, setDetailMc]   = uS(null);
  const [approveModal, setApproveModal] = uS(null);
  const [approveName, setApproveName]   = uS("");
  const [approveSig, setApproveSig]     = uS(null);
  const [approving, setApproving]       = uS(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await DATA.loadCheckMonthly(year, month);
      setData(d);
      if (!activeLine || !d.lines[activeLine]) {
        const first = MONTH_LINE_ORDER.find(l => d.lines[l]);
        setActiveLine(first || null);
      }
    } catch (e) { ctx.toast(e.message, "error"); }
    finally { setLoading(false); }
  };
  uE(() => { load(); }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dayKey = (d) => `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const doApprove = async () => {
    if (!approveName.trim()) { ctx.toast("กรุณากรอกชื่อ","error"); return; }
    if (!approveSig)         { ctx.toast("กรุณาเซ็นลายมือชื่อ","error"); return; }
    setApproving(true);
    try {
      await DATA.approveCheckMonthly(year, month, approveModal.line, approveModal.role, approveName.trim(), approveSig);
      ctx.toast("บันทึกแล้ว","success");
      setApproveModal(null); setApproveName(""); setApproveSig(null);
      await load();
    } catch (e) { ctx.toast(e.message,"error"); }
    finally { setApproving(false); }
  };

  const lineKeys = MONTH_LINE_ORDER.filter(l => data?.lines?.[l]);
  const lineData  = data?.lines?.[activeLine] || [];
  const lineApprovals = data?.approvals?.[activeLine] || {};
  const lineCol   = MONTH_LINE_COLORS[activeLine] || "#64748b";

  return (
    <div>
      {/* Header */}
      <div className="row between wrap" style={{ marginBottom: 24, gap: 12 }}>
        <div>
          <div className="h-lg">รายงานเช็คเครื่องประจำเดือน</div>
          <div className="muted small">ภาพรวมการตรวจสอบรายเดือน แยกตาม Line</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding:"8px 12px" }}>
            {TH_MONTHS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding:"8px 12px" }}>
            {[now.getFullYear()-1, now.getFullYear(), now.getFullYear()+1].map(y =>
              <option key={y} value={y}>{y+543}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="muted" style={{ textAlign:"center", padding:40 }}>กำลังโหลด...</div>}

      {!loading && data && (
        <>
          {/* Line tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {lineKeys.map(l => {
              const lc = MONTH_LINE_COLORS[l];
              const mcs = data.lines[l] || [];
              const total = mcs.length * daysInMonth;
              const checked = mcs.reduce((s,mc) => s + Object.keys(mc.records||{}).length, 0);
              const pct = total > 0 ? Math.round(100*checked/total) : 0;
              return (
                <button key={l} onClick={() => setActiveLine(l)} style={{
                  padding:"8px 18px", borderRadius:99, cursor:"pointer",
                  border:`2px solid ${activeLine===l ? lc : "var(--border)"}`,
                  background: activeLine===l ? lc+"18" : "transparent",
                  color: activeLine===l ? lc : "var(--ink-2)",
                  fontWeight: activeLine===l ? 700 : 500, fontSize:13,
                }}>
                  {MONTH_LINE_LABEL[l]||l} · {pct}%
                </button>
              );
            })}
          </div>

          {activeLine && (
            <>
              {/* Machine cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:28 }}>
                {lineData.map(mc => {
                  const checkedDays = Object.keys(mc.records||{}).length;
                  const problemDays = Object.values(mc.records||{}).filter(r => r.problem_count > 0).length;
                  return (
                    <div key={mc.code} onClick={() => setDetailMc(mc)} style={{
                      padding:"12px 14px", borderRadius:10, cursor:"pointer",
                      border:`1px solid ${checkedDays===daysInMonth ? "#86efac" : "var(--border)"}`,
                      background: checkedDays===daysInMonth ? "#f0fdf4" : "var(--surface)",
                      transition:"box-shadow .12s",
                    }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{mc.code}</div>
                      <div style={{ fontSize:11, color:"var(--ink-3)", marginBottom:8, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{mc.name}</div>
                      {/* Day dots */}
                      <div style={{ display:"flex", flexWrap:"wrap", gap:2, marginBottom:6 }}>
                        {days.map(d => {
                          const rec = mc.records?.[dayKey(d)];
                          const col = rec ? (rec.problem_count > 0 ? "#fca5a5" : "#86efac") : "#e5e7eb";
                          return <div key={d} title={`วันที่ ${d}`} style={{ width:7, height:7, borderRadius:2, background:col, flex:"none" }}/>;
                        })}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, color: checkedDays===daysInMonth ? "#16a34a" : "var(--ink-3)" }}>
                          {checkedDays}/{daysInMonth} วัน
                        </span>
                        {problemDays > 0 && <span style={{ fontSize:10, color:"#9f1239", fontWeight:600 }}>⚠ {problemDays}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly signature section */}
              <div className="card" style={{ padding:"20px 24px", border:`1.5px solid ${lineCol}33` }}>
                <div className="eyebrow" style={{ marginBottom:14 }}>
                  ลายมือชื่อรับรองประจำเดือน {TH_MONTHS[month]} {year+543} — {MONTH_LINE_LABEL[activeLine]||activeLine}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  {MONTH_ROLES.map(role => {
                    const ap = lineApprovals[role];
                    return (
                      <div key={role} style={{
                        padding:"14px", borderRadius:10, textAlign:"center",
                        border:`1px solid ${ap ? "#86efac" : "var(--border)"}`,
                        background: ap ? "#f0fdf4" : "var(--surface-2)",
                      }}>
                        <div style={{ fontSize:12, fontWeight:600, color: ap ? "#166534" : "var(--ink-2)", marginBottom:8 }}>{role}</div>
                        {ap ? (
                          <>
                            {ap.signature_data && (
                              <img src={ap.signature_data} alt="sig" style={{ width:"100%", height:64, objectFit:"contain", background:"#fff", borderRadius:6, border:"1px solid #d1fae5", marginBottom:6 }}/>
                            )}
                            <div style={{ fontSize:13, fontWeight:700 }}>✓ {ap.approver_name}</div>
                            <div style={{ fontSize:10, color:"var(--ink-3)" }}>{ap.approved_at?.slice(0,16)}</div>
                          </>
                        ) : (
                          <button className="btn-ghost" style={{ fontSize:12, padding:"6px 14px", width:"100%" }}
                            onClick={() => { setApproveSig(null); setApproveModal({ role, line:activeLine }); }}>
                            + ลงชื่อรับรอง
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Machine detail modal */}
      {detailMc && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div className="card" style={{ width:"100%", maxWidth:580, maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"var(--sh-3)" }}>
            <div style={{ padding:"20px 24px 14px", borderBottom:"1px solid var(--border)", flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div className="h-md">{detailMc.code} — {detailMc.name}</div>
                <div className="muted small">{TH_MONTHS[month]} {year+543} · {Object.keys(detailMc.records||{}).length}/{daysInMonth} วันที่เช็คแล้ว</div>
              </div>
              <button className="btn-ghost" onClick={() => setDetailMc(null)} style={{ fontSize:18, padding:"2px 10px" }}>✕</button>
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"var(--surface-2)", position:"sticky", top:0 }}>
                    <th style={{ padding:"10px 16px", textAlign:"left", fontWeight:600 }}>วันที่</th>
                    <th style={{ padding:"10px 16px", textAlign:"left", fontWeight:600 }}>ผู้ตรวจ</th>
                    <th style={{ padding:"10px 16px", textAlign:"center", fontWeight:600 }}>สถานะ</th>
                    <th style={{ padding:"10px 16px", textAlign:"center", fontWeight:600 }}>ปัญหา</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map(d => {
                    const rec = detailMc.records?.[dayKey(d)];
                    return (
                      <tr key={d} style={{ borderTop:"1px solid var(--border)", background: rec?.problem_count>0 ? "#fff1f2" : "transparent" }}>
                        <td style={{ padding:"9px 16px" }}>{d} {TH_MONTHS[month]}</td>
                        <td style={{ padding:"9px 16px", color: rec ? "var(--ink)" : "var(--ink-3)" }}>{rec?.operator_name||"—"}</td>
                        <td style={{ padding:"9px 16px", textAlign:"center" }}>
                          {rec
                            ? <span style={{ color: rec.problem_count>0 ? "#9f1239" : "#16a34a", fontWeight:600 }}>
                                {rec.problem_count>0 ? "⚠ มีปัญหา" : "✓ ปกติ"}
                              </span>
                            : <span style={{ color:"var(--ink-3)" }}>ยังไม่เช็ค</span>}
                        </td>
                        <td style={{ padding:"9px 16px", textAlign:"center", color: rec?.problem_count>0 ? "#dc2626" : "var(--ink-3)" }}>
                          {rec ? (rec.problem_count>0 ? rec.problem_count+" รายการ" : "—") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly approve modal */}
      {approveModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div className="card" style={{ width:"100%", maxWidth:440, padding:"28px 28px 24px", boxShadow:"var(--sh-3)" }}>
            <div className="h-md" style={{ marginBottom:4 }}>ลงชื่อรับรอง</div>
            <div className="muted small" style={{ marginBottom:20 }}>
              {MONTH_LINE_LABEL[approveModal.line]||approveModal.line} · {approveModal.role} · {TH_MONTHS[month]} {year+543}
            </div>
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>ชื่อ-นามสกุล *</label>
            <input className="input" placeholder="ชื่อ-นามสกุล" value={approveName} onChange={e => setApproveName(e.target.value)} style={{ width:"100%", marginBottom:12 }} />
            <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>ลายมือชื่อ *</label>
            <SignaturePad onSign={setApproveSig} readOnly={false} existingData={null} />
            <div className="row gap-sm" style={{ justifyContent:"flex-end", marginTop:20 }}>
              <button className="btn-ghost" onClick={() => { setApproveModal(null); setApproveSig(null); }}>ยกเลิก</button>
              <button className="btn-primary" onClick={doApprove} disabled={approving}>
                {approving ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DailyCheckIn, DailyCheckStatus, DailyCheckEdit, DailyCheckMonthly });
