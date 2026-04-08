# Changelog

All notable changes to this project will be documented in this file.

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
