# Project S Foundation Tasks — GAI AI

## P0 Trust
- [~] Permission Center — persistent modes, DENY, Ask Every Time, Allow Once and Files selected-folder scopes are implemented end-to-end; native folder picker and non-file scoped grants remain.
- [~] Action Receipts — runtime events/API/UI, operation type, affected resources and truthful reversibility metadata are implemented; transactional before-state capture and verified Undo remain.
- [ ] Capability-scoped authorization.
- [ ] User-visible/revocable grants.

## P0 Product
- [ ] Command surface.
- [ ] Brain workspace.
- [ ] Ambient surface.
- [ ] Memory Center.

## P0 Engineering
- [~] Dependency security baseline — npm audit is classified into direct/transitive findings and uploaded by CI; remediation upgrades remain.
- [~] Isolate BaiLongma compatibility — environment/global/UI legacy aliases now pass through dedicated compat modules; remaining legacy profile-name migration cleanup remains.
- [ ] Separate PR CI / main internal / beta / stable release paths.
- [ ] Preserve trusted macOS signing, notarization, stapling and Gatekeeper checks.
- [ ] Keep architecture verification for arm64/x64.

## P1
- [ ] Simplified voice modes.
- [ ] Personal Context inspector.
- [ ] Hardware-aware local model management.

## Exit gate
Foundation is complete only when GAI AI can explain what it remembers, what it is allowed to do, and what it did.
