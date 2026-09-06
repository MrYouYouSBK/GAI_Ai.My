# GAI AI — Mac Community Installer

Download **Community-Installer-arm64.zip** for Apple Silicon (including M5), or **Community-Installer-x64.zip** for Intel.

1. Extract the entire ZIP folder.
2. Double-click **Install-GAI-AI.command**. It opens Terminal and performs the installation for you; do not type any commands.
3. If macOS blocks the installer, go to **System Settings → Privacy & Security → Open Anyway** and confirm this first run.
4. GAI AI opens after installation. Open it normally from Applications afterwards.

The installer verifies its embedded archive checksum, application identity, version and ad-hoc signature before installing. It preserves the previous app and user data, removes quarantine only from the verified GAI AI bundle, and uses your home Applications folder if the system Applications folder is not writable. No sudo command, Apple Developer account or paid API is required for installation.

This is an **ad-hoc signed, unnotarized community distribution**. It is not an Apple-approved release. An initial operating-system confirmation may be necessary. The app's microphone, speech, and screen permissions are still controlled by macOS.

Community builds automatically check GitHub for updates, download the matching architecture with SHA-256 verification, and install on quit. Community update validation checks the bundle identity, version, architecture and signature. Developer ID builds retain their existing stricter update verification.

Includes the existing continuous voice listener, noise suppression control, local Apple Silicon/MLX setup and startup task reminders. Runtime/model downloads require an internet connection the first time. Local models run without a paid API; cloud-provider features may have their own fees. CI covers packaged app launch and installation on Apple Silicon and Intel macOS runners; it does not certify microphone quality, multi-hour recordings, or performance on a physical M5.

## 中文

Apple Silicon／M5 選 **Community-Installer-arm64.zip**，Intel 選 **Community-Installer-x64.zip**。

解壓縮整個資料夾，雙擊 **Install-GAI-AI.command**。安裝器會自行開啟 Terminal 完成安裝，**不需要輸入指令或 sudo**。首次若被 macOS 阻擋，前往「系統設定 → 隱私權與安全性 → 仍要打開」確認一次。之後直接在 Applications 開啟 GAI AI。

此為未經 Apple 公證的社群版。安裝器驗證檔案、保留舊版與使用者資料，只處理 GAI AI 的下載隔離屬性；不會停用系統安全設定。自動更新由 GitHub 下載並驗證，退出 App 時安裝。本地模型無需付費 API，首次需下載模型；麥克風與螢幕權限仍由你在 macOS 中控制。
