# Changelog

All notable changes to this project will be documented in this file.

## [1.3.9] - 2026-04-09

### Fixed
- Hook sentinel filename was still hardcoded as `setup.v1.3.7.done` after the version was bumped to 1.3.8 — users who had 1.3.7 previously would have the sentinel already present, causing the hook to skip setup on install of 1.3.8. Sentinel is now `setup.v1.3.9.done`.
- Hook checked only for the *presence* of the `experimental` key in `.copilot/config.json`, not its value — if a user had previously reset `experimental: false`, the hook would not re-enable it. Now correctly re-sets it to `true` when the key exists but is falsy.

## [1.3.8] - 2026-04-09

### Fixed
- `statusline.ps1` could go missing after install, leaving the statusline silent — the `sessionStart` hook now always re-writes `statusline.ps1` and `statusline.cmd` on every session start, before checking the done-marker. Only the initial `config.json` (which users may customise) is skipped when the done-marker exists. This also refreshes the embedded script on plugin updates.

## [1.3.7] - 2026-04-09

### Fixed
- `hooks.json` UTF-8 BOM re-introduced by the v1.3.6 editor save — caused the CLI JSON parser to reject the file and silently skip the `sessionStart` hook, so setup never ran on a fresh install

## [1.3.6] - 2026-04-08

### Fixed
- Custom config (e.g. emoji bar characters) was silently ignored — the Copilot CLI does not inject `CLAUDE_PLUGIN_DATA` into the statusline subprocess, so `statusline.ps1` fell back to a path that doesn't exist and used hardcoded defaults. The script now uses `$PSScriptRoot` as a fallback, which always resolves to the correct directory since the script and `config.json` are co-located.

## [1.3.5] - 2026-04-08

### Fixed
- Emoji pace icons (🟢🟡🔴) rendered as purple diamonds — PowerShell's default stdout encoding is IBM 850 (DOS), which corrupts multi-byte Unicode before the CLI reads it. `statusline.ps1` now sets `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` at startup

## [1.3.4] - 2026-04-08

### Fixed
- README documented incorrect plugin data path (`~/.copilot/plugins/quota-statusline/`) — the Copilot CLI sets `CLAUDE_PLUGIN_DATA` to `~/.copilot/plugin-data/_direct/copilot-quota-statusline/`, which is now reflected throughout the docs

## [1.3.3] - 2026-04-08

### Fixed
- `hooks.json` had a UTF-8 BOM which caused the CLI JSON parser to reject it with `Invalid JSON: Unexpected token` — the `sessionStart` hook was silently skipped on every launch, so setup never ran

## [1.3.2] - 2026-04-08

### Fixed
- `experimental` already being present in `config.json` no longer prevents `statusLine` from being written — the config check now runs unconditionally before the version sentinel guard, so a missing `statusLine` is always repaired on the next session start

## [1.3.1] - 2026-04-08

### Fixed
- Added UTF-8 BOM to `statusline.ps1` so emoji characters render correctly on all Windows PowerShell configurations
- Updated setup sentinel to `setup.v1.3.1.done` to trigger a fresh redeploy of the fixed script

### Added
- `LICENSE` file (MIT)
- "Why I built this" intro section in README

## [1.3.0] - 2026-04-07

### Added
- Default `config.json` is now written on first deploy (or after an update) so users can edit it directly without needing to know the key names
- `quota_config_reset` (reset all) now restores the full defaults file instead of writing an empty `{}`

### Fixed
- Plugin updates now correctly redeploy `statusline.ps1` — setup sentinel is version-stamped (`setup.v1.3.0.done`) so each version triggers a fresh deploy

## [1.2.0] - 2026-04-07

### Added
- New configurable label keys: `quotaLabel` (default `Q`) and `monthLabel` (default `M`) — set to long form e.g. `"Quota Used"` / `"Monthly Progress"`
- New configurable pacing text keys: `aheadText` (default `ahead`), `onPaceText` (default `on pace`), `behindText` (default `behind`)

### Changed
- Default bar characters updated: filled `#` → `█`, unfilled `.` → `░`
- Default pace icons updated: ahead `OK` → `🟢`, on pace `~~` → `🟡`, behind `!!` → `🔴`
- Status line output now uses configurable labels and pacing text throughout

## [1.1.0] - 2026-04-07

### Added
- All visual display settings are now configurable via `~/.copilot/plugins/quota-statusline/config.json`
- `quota-config` Copilot CLI extension — three in-tool commands for managing settings conversationally:
  - `quota_config_show` — view all current settings with custom vs default indicators
  - `quota_config_set` — change any setting by name (accepts colour names or ANSI codes)
  - `quota_config_reset` — reset one or all settings to defaults
- 11 configurable keys: `filledChar`, `unfilledChar`, `barWidth`, `quotaBarColor`, `monthBarColor`, `aheadIcon`, `onPaceIcon`, `behindIcon`, `aheadColor`, `onPaceColor`, `behindColor`
- Emoji support for all icon and bar character settings
- README "Customising the display" section with full settings table and colour reference

### Fixed
- Bar construction changed from `PadRight` to string multiplication, enabling multi-character and emoji bar chars

## [1.0.0] - 2026-04-06

### Added
- Initial release
- Status line footer showing premium quota used (`Q:`) and month progress (`M:`)
- Pace indicator: ahead / on pace / behind (±5% threshold)
- Coloured ANSI progress bars (magenta quota, blue month)
- Automatic setup via `sessionStart` hook — writes `statusline.ps1` and configures `~/.copilot/config.json`
- GitHub token fetched via `git credential fill` (no hardcoded secrets)
