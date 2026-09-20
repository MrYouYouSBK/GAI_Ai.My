# Project S Product Baseline — GAI AI REV.01

Status: Foundation
Owner: Project S
Product role: Local-first personal desktop agent

## Product statement

GAI AI should be defined by three user outcomes:

1. Remember.
2. Understand.
3. Act.

The product must not be driven by adding every technically possible capability.

## Core product boundary

GAI AI is a persistent, local-first desktop agent with:
- Personal context.
- Long-term memory.
- Tasks/reminders.
- Voice.
- Controlled tool execution.
- Local and optional cloud models.
- Auditable actions.

It is not primarily:
- A generic chatbot wrapper.
- A model downloader.
- A developer shell with a chat UI.
- A social-media client.
- A media-generation catalog.

Those may exist as capabilities, but they are subordinate to the agent experience.

## P0 — Trust architecture

### Permission Center
Every capability belongs to a user-understandable permission domain:
- Files.
- Shell.
- Software installation.
- Network/web.
- Microphone.
- Camera.
- Screen capture.
- Messages/connectors.
- Memory writes.
- Local model management.

Permission modes should support where appropriate:
- Deny.
- Ask every time.
- Allow once.
- Allow for selected scope.
- Always allow.

High-impact actions must never inherit permission merely because a lower-risk action was allowed.

### Action Receipt
Every meaningful action should create an auditable receipt:
- What happened.
- When.
- Which capability performed it.
- User request / task that caused it.
- Files/resources affected.
- Result.
- Whether an Undo/Open/Inspect action exists.

This should evolve from the existing audit / turn-trace infrastructure.

## P0 — Product surfaces

### Command
Fast transient command surface for short actions.

### Brain
Full workspace for:
- Long conversations.
- Projects.
- Tasks.
- Memory.
- Agent runs.
- Documents.

### Ambient
Background voice/wake/reminder layer that does not require the main window to stay open.

Advanced configuration belongs in Settings, not in the primary interaction path.

## P0 — Memory Center

Expose the existing memory engine as a user product surface.

Required categories:
- People.
- Projects.
- Preferences.
- Places.
- Tasks/commitments.
- Facts.

Required controls:
- Inspect.
- Edit.
- Pin.
- Expire.
- Forget.
- Export.

Users must be able to understand why a memory is used.

## P0 — Legacy isolation

All BaiLongma compatibility should move behind one compatibility boundary.

Target:
- New production code uses GAI-only naming.
- Legacy environment keys / storage keys / paths are read by migration adapters.
- Compatibility remains for upgrades but is not allowed to spread into new modules.

Suggested location:
- src/compat/legacy-bailongma.js
- dedicated migration tests

## P0 — Release discipline

Separate:
- Pull-request CI.
- Main/internal builds.
- Beta.
- Stable.

A normal push to main must not automatically equal a public stable release.

Stable release gate:
1. Version/tag created intentionally.
2. Unit and smoke tests pass.
3. Release safety checks pass.
4. macOS artifacts are Developer ID signed.
5. Notarization accepted.
6. Stapling verified.
7. Gatekeeper test passes with quarantine metadata.
8. Windows installer smoke test passes.
9. Checksums published.
10. Release notes match the actual shipped version.

## P1 — Voice simplification

Primary modes:
- Off.
- Push to Talk.
- Wake Word.
- Always Listening.

Advanced:
- ASR engine.
- Noise suppression.
- AEC.
- Sensitivity.
- Silence duration.
- Language routing.
- TTS/provider tuning.

Voice activity must remain visibly indicated.

## P1 — Personal Context

Context selection should prioritize:
- Active task/project.
- Relevant memory.
- Recent conversation.
- User-selected files.
- Current app/document context when permission exists.
- Calendar/connector context when explicitly connected.

Context must remain inspectable and revocable.

## P1 — Local AI

Treat local inference as infrastructure, not the product identity.

Goals:
- Automatic hardware detection.
- Apple Silicon optimized path.
- Memory-aware model recommendations.
- Clear download size / RAM requirements.
- One-click removal.
- Offline fallback.

## P2 — Project S Bridge

GAI AI may consume safe signals from Project S companion apps.

Examples:
- Trio: battery/network/audio state.
- MacD: lid state/current profile.

Bridge rules:
- Local only by default.
- Authenticated.
- Capability-scoped.
- No unrestricted remote shell.
- Logged in Action Receipts.

## Distribution strategy

Primary full-power edition:
- Direct distribution.
- Developer ID.
- Apple notarization.
- Secure updater.

Potential Mac App Store edition:
- Separate constrained product profile.
- No assumption that dynamic tools, unrestricted shell, installers or executable code download can remain available.

## Success criteria

GAI AI succeeds when:
- A normal user knows what to do within the first minute.
- The agent can remember relevant context without becoming opaque.
- Actions are useful and auditable.
- Voice works without forcing users into technical settings.
- Local mode remains useful without paid APIs.
- Powerful capabilities do not silently outrun the user's authority.
