# 📝 Englabs Projects - Master Task List

| Task ID | Task Description | Priority | Status | Comments / Notes |
|---------|------------------|----------|--------|------------------|
| TASK-01 | **3D Digital Cockpit Console Design** <br> Make folders, sidebars, buttons behave like mechanical push keys and console panels. | 🔴 High | ✅ DONE | Applied recessed bezel styles, dot-grid console desks, and active mechanical keycap sockets. |
| TASK-02 | **Welcome Voice Greeting** <br> Play "Welcome Englabs Team" audio greeting on app launch/first user interaction. | 🔴 High | ✅ DONE | Implemented with HTML5 Synthesis Voice, deferred until first user interaction to bypass autoplay restrictions. |
| TASK-03 | **Restore Gurpreet's ₹1,169.00 Payment** <br> Restore the missing payment `ADV-2026-0002` in advances log. | 🔴 High | ✅ DONE | State restoration checks added on mount to auto-recover this entry if deleted or missing. |
| TASK-04 | **Transaction Receipt Matching** <br> Match transaction IDs for ₹1,169.00 (`130053039997`) and ₹1,082.00 (`164929955900`) payments. | 🔴 High | ✅ DONE | Recorded transaction IDs in forensic JSON on disk. Saved ₹1,082.00 as `ADV-2026-0007` ("Gurpreet May full payment"). |
| TASK-05 | **Payment Mode field & column** <br> Track and display Payment Mode (`UPI`, `CASH`, `BANK TRANSFER`) in Log Form and Advances History table. | 🔴 High | ✅ DONE | Added select dropdown and table column with colored status badges (Gold for CASH, Green for UPI, Blue for Bank Transfer). |
| TASK-06 | **Persistent Porter Data (No Data Loss)** <br> Fix local storage data loss and prevent state synchronization from overriding user edits. | 🔴 High | ✅ DONE | Integrated Firestore cloud sync for porter trips/advances. Corrected local initialization & reactive sync overlay merge order. |
| TASK-07 | **Daily Automated Test Run & App Verification** <br> Automatically run Vitest unit test suites and type safety checks daily. | 🟡 Medium | ✅ DONE | TypeScript (0 errors) and Vitest (23/23 passed) verified successfully. |
| TASK-08 | **Porter Staff Document Processing & HR Letters** <br> Parse Gurpreet Singh's documents from G: drive, save staff profile, and generate Appointment & Joining Letters (₹15,000 salary + ₹10/km rate). | 🔴 High | ✅ DONE | Extracted Aadhaar, PAN, DL, Bank, CV, and Marks sheets via Gemini. Saved profile & photo to disk, and generated letters in both Markdown and PDF formats in the G: drive folder. |
| TASK-09 | **Englabs Address Correction & Verification** <br> Correct spelling errors in Englabs corporate and office addresses (e.g. `DISHA ARCAHE` -> `DISHA ARCADE` in billing details and full standardized address in ID Card). | 🔴 High | ✅ DONE | Corrected spelling of Disha Arcade in billing services and standardized corporate address on ID Card. |

---

## 🛠️ Verification & Quality Gates
* **TypeScript Check**: `npx tsc --noEmit` -> Passed with **0 errors**.
* **Vitest Suite**: `npm test -- --run` -> All **23 tests passed**.
* **Browser Test Run**: Visual verification of Mode column, CASH/UPI badges, and Firestore cloud sync.
