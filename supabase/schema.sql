-- =====================================================================
--  Complete Auto Rubber - Maintenance & Spare Part System
--  Database Schema for Supabase (PostgreSQL)
--  Target: Next.js + TypeScript web app
--  Notification stack: Telegram (real-time) + Email (escalation)
--  Version: R01  |  Currency: THB
-- =====================================================================
--  NOTE: ข้อมูลในตารางตัวอย่างเป็นข้อมูลสมมุติสำหรับทดสอบ
--        ตั้ง search_path ให้ใช้ schema public (ค่าเริ่มต้นของ Supabase)
-- =====================================================================

-- ---------- Extensions ----------
-- gen_random_uuid() เป็น core function ตั้งแต่ PostgreSQL 13+ (Supabase รองรับอยู่แล้ว)
-- ถ้า PG เวอร์ชันเก่ากว่า ให้เปิด: create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) ENUM TYPES
-- =====================================================================
create type machine_rank        as enum ('A','B','C');
create type criticality_level   as enum ('HIGH','MEDIUM','LOW');
create type machine_status       as enum ('Running','Stop','Maintenance','Retired');
create type request_priority     as enum ('Critical','High','Medium','Low');
create type request_status       as enum ('New','Waiting','In Progress','Completed','Cancelled');
create type verify_status        as enum ('Pending','Approved','Rejected');
create type pm_frequency         as enum ('Daily','Weekly','Monthly','Quarterly','Yearly');
create type movement_type        as enum ('IN','OUT','ADJUST');
create type user_role            as enum ('operator','technician','supervisor','manager','planner','store','purchasing','admin');
create type notify_channel       as enum ('telegram','email');
create type notify_status        as enum ('pending','sent','failed');

-- =====================================================================
-- 2) REFERENCE / LOOKUP TABLES
-- =====================================================================

-- กลุ่มเครื่องจักร (Compression, Injection, Forming, Vacuum, CNC, Utility ...)
-- หมายเหตุ: Forming และ Compression เป็นคนละกลุ่มกัน
create table mc_groups (
    id          smallserial primary key,
    code        text not null unique,
    name        text not null,
    description text,
    created_at  timestamptz not null default now()
);

create table departments (
    id    smallserial primary key,
    name  text not null unique
);

create table suppliers (
    id              serial primary key,
    name            text not null unique,
    contact         text,
    lead_time_days  int  check (lead_time_days >= 0),
    created_at      timestamptz not null default now()
);

-- หมวดอาการเสีย (Electrical, Mechanical, Hydraulic ...) ใช้ทำ Pareto
create table problem_categories (
    id   smallserial primary key,
    name text not null unique
);

-- ผู้ใช้งาน: ผูกกับ Supabase Auth (auth.users) ผ่าน id
-- telegram_chat_id ใช้ส่งแจ้งเตือนรายบุคคล
create table app_users (
    id                uuid primary key default gen_random_uuid(),
    auth_user_id      uuid unique,            -- references auth.users(id)
    full_name         text not null,
    role              user_role not null default 'operator',
    email             text unique,
    telegram_chat_id  text,                   -- chat id ส่วนตัวของผู้ใช้
    phone             text,
    is_active         boolean not null default true,
    created_at        timestamptz not null default now()
);

-- =====================================================================
-- 3) MACHINE DOMAIN
-- =====================================================================
create table machines (
    id            uuid primary key default gen_random_uuid(),
    code          text not null unique,                 -- MC-001
    name          text not null,
    mc_group_id   smallint references mc_groups(id),
    rank          machine_rank not null default 'C',    -- ผลกระทบของเครื่อง
    criticality   criticality_level not null default 'LOW',
    department_id smallint references departments(id),
    location      text,
    maker         text,
    model         text,
    install_date  date,
    qr_code_url   text,
    status        machine_status not null default 'Running',
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);
create index idx_machines_group on machines(mc_group_id);
create index idx_machines_status on machines(status);

