#!/bin/bash
set -euo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin

# Release packaging embeds the exact archive identity here. No network code runs.
ARCHIVE='@@ARCHIVE@@'
EXPECTED_SHA256='@@SHA256@@'
EXPECTED_VERSION='@@VERSION@@'
EXPECTED_ARCH='@@ARCH@@'
BUNDLE_ID='com.mryouyousbk.gaiai'
ROOT="$(cd "$(dirname "$0")" && pwd -P)"
stage=''
backup=''
target=''
installed=0
success=0
cleanup() {
  code=$?
  trap - EXIT
  if [ "$success" -ne 1 ]; then
    if [ "$installed" -eq 1 ]; then /bin/rm -rf "$target"; fi
    if [ -n "$backup" ] && [ -d "$backup" ]; then /bin/mv "$backup" "$target"; fi
    echo 'Installation stopped; any previous version has been kept. 安裝未完成，舊版本已保留。'
  fi
  if [ -n "$stage" ] && [ -d "$stage" ]; then /bin/rm -rf "$stage"; fi
  exit "$code"
}
trap cleanup EXIT
die() { echo "ERROR: $*" >&2; exit 1; }
[ "$(uname -s)" = Darwin ] || die 'This installer requires macOS.'
[ -f "$ROOT/$ARCHIVE" ] || die 'Keep the installer and its ZIP together in the extracted folder.'
actual="$(/usr/bin/shasum -a 256 "$ROOT/$ARCHIVE")"
[ "${actual%% *}" = "$EXPECTED_SHA256" ] || die 'Archive checksum mismatch. Download the complete installer again.'
machine="$(uname -m)"
if [ "$EXPECTED_ARCH" = arm64 ]; then
  [ "$machine" = arm64 ] || [ "$(sysctl -n hw.optional.arm64 2>/dev/null || true)" = 1 ] || die 'Download the Intel x64 installer for this Mac.'
else
  [ "$machine" = x86_64 ] || die 'Download the Apple Silicon arm64 installer for this Mac.'
fi

echo 'GAI AI: verified download. Installing… / 已驗證下載，正在安裝…'
destination=/Applications
if [ ! -w "$destination" ] || { [ -e "$destination/GAI AI.app" ] && [ ! -w "$destination/GAI AI.app" ]; }; then
  destination="$HOME/Applications"
  /bin/mkdir -p "$destination"
fi
target="$destination/GAI AI.app"
[ ! -L "$target" ] || die 'The destination is a symbolic link; refusing to replace it.'
if [ -e "$target" ]; then
  old_id="$(/usr/bin/plutil -extract CFBundleIdentifier raw -o - "$target/Contents/Info.plist")"
  [ "$old_id" = "$BUNDLE_ID" ] || die 'Another application occupies the destination.'
fi
stage="$(/usr/bin/mktemp -d "$destination/.gai-install.XXXXXX")"
/usr/bin/ditto -x -k "$ROOT/$ARCHIVE" "$stage"
source_app="$stage/GAI AI.app"
[ -d "$source_app" ] && [ ! -L "$source_app" ] || die 'The archive does not contain GAI AI.app.'
plist="$source_app/Contents/Info.plist"
[ "$(/usr/bin/plutil -extract CFBundleIdentifier raw -o - "$plist")" = "$BUNDLE_ID" ] || die 'Incorrect application identity.'
[ "$(/usr/bin/plutil -extract CFBundleShortVersionString raw -o - "$plist")" = "$EXPECTED_VERSION" ] || die 'Incorrect application version.'
[ "$(/usr/bin/plutil -extract GAICommunityDistribution raw -o - "$plist")" = true ] || die 'Incorrect distribution channel.'
/usr/bin/codesign --verify --deep --strict "$source_app"

# Only the verified GAI AI bundle is changed; system security settings stay enabled.
/usr/bin/xattr -rd com.apple.quarantine "$source_app" 2>/dev/null || true
attributes="$(/usr/bin/xattr -lr "$source_app")"
if [[ "$attributes" == *com.apple.quarantine* ]]; then die 'Could not remove the downloaded-app quarantine attribute.'; fi
/usr/bin/codesign --verify --deep --strict "$source_app"
if /usr/bin/pgrep -u "$(id -u)" -x 'GAI AI' >/dev/null; then
  /usr/bin/osascript -e 'tell application id "com.mryouyousbk.gaiai" to quit'
  for attempt in {1..30}; do
    /usr/bin/pgrep -u "$(id -u)" -x 'GAI AI' >/dev/null || break
    /bin/sleep 1
  done
  if /usr/bin/pgrep -u "$(id -u)" -x 'GAI AI' >/dev/null; then die 'GAI AI is still running; save your work and close it before installing.'; fi
fi
if [ -e "$target" ]; then
  backup="$destination/GAI AI.backup-$(date +%Y%m%d-%H%M%S)-$$.app"
  /bin/mv "$target" "$backup"
fi
/bin/mv "$source_app" "$target"
installed=1
/usr/bin/open "$target"
success=1
echo "Installed and launch requested: $target"
echo '安裝完成，已開啟 GAI AI。以後直接從 Applications 開啟。'
if [ -n "$backup" ]; then echo "Previous version: $backup"; fi
