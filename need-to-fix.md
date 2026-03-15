# Need to Fix

## High Priority

### 1. Weak JWT secret passes startup guard
- **File:** `server/.env` line 4, `docker-compose-prod.yml` line 43
- **Issue:** `JWT_SECRET=change_me_to_a_long_random_secret` is a non-empty string so the startup guard passes. Tokens get signed with a known public value.
- **Fix:** In `server.js`, add a check after the existing guard:
  ```js
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'change_me_to_a_long_random_secret') {
    console.error("❌ JWT_SECRET is too weak — set a strong random secret in .env");
    process.exit(1);
  }
  ```
  Then update `.env` and `docker-compose-prod.yml` with a real generated secret.

---

### 2. MongoDB password defaults to `admin123` in Docker
- **File:** `docker-compose-prod.yml` lines 17, 42
- **Issue:** `${MONGO_PASSWORD:-admin123}` starts the DB with a known credential if `MONGO_PASSWORD` is not set on the host.
- **Fix:** Change to `${MONGO_PASSWORD:?MONGO_PASSWORD must be set}` so Docker Compose refuses to start without it.

---

### 3. Path traversal on file deletion
- **File:** `server/src/routes/sertifikasiRoutes.js` lines 167–188, 216–232
- **Issue:** Old file path from MongoDB is joined directly into `path.join(..., existing.fotoEquipment)` and passed to `fs.unlinkSync`. A tampered DB value like `../../server.js` could delete arbitrary files.
- **Fix:** Validate the resolved path stays inside the uploads directory before calling `unlinkSync`:
  ```js
  const resolved = path.resolve(uploadsDir, existing.fotoEquipment);
  if (resolved.startsWith(path.resolve(uploadsDir))) fs.unlinkSync(resolved);
  ```

---

### 4. `/uploads` is publicly accessible without authentication
- **File:** `server/src/app.js` line 59
- **Issue:** `app.use("/uploads", express.static(...))` is mounted before any auth middleware. Anyone with a filename can access certificate PDFs and equipment photos.
- **Fix:** Either serve files through an authenticated API route (`GET /api/v1/sertifikasi/:id/file`) that checks the JWT before streaming, or add an auth-checking middleware before the static route.

---

### 5. WhatsApp session not persisted in Docker volume
- **File:** `docker-compose-prod.yml`, `server/src/services/whatsapp.js` line 14
- **Issue:** `auth_info_baileys/` is inside the container filesystem, not mounted as a volume. Every container restart destroys the WhatsApp session — requires QR rescan every redeploy.
- **Fix:** Add to `docker-compose-prod.yml` under backend `volumes:`:
  ```yaml
  - backend-auth:/app/auth_info_baileys
  ```
  And declare `backend-auth:` in the top-level `volumes:` block.

---

## Medium Priority

### 6. No per-route rate limit on `/register` and `/login`
- **File:** `server/src/routes/authRoutes.js`, `server/src/app.js`
- **Issue:** Auth endpoints share the global 1000 req/15min limiter. No dedicated brute-force protection on login or account flooding on register.
- **Fix:** Add a stricter limiter (e.g. 10 req/15min per IP) applied only to `/api/v1/auth`.

---

### 7. `data/` folder baked into Docker image
- **File:** `server/Dockerfile`
- **Issue:** `COPY . .` includes the local `data/` folder (with dev `users.json` and its `admin123` hash) into the image at build time.
- **Fix:** Add `data/` to `.dockerignore` so the built image never contains local dev data. Runtime seeding via `seedDefaultUser()` handles first boot.

---

### 8. `expiringDays` has no server-side validation
- **File:** `server/src/services/notificationService.js` line 36
- **Issue:** Negative or non-numeric values are saved directly to MongoDB. A value like `-999` means no expiring-soon notifications ever fire.
- **Fix:**
  ```js
  if (data.expiringDays !== undefined) {
    if (typeof data.expiringDays !== 'number' || data.expiringDays < 1 || data.expiringDays > 365)
      throw new AppError("expiringDays must be a number between 1 and 365", 400);
    update.expiringDays = data.expiringDays;
  }
  ```

---

## Already Fixed Today (2026-03-16)
- JWT secret fails hard at startup if not set
- `MONGO_URI` fails hard at startup if not set
- `bufferCommands: false` added to `mongoose.connect()`
- `scheduleTime` re-validated in `startScheduler` with NaN fallback
- `minute.padStart` TypeError crash fixed
- Log limit capped at 200
- Phone number validation (supports `08xxx`, `628xxx`, `+628xxx`)
- Uji Notifikasi button removed (redundant with Kirim Preview)
- Request logger skips 304s from polling endpoints
- QR/status polling interval reduced from 3s to 5s
- Log timestamp now shows date + time (e.g. `16 Mar, 09:15`)