-- =====================================================================
-- 4) SPARE PART DOMAIN
-- =====================================================================
create table spare_parts (
    id               uuid primary key default gen_random_uuid(),
    code             text not null unique,               -- PT-01 / SP-H012
    name             text not null,
    mc_group_id      smallint references mc_groups(id),
    min_stock        int not null default 0 check (min_stock >= 0),
    max_stock        int not null default 0 check (max_stock >= 0),
    safety_stock     int not null default 0 check (safety_stock >= 0),
    rop              int not null default 0 check (rop >= 0),  -- Reorder Point
    current_stock    int not null default 0,             -- maintained by trigger จาก ledger
    criticality_score smallint not null default 3 check (criticality_score in (3,6,9)),
    unit_cost        numeric(12,2) not null default 0,
    supplier_id      int references suppliers(id),
    location         text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
create index idx_parts_group on spare_parts(mc_group_id);

-- Ledger การเคลื่อนไหวสต็อก (IN/OUT/ADJUST) = source of truth ของยอดคงเหลือ
create table stock_movements (
    id          bigserial primary key,
    part_id     uuid not null references spare_parts(id),
    type        movement_type not null,
    qty         int not null check (qty > 0),
    unit_cost   numeric(12,2) not null default 0,
    ref_request_id uuid,                                  -- โยงใบแจ้งซ่อมถ้าเป็นการเบิกใช้
    note        text,
    moved_by    uuid references app_users(id),
    moved_at    timestamptz not null default now()
);
create index idx_moves_part on stock_movements(part_id);
create index idx_moves_time on stock_movements(moved_at);

-- =====================================================================
-- 5) MAINTENANCE REQUEST DOMAIN
-- =====================================================================
create table maintenance_requests (
    id              uuid primary key default gen_random_uuid(),
    request_no      text unique,                          -- REQ-2026-001 (gen by trigger)
    machine_id      uuid not null references machines(id),
    problem_description text not null,
    priority        request_priority not null default 'Medium',
    reporter_id     uuid references app_users(id),
    department_id   smallint references departments(id),
    status          request_status not null default 'New',
    breakdown_start timestamptz not null default now(),
    finish_repair   timestamptz,
    -- Downtime (ชั่วโมง) คำนวณอัตโนมัติ ไม่ต้องกรอกมือ
    downtime_hours  numeric(10,2) generated always as (
        case when finish_repair is not null
             then round(extract(epoch from (finish_repair - breakdown_start))/3600.0, 2)
             else null end
    ) stored,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index idx_req_machine on maintenance_requests(machine_id);
create index idx_req_status  on maintenance_requests(status);
create index idx_req_created on maintenance_requests(created_at);

-- บันทึกการซ่อม (1:1 กับใบแจ้งซ่อม)
create table repair_actions (
    id                  uuid primary key default gen_random_uuid(),
    request_id          uuid not null unique references maintenance_requests(id) on delete cascade,
    technician_id       uuid references app_users(id),
    problem_category_id smallint references problem_categories(id),
    root_cause          text,
    corrective_action   text,
    repair_hours        numeric(10,2) check (repair_hours >= 0),
    verification_status verify_status not null default 'Pending',
    verified_by         uuid references app_users(id),
    repaired_at         timestamptz
);

-- อะไหล่ที่ใช้ในแต่ละงานซ่อม (junction) -> trigger ตัดสต็อกอัตโนมัติ
create table spare_part_usage (
    id          uuid primary key default gen_random_uuid(),
    request_id  uuid not null references maintenance_requests(id) on delete cascade,
    part_id     uuid not null references spare_parts(id),
    qty_used    int not null check (qty_used > 0),
    unit_cost   numeric(12,2) not null default 0,         -- snapshot ณ เวลาที่ใช้
    total_cost  numeric(14,2) generated always as (qty_used * unit_cost) stored,
    created_at  timestamptz not null default now()
);
create index idx_usage_req  on spare_part_usage(request_id);
create index idx_usage_part on spare_part_usage(part_id);

-- =====================================================================
-- 6) PREVENTIVE MAINTENANCE (PM)
-- =====================================================================
create table pm_schedules (
    id           uuid primary key default gen_random_uuid(),
    machine_id   uuid not null references machines(id),
    checklist    text not null,
    frequency    pm_frequency not null,
    last_pm_date date,
    next_pm_date date,
    completed    boolean not null default false,
    created_at   timestamptz not null default now()
);
create index idx_pm_machine on pm_schedules(machine_id);
create index idx_pm_next on pm_schedules(next_pm_date);

