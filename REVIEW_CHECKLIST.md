# Pre-Wedding Code Review Checklist

Wedding date: **May 16, 2026**. ~100 guests uploading concurrently on shared venue WiFi.
Items ordered by priority. Check off as completed.

---

## 🔴 Critical — security & data safety

- [ ] **1. Lock down Appwrite bucket permissions**
  - Role `any`: `create` only
  - `read` / `update` / `delete`: authenticated admin only (or remove entirely)
  - Verify in Appwrite console → Storage → Bucket → Settings

- [ ] **2. Move gallery behind real auth, not a bundled password**
  - `VITE_GALLERY_PASSWORD` ships in the JS bundle — anyone can view-source it
  - Options: Appwrite email/password account for owner; or Cloudflare Access / basic-auth in front of `/gallery`
  - Must also gate `listFiles` and `deleteFile` server-side (see #1)

- [ ] **3. Delete must require authentication**
  - `storage.deleteFile` at [GalleryPage.jsx:255](src/pages/GalleryPage.jsx:255) should only work for an authenticated admin session
  - Blocked by #1 and #2

---

## 🟠 Reliability under load

- [x] **4. Retry failed uploads with exponential backoff**
  - Wrap `storage.createFile` at [UploadPage.jsx:216](src/pages/UploadPage.jsx:216) in 3-attempt retry (500ms, 1500ms, 4500ms)
  - Treat 429s specifically with longer backoff

- [ ] **5. Handle shared-IP rate limits**
  - Confirm/raise Appwrite bucket rate limit for the event
  - Consider per-device concurrency cap (2–3 parallel, still serialized per device)

- [x] **6. Don't drop files added during upload**
  - [UploadPage.jsx:195](src/pages/UploadPage.jsx:195) `if (uploading) return` silently drops new selections
  - Queue them instead, or visibly disable the input with a message

- [ ] **7. HEIC handling**
  - iOS Safari can decode HEIC in canvas; Android Chrome / desktop cannot
  - Detect HEIC by extension/mime → either skip compression and upload raw, or show a clear error

- [ ] **8. Guard against OOM on huge photos**
  - Canvas on mobile Safari caps around ~16MP; modern iPhones produce 48MP
  - If `w*h > 24_000_000`, downscale in two passes or fall back to original
  - Located in `compressImage` at [UploadPage.jsx:7](src/pages/UploadPage.jsx:7)

- [x] **9. Revoke object URLs**
  - `URL.createObjectURL` at [UploadPage.jsx:200](src/pages/UploadPage.jsx:200) never revoked
  - Revoke on `done` / `error` and on queue reset

---

## 🟡 Gallery scalability

- [ ] **10. Stream the zip, don't buffer everything in RAM**
  - Use `zip.generateAsync({ type: 'blob', streamFiles: true })` in [GalleryPage.jsx:285](src/pages/GalleryPage.jsx:285)
  - For very large galleries, split into chunked zips (e.g., 200 per file)

- [ ] **11. Parallelize zip fetches**
  - [GalleryPage.jsx:276-283](src/pages/GalleryPage.jsx:276) fetches sequentially
  - Use concurrency pool of ~6

- [ ] **12. Smaller grid thumbnails**
  - `getFilePreview(… 800, 800)` at [GalleryPage.jsx:12](src/lib/appwrite.js:12) is overkill for a 2-col grid
  - Use 400×400 for the grid; full-res only in the lightbox

- [ ] **13. Fix delete race / clamping bug**
  - Nested `setFiles` in [GalleryPage.jsx:257-263](src/pages/GalleryPage.jsx:257) reads stale state
  - Consolidate into one update

---

## 🟢 Polish

- [ ] **14. Remove `capture="environment"`** at [UploadPage.jsx:108](src/pages/UploadPage.jsx:108) — forces camera on some Androids instead of letting user pick from gallery

- [ ] **15. Filename collision guard** — add index or random suffix in `buildFileName` at [UploadPage.jsx:187](src/pages/UploadPage.jsx:187)

- [ ] **16. Infinite scroll** — replace "Load more" button with IntersectionObserver in gallery

- [ ] **17. Visible error state on `listFiles` failure** — [GalleryPage.jsx:241](src/pages/GalleryPage.jsx:241) currently only `console.error`s; UI shows misleading "No photos yet"

---

## Pre-launch sanity checks (do the week of)

- [ ] Appwrite platform has the production domain whitelisted (CORS)
- [ ] Storage quota has headroom for 100 guests × ~15 photos × ~500KB ≈ 750MB
- [ ] Rate limits set appropriately for expected burst
- [ ] Test on an actual iPhone (HEIC) and Android (large JPEG) on cellular
- [ ] Test gallery download-all with a realistic count (50+ photos)
- [ ] Confirm gallery auth holds against someone opening devtools
