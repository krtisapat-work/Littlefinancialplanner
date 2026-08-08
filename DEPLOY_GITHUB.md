# ขึ้นเว็บด้วย GitHub Pages + อัปเดตกองทุนอัตโนมัติ

แอปนี้เป็นไฟล์เดียว (`index.html`) + สคริปต์ดึงกองทุน (`update_funds.js`).
GitHub Pages เสิร์ฟหน้าเว็บฟรี และ GitHub Actions รัน `update_funds.js` **ทุกวัน 08:00 น. (เวลาไทย) บนคลาวด์** → เว็บอัปเดตข้อมูลกองทุนเองโดยไม่ต้องเปิดคอม

---

## ⚠️ อ่านก่อน — เรื่องคอมมิชชั่น
GitHub Pages **ฟรี** ต้องใช้ repository แบบ **Public** → โค้ด `index.html` ที่มี **ข้อมูลคอมมิชชั่น + PIN 2569** จะอยู่ใน repo สาธารณะ (ใครก็เปิดดู/ค้น Google เจอได้)
- ถ้ารับได้ → ทำตามขั้นตอนล่างได้เลย
- ถ้าไม่อยากให้คอมหลุด → บอกให้ผมทำ **เวอร์ชันลูกค้า** (ตัดคอม/PIN/แท็บหลังบ้านออก) มาขึ้นเว็บแทน แล้วเก็บตัวเต็มไว้ใช้ส่วนตัว

---

## ขั้นตอน (ครั้งเดียว ~10 นาที)

### 1) มีบัญชี GitHub (ฟรี) — สมัครที่ github.com
### 2) สร้าง repository ใหม่
- กด **New repository** → ตั้งชื่อ เช่น `aia-planner` → เลือก **Public** → **ไม่ต้อง** ติ๊ก "Add README" → **Create**

### 3) อัปโหลดไฟล์โฟลเดอร์นี้ขึ้น repo — เลือกวิธีใดวิธีหนึ่ง

**วิธี A — ผ่าน Git (ถ้ามี git):** เปิด Terminal ในโฟลเดอร์นี้ แล้วรัน (แทน `<user>/<repo>` เป็นของคุณ)
```
git init
git add .
git commit -m "AIA Insurance Planner"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

**วิธี B — ลากไฟล์ผ่านเว็บ (ไม่ต้องมี git):** ในหน้า repo กด **Add file → Upload files** แล้วลากไฟล์ทั้งหมดในโฟลเดอร์นี้ (รวมโฟลเดอร์ `.github`) เข้าไป → Commit
> หมายเหตุ: การลากผ่านเว็บบางทีไม่รวมโฟลเดอร์ที่ขึ้นต้นด้วยจุด — ถ้า `.github/workflows/update-funds.yml` ไม่ขึ้น ให้สร้างเองผ่าน **Add file → Create new file** ตั้งชื่อ `.github/workflows/update-funds.yml` แล้ววางเนื้อหาไฟล์นั้น

### 4) เปิด GitHub Pages
- ไปที่ **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**
- รอ ~1 นาที เว็บจะขึ้นที่ **https://\<user\>.github.io/\<repo\>/**

### 5) เปิด Actions (ตัวอัปเดตอัตโนมัติ)
- ไปแท็บ **Actions** → ถ้ามีปุ่มให้เปิดใช้งาน workflow ให้กดเปิด
- workflow **"Update AIA fund data"** จะรันเองทุกวัน 08:00 น. ไทย · กดรันเองได้ที่ **Actions → Update AIA fund data → Run workflow**

---

## หมายเหตุ
- **รีเฟรชมือ** (ในเครื่อง) ยังใช้ได้: `node update_funds.js` หรือ Task Scheduler เดิม — แต่พอขึ้น GitHub แล้ว ตัวอัปเดตหลักจะเป็น GitHub Actions (ไม่ต้องเปิดคอม)
- GitHub อาจรัน schedule ช้ากว่า 08:00 เล็กน้อย (คิวของ GitHub) และจะ**หยุดรันเองถ้า repo ไม่มีความเคลื่อนไหว 60 วัน** — แค่เข้าไป Run workflow หรือ commit อะไรก็กลับมารันต่อ
- อยากผูกโดเมนตัวเอง (เช่น `plan.yourname.com`) ทำได้ที่ Settings → Pages → Custom domain
- ไฟล์ `run_update_funds.bat` + `.gitignore` + `index_backup_*` เป็นของฝั่งเครื่อง/สำรอง (backup ถูก .gitignore ไม่ขึ้นเว็บ)