-- =====================================================================
-- 7) NOTIFICATION OUTBOX (Telegram + Email)
--    pattern: trigger เขียน row 'pending' -> Edge Function / webhook ส่งจริง
-- =====================================================================
create table notification_log (
    id           bigserial primary key,
    channel      notify_channel not null,
    recipient    text not null,                 -- telegram chat_id หรือ email
    subject      text,
    message      text not null,
    status       notify_status not null default 'pending',
    related_request_id uuid references maintenance_requests(id),
    related_part_id    uuid references spare_parts(id),
    error        text,
    created_at   timestamptz not null default now(),
    sent_at      timestamptz
);
create index idx_notif_status on notification_log(status);

-- =====================================================================
-- 8) RISK MATRIX  (machine_rank x part criticality -> zone)
-- =====================================================================
create or replace function risk_zone(p_rank machine_rank, p_part_score integer)
returns text language sql immutable as $$
    select case
        when p_rank = 'A' then 'HIGH RISK'
        when p_rank = 'B' and p_part_score = 9 then 'MEDIUM RISK'
        when p_rank = 'B' then 'MEDIUM RISK'
        else 'LOW RISK'
    end;
$$;

-- =====================================================================
-- 9) TRIGGERS / FUNCTIONS
-- =====================================================================

-- 9.1 auto-generate request_no = REQ-<year>-<running 3 หลัก ต่อปี>
create or replace function gen_request_no()
returns trigger language plpgsql as $$
declare
    yr text := to_char(coalesce(new.breakdown_start, now()), 'YYYY');
    seq int;
begin
    if new.request_no is null then
        select count(*) + 1 into seq
        from maintenance_requests
        where request_no like 'REQ-' || yr || '-%';
        new.request_no := 'REQ-' || yr || '-' || lpad(seq::text, 3, '0');
    end if;
    return new;
end;
$$;
create trigger trg_request_no
    before insert on maintenance_requests
    for each row execute function gen_request_no();

-- 9.2 ตัดสต็อกอัตโนมัติเมื่อบันทึกการใช้อะไหล่ (atomic)
create or replace function apply_part_usage()
returns trigger language plpgsql as $$
begin
    insert into stock_movements(part_id, type, qty, unit_cost, ref_request_id, note)
    values (new.part_id, 'OUT', new.qty_used, new.unit_cost, new.request_id, 'Auto: spare_part_usage');
    return new;
end;
$$;
create trigger trg_apply_usage
    after insert on spare_part_usage
    for each row execute function apply_part_usage();

-- 9.3 อัปเดต current_stock ของอะไหล่จาก ledger (single source of truth)
create or replace function recalc_stock()
returns trigger language plpgsql as $$
declare pid uuid := coalesce(new.part_id, old.part_id);
begin
    update spare_parts sp
    set current_stock = coalesce((
            select sum(case when type='IN' then qty
                            when type='OUT' then -qty
                            else qty end)
            from stock_movements where part_id = pid), 0),
        updated_at = now()
    where sp.id = pid;
    return null;
end;
$$;
create trigger trg_recalc_stock
    after insert or update or delete on stock_movements
    for each row execute function recalc_stock();

-- 9.4 แจ้งเตือนเมื่อมีใบแจ้งซ่อมใหม่ -> เขียน outbox (Telegram ทีมช่าง + escalation)
create or replace function notify_new_request()
returns trigger language plpgsql as $$
declare
    m         machines%rowtype;
    grp_chat  text := current_setting('app.telegram_team_chat', true);  -- chat กลุ่มทีมช่าง
    msg       text;
begin
    select * into m from machines where id = new.machine_id;

    msg := '🚨 BREAKDOWN! ' || coalesce(new.request_no,'(new)') ||
           E'\nเครื่อง: ' || m.code || ' - ' || m.name ||
           E'\nอาการ: ' || new.problem_description ||
           E'\nความสำคัญ: ' || new.priority ||
           E'\nความเสี่ยง: ' || risk_zone(m.rank, 6);

    -- 1) แจ้งทีมช่างผ่าน Telegram กลุ่ม (real-time)
    insert into notification_log(channel, recipient, subject, message, related_request_id)
    values ('telegram', coalesce(grp_chat,'TEAM_CHAT'), 'New Breakdown', msg, new.id);

    -- 2) ถ้าเครื่อง Rank A หยุด -> escalate email ผู้บริหาร
    if m.rank = 'A' then
        insert into notification_log(channel, recipient, subject, message, related_request_id)
        select 'email', u.email, '🔥 CRITICAL STOP: ' || m.code, msg, new.id
        from app_users u where u.role in ('manager') and u.email is not null;
    end if;

    return new;
