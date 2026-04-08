# copilot-quota-statusline

> I found myself "rationing" my Copilot quota toward the end of each month without really knowing where I stood. I wanted a passive, always-visible way to see how my usage was pacing against the calendar — so I built this plugin to show that right in the CLI footer without having to think about it.

A [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli) plugin that shows your **premium quota usage and month pacing** in the CLI status line footer.

```
Q:[████████░░░░] 65.2% | M:[█████░░░░░░░] 45.1% | 🟡 on pace
Q:[███░░░░░░░░░] 28.3% | M:[█████░░░░░░░] 45.1% | 🟢 16.8% ahead
Q:[████████░░░░] 65.2% | M:[█████░░░░░░░] 45.1% | 🔴 20.1% behind
```

The bar on the left (`Q:`) is quota used this month. The bar on the right (`M:`) is how far through the calendar month you are. The pace indicator tells you if you're on track:

| Colour | Meaning |
|--------|---------|
| 🟢 green | More than 5% under pace — ahead of budget |
| 🟡 yellow | Within 5% of pace — on track |
| 🔴 red | More than 5% over pace — burning quota too fast |

Everything is customisable — bar characters, colours, icons, labels. Emojis work too:

```
Quota Used:[🟩🟩🟩🟩░░░░░░░░] 36.4% | Monthly Progress:[🟦🟦🟦░░░░░░░░] 26.7% | 🔴 9.7% behind
Q:[🦭🦭🦭🌊🌊🌊] 52.3% | M:[🦭🦭🌊🌊🌊🌊] 33.3% | 🦑 on pace
```

## Customising the display

All visual settings are stored in the plugin's data directory (`~/.copilot/plugin-data/_direct/copilot-quota-statusline/config.json`). The easiest way to change them is to ask Copilot directly — the `quota-config` extension ships with the plugin and provides three tools the agent can call on your behalf.

### Using the Copilot CLI extension

Just ask in natural language:

```
show my quota statusline config
set the filled bar character to #
change the ahead icon to ✅ and the behind icon to 🚨
set the on pace text to "on track"
set the quota label to "Quota Used"
make the quota bar color cyan
reset all quota statusline settings to defaults
```

The extension tools (`quota_config_show`, `quota_config_set`, `quota_config_reset`) read and write the config file directly. Changes take effect on the next status line refresh (within 30 seconds — no restart needed).

### Available settings

| Key | Default | Description |
|-----|---------|-------------|
| `filledChar` | `█` | Filled bar character — any string, e.g. `#`, `▓`, `🟩` |
| `unfilledChar` | `░` | Unfilled bar character — e.g. `.`, `─`, `⬜` |
| `barWidth` | `12` | Bar width in character positions (reduce when using wide emoji) |
| `quotaBarColor` | `35` (magenta) | Colour of the quota bar |
| `monthBarColor` | `34` (blue) | Colour of the month bar |
| `quotaLabel` | `Q` | Label prefix for the quota bar — e.g. `Quota Used` |
| `monthLabel` | `M` | Label prefix for the month bar — e.g. `Monthly Progress` |
| `aheadIcon` | `🟢` | Pace icon when ahead — e.g. `OK`, `✅`, `😎` |
| `onPaceIcon` | `🟡` | Pace icon when on pace — e.g. `~~`, `⚡`, `👌` |
| `behindIcon` | `🔴` | Pace icon when behind — e.g. `!!`, `🚨`, `⚠️` |
| `aheadText` | `ahead` | Pacing text when ahead — e.g. `under budget` |
| `onPaceText` | `on pace` | Pacing text when on pace — e.g. `on track` |
| `behindText` | `behind` | Pacing text when behind — e.g. `over budget` |
| `aheadColor` | `32` (green) | Colour for the ahead indicator |
| `onPaceColor` | `33` (yellow) | Colour for the on-pace indicator |
| `behindColor` | `31` (red) | Colour for the behind indicator |

**Colour values** accept a colour name (`red`, `green`, `blue`, `yellow`, `magenta`, `cyan`, `white`, with a `bright_` prefix for brighter variants) or a raw ANSI code (`30`–`37`, `90`–`97`).

**Emoji notes:** Emojis are double-width characters. If you use them as `filledChar`/`unfilledChar`, set `barWidth` to a smaller value (e.g. `6`) so the bar doesn't overflow its column. Emoji pace icons (`aheadIcon`, etc.) work at any width since they're standalone.

### Editing the config file directly

The config file is plain JSON. All keys are optional — missing keys fall back to their defaults:

```json
{
  "filledChar": "#",
  "unfilledChar": ".",
  "barWidth": 10,
  "quotaLabel": "Quota Used",
  "monthLabel": "Monthly Progress",
  "quotaBarColor": "cyan",
  "monthBarColor": "blue",
  "aheadIcon": "✅",
  "onPaceIcon": "~~",
  "behindIcon": "🚨",
  "aheadText": "under budget",
  "onPaceText": "on track",
  "behindText": "over budget"
}
```



The status line footer is an **experimental feature** that must be opted into before it will appear. Add `"experimental": true` to your `~/.copilot/config.json`:

```json
{
  "experimental": true
}
```

If the file already exists, just add the key alongside your other settings. Then restart the CLI — you should see a footer bar appear at the bottom of the screen.

> The plugin's `sessionStart` hook sets this automatically when it runs, so if you install the plugin first and start a new session, it will be enabled for you.

## Requirements

- Windows with PowerShell 5.1+
- Git credential store configured for `https://github.com` (standard for GitHub users)
- GitHub Copilot CLI installed and signed in

> **Mac/Linux:** Requires [PowerShell Core (pwsh)](https://github.com/PowerShell/PowerShell). Experimental — see [Manual setup](#manual-setup-macos--linux) below.

## Install

```
copilot plugin install wahyuen/copilot-quota-statusline
```

On the next session start, the plugin automatically:
1. Writes `statusline.ps1` and a launcher to `~/.copilot/plugin-data/_direct/copilot-quota-statusline/`
2. Adds the `statusLine` config to `~/.copilot/config.json` (only if not already configured)

Then use `/restart` in the CLI to pick up the new status line.

## How it works

The status line script is called every 30 seconds by the CLI. It:

1. Retrieves your GitHub token via `git credential fill` (no hardcoded credentials)
2. Calls `GET https://api.github.com/copilot_internal/user` to fetch your quota snapshot
3. Calculates `used% = 100 - percent_remaining`
4. Calculates month progress from the current date
5. Computes pace diff and outputs a coloured ASCII bar line

## Manual setup (if auto-config doesn't work)

After installing the plugin, find where it was installed:

```
copilot plugin list
```

Then add to `~/.copilot/config.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "C:\\Users\\YOU\\.copilot\\plugin-data\\_direct\\copilot-quota-statusline\\statusline.cmd",
    "intervalSeconds": 30
  }
}
```

## Manual setup (macOS / Linux)

1. Clone this repo somewhere permanent
2. Create a launcher script `statusline.sh` next to `scripts/statusline.ps1`:
   ```bash
   #!/bin/bash
   pwsh -NoProfile -File "$(dirname "$0")/scripts/statusline.ps1"
   ```
3. `chmod +x statusline.sh`
4. Add to `~/.copilot/config.json`:
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "/path/to/statusline.sh",
       "intervalSeconds": 30
     }
   }
   ```

## Uninstall

```
copilot plugin uninstall copilot-quota-statusline
```

Then remove the `statusLine` block from `~/.copilot/config.json` and delete `~/.copilot/plugin-data/_direct/copilot-quota-statusline/`.

## License

[MIT](LICENSE)
