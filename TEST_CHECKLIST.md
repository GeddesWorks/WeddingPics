# Test Checklist — Post-Review Changes

Nothing here has been exercised yet. Run through this on real devices before launch.
Wedding: **May 16, 2026**. Today: 2026-04-22 → you have ~3.5 weeks.

Legend: 📱 = needs phone, 🖥 = desktop/laptop OK, 🌐 = needs throttled or real cellular network.

---

## 1. Upload path — happy cases

- [ ] 📱 iPhone Safari: pick 1 HEIC photo → uploads, appears in gallery (#7)
- [ ] 📱 iPhone Safari: pick 1 large JPEG (>10 MB) → compresses, uploads (#8)
- [ ] 📱 iPhone Safari: 48MP burst photo (or anything >24 MP) → two-pass downscale path runs, doesn't crash (#8)
- [ ] 📱 Android Chrome: pick 1 JPEG from gallery → uploads (confirms `capture="environment"` removal lets them pick from library, not just camera) (#14)
- [ ] 📱 Android Chrome: attempt HEIC upload → either uploads raw or shows clear error, no silent failure (#7)
- [ ] 🖥 Desktop Chrome: drag-drop 5 photos → all upload, all appear in gallery
- [ ] 🖥 Upload 2 photos with the **same filename** from different devices → both land in bucket with different names (random suffix) (#15)

## 2. Upload path — queue / concurrency

- [ ] 📱 Start uploading 5 photos, while in progress add 3 more → all 8 complete, none dropped (#6)
- [ ] 📱 Queue 10+ photos → progress UI shows each; none stuck (#6)
- [ ] 🖥 Start upload, watch DevTools → Memory. Object URLs revoked after each item finishes (#9)
  - Easy check: `performance.memory.usedJSHeapSize` shouldn't monotonically climb per upload

## 3. Upload path — failure & retry

- [ ] 🌐 Start an upload, flip airplane mode mid-flight, flip back → retry succeeds within 3 attempts, item shows `done` not `error` (#4)
- [ ] 🌐 Block `fra.cloud.appwrite.io` in DevTools → retries fire at 500/1500/4500ms → final `error` state displayed (#4)
- [ ] 🌐 Force a 429 (spam uploads on a throttled plan, or mock it in DevTools → Network → Override Response) → longer backoff kicks in, not the 500ms one (#4)
- [ ] 📱 Kill the tab mid-upload, reopen → no ghost uploads, no zombie object URLs (#9)

## 4. Gallery — auth

- [ ] 🖥 Open `/gallery` in incognito → login form, not the bundled password (#2)
- [ ] 🖥 View page source → `VITE_GALLERY_PASSWORD` value is NOT in the bundle (#2)
- [ ] 🖥 Log in as owner → see photos
- [ ] 🖥 Log out → gallery blocked again (#2)
- [ ] 🖥 DevTools → Network → directly hit `listFiles` REST endpoint without a session cookie → 401 (#1, #2)
- [ ] 🖥 DevTools → Network → hit `deleteFile` directly without auth → 401 (#3)
- [ ] 🖥 Anonymous `createFile` still works (that's the guest upload path — must stay open) (#1)

## 5. Gallery — listing & UX

- [ ] 🖥 Gallery with 30+ photos: scroll to bottom → IntersectionObserver loads next page automatically, no "Load more" button (#16)
- [ ] 🖥 Scroll fast to bottom of a 200+ photo gallery → pages keep loading until exhausted, no duplicates, no gaps (#16)
- [ ] 🌐 Kill network, reload `/gallery` as logged-in owner → visible error card with "Try again" (not "No photos yet") (#17)
- [ ] 🌐 With some photos loaded, kill network, scroll to trigger next page → inline retry banner appears (#17)
- [ ] 🖥 Grid thumbnails load fast; peek at Network → thumb URLs are 400×400, not 800×800 (#12)
- [ ] 🖥 Open lightbox → full-res preview loads (bigger request) (#12)

## 6. Gallery — delete

- [ ] 🖥 As owner, delete a photo → gallery updates once, counter decrements correctly, no flicker (#13)
- [ ] 🖥 Delete 3 photos rapidly in a row → all three vanish, counter accurate (no stale-state bug) (#13)
- [ ] 🖥 Delete the last photo on a page while next page is loading → no race, no ghost tile (#13)

## 7. Download-all

- [ ] 🖥 Gallery with 50+ photos → "Download all" → zip streams (watch Network; response body grows over time, not one big blob at the end) (#10)
- [ ] 🖥 Gallery with 200+ photos → download completes without tab crashing (#10)
- [ ] 🖥 During download-all, DevTools → Network → see ~6 parallel fetches, not serialized one-at-a-time (#11)
- [ ] 🖥 Unzip downloaded archive → file count matches gallery count, no corrupted files

## 8. Appwrite console sanity (week of)

- [ ] Platforms: prod domain registered (no CORS errors in prod)
- [ ] Bucket perms: `create=any`, `read/update/delete=user:69e972b9699bd2375194` only
- [ ] Allowed extensions: images only
- [ ] Max file size: 25 MB
- [ ] Self-signup disabled
- [ ] Storage quota headroom: ≥750 MB free
- [ ] Rate limit plan confirmed / bumped for event window

## 9. Smoke test on venue-like conditions

- [ ] 🌐 Throttle DevTools to "Slow 3G" → upload 3 photos end-to-end, confirm retries cope
- [ ] 📱 If possible, scout the venue and test upload on actual venue WiFi a week before
- [ ] 📱 QR-code → upload page flow on a phone you've never logged in on (simulates a guest)

---

## Stretch / nice-to-have before launch

- [ ] Print QR-code cards, test-scan from 3 different phones
- [ ] Backup plan if Appwrite has an outage day-of (local SD card? guest Dropbox?)
- [ ] Pre-populate gallery with 2–3 engagement photos so the first guest doesn't see an empty page