end;
$$;
create trigger trg_notify_request
    after insert on maintenance_requests
    for each row execute function notify_new_request();

-- 9.5 แจ้งเตือนเมื่อสต็อกต่ำกว่า ROP -> outbox ฝ่ายจัดซื้อ
create or replace function notify_low_stock()
returns trigger language plpgsql as $$
begin
    if new.current_stock < new.rop and (old.current_stock is distinct from new.current_stock) then
        insert into notification_log(channel, recipient, subject, message, related_part_id)
        select 'email', u.email, '📦 STOCK ALERT: ' || new.code,
               'อะไหล่ ' || new.code || ' (' || new.name || ') เหลือ ' ||
               new.current_stock || ' ต่ำกว่า ROP (' || new.rop || ') กรุณาสั่งซื้อ',
               new.id
        from app_users u where u.role in ('purchasing','store') and u.email is not null;
    end if;
    return new;
end;
$$;
create trigger trg_notify_low_stock
    after update on spare_parts
    for each row execute function notify_low_stock();

-- =====================================================================
-- 10) KPI VIEWS  (คำนวณสดจาก base tables ไม่เก็บซ้ำ)
-- =====================================================================

-- 10.1 สถานะสต็อกอะไหล่ + risk zone
create or replace view v_spare_status as
select p.id, p.code, p.name, g.name as mc_group,
       p.current_stock, p.rop, p.safety_stock, p.criticality_score,
       case
         when p.current_stock = 0 then 'OUT_OF_STOCK'
         when p.current_stock < p.rop then 'BELOW_ROP'
         else 'NORMAL'
       end as stock_status,
       p.current_stock * p.unit_cost as stock_value
from spare_parts p left join mc_groups g on g.id = p.mc_group_id;

-- 10.2 PM compliance + overdue flag
create or replace view v_pm_status as
select pm.*, m.code as machine_code,
       case when pm.completed then 'Completed'
            when pm.next_pm_date < current_date then 'Overdue'
            else 'Scheduled' end as pm_state
from pm_schedules pm join machines m on m.id = pm.machine_id;

create or replace view v_kpi_pm_compliance as
select count(*) filter (where completed) as completed_pm,
       count(*) as total_pm,
       round(100.0 * count(*) filter (where completed) / nullif(count(*),0), 2) as compliance_pct
from pm_schedules;

-- 10.3 MTTR / breakdown KPI ราย 30 วันล่าสุด
create or replace view v_kpi_maintenance as
select count(*) as breakdown_count,
       round(avg(ra.repair_hours), 2) as mttr_hours,
       round(sum(r.downtime_hours), 2) as total_downtime_hours
from maintenance_requests r
left join repair_actions ra on ra.request_id = r.id
where r.created_at >= now() - interval '30 days';

-- 10.4 ต้นทุนซ่อมรวมต่อใบแจ้ง
create or replace view v_repair_cost as
select r.request_no, m.code as machine_code,
       coalesce(sum(u.total_cost),0) as parts_cost
from maintenance_requests r
join machines m on m.id = r.machine_id
left join spare_part_usage u on u.request_id = r.id
group by r.request_no, m.code;

-- 10.5 มุมมองความเสี่ยงเครื่องจักร
create or replace view v_machine_risk as
select m.code, m.name, g.name as mc_group, m.rank, m.criticality, m.status,
       risk_zone(m.rank, case m.criticality when 'HIGH' then 9 when 'MEDIUM' then 6 else 3 end) as risk_zone
from machines m left join mc_groups g on g.id = m.mc_group_id;

-- =====================================================================
-- 11) ROW LEVEL SECURITY (โครงเริ่มต้น - เปิดใช้แล้วเพิ่ม policy ตาม role)
-- =====================================================================
-- alter table maintenance_requests enable row level security;
-- create policy "read_all_authenticated" on maintenance_requests
--   for select to authenticated using (true);
-- create policy "insert_own" on maintenance_requests
--   for insert to authenticated with check (true);
-- (ทำ policy ละเอียดต่อเมื่อเชื่อม Supabase Auth)

-- =====================================================================
--  END OF SCHEMA
-- =====================================================================
