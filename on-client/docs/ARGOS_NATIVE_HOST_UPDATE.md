# ARGOS Native Host startup update (2026-10-22)

**Scope:** staged native-login preparation compatibility change. **Not** a complete update to ALEPH starter v0.2.15.

## Source and baseline
- ARGOS base: `c600a33cc7f7ab078ec1a665d8639a6d0623a61b` (starter v0.2.11; student stage 13–17 implementation preserved).
- Comparison source: `ChoiTimo/alekov-test0-finish-acceptance-20261021`, branch `main`, labeled starter v0.2.15. This is a **test0 reference implementation**, not proven to be an authorized official update bundle.
- Imported in this review branch ONLY:
  - `on-client/tools/start-alekov.ps1`: opt-out switch `-NoNativeHost`; automatic private host configuration preparation when not demo; install-receipt protection.
  - `on-client/tools/prepare-native-host.ps1`: `-ReuseExisting` plus ownership/ACL/content validation before reusing previously created config.
- Student source, tests, server, gateway transport, SDP, and existing data were not touched. `on-client/package.json` remains v0.2.11 intentionally.

## Safety / verification status
- No account approval, model request, secret extraction, or installed-app modification was performed by this Git change.
- Reviewed the imported scripts statically for auto-preparation, reuse and ACL validation, secret handling and explicit opt-out.
- Windows PowerShell + native credential host execution **not run here**; must be validated on the student's own Windows machine.
- This change is not a claim of real AI connectivity or stage-17 acceptance.
- Do NOT copy anyone else's `native.json`, registry/vault directories, cookies, app credentials, or tokens. The script prepares a project-specific config outside the Git repository.
- Do not directly overwrite `main` with this branch until smoke test and review pass.

## Local acceptance (Windows, new terminal; do not commit credentials)
1. Confirm the project has no uncommitted changes: `git status --short`.
2. `git fetch origin`, then `git switch --track origin/upgrade/native-host-auto-20261022`.
3. `cd on-client`; run `node --check student/extension.mjs` and `node --test`.
4. Make sure the desired port is free. Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\\tools\\start-alekov.ps1 -Port 5190` (normal mode, **not** `-Demo` or `-NoNativeHost`). This creates/reuses local private config after validating its ACL.
5. Confirm the terminal reports `계정 연결 준비가 끝났습니다` and starts the app. In browser `http://127.0.0.1:5190/`, check the account connection panel.
6. Do NOT paste confirmation numbers, credential paths, token strings, or diagnostic object contents into public GitHub or chat. Report only safe status/error **codes**.
7. If account connection is available, follow the portal's on-screen native-login approval and AI-app approval using the same account. `현재 API 연결 점검` is still only a model-list check; run a separate incident explanation test only with a real authorized SDP binding.

## Expected limitations
- Without the operating account, approved app registration, gateway and SDP binding, the app may still report `ON_AI_PROVISIONING_PENDING` or disconnected. These are not fixed by creating a native host config.
- The ALEPH grading system's complaint that `server.mjs` and `clco-http.mjs` were "list only" is a separate submission-review issue; this patch does **not** fix AI code ingestion.
- A full starter migration (0.2.11 → 0.2.15) would need separately authenticated distribution source, original-manifest-aware updates for ~24 modified provided files and 13 new files, and broader runtime regression testing; avoid grafting them over existing code from a personal reference repository.
