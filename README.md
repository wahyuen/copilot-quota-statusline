# copilot-quota-statusline

A [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli) plugin that shows your **premium quota usage and month pacing** in the CLI status line footer.

```
Q:[###.........] 24.4% | M:[###.........] 23.3% | ~~ on pace
```

The bar on the left (`Q:`) is quota used this month. The bar on the right (`M:`) is how far through the calendar month you are. The pace indicator tells you if you're on track:

| Icon | Meaning |
|------|---------|
| `OK` (green) | More than 5% under pace — ahead of budget |
| `~~` (yellow) | Within 5% of pace — on track |
| `!!` (red) | More than 5% over pace — burning quota too fast |

## Prerequisites: Enable the experimental status line

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
1. Writes `statusline.ps1` and a launcher to `~/.copilot/plugins/quota-statusline/`
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
    "command": "C:\\Users\\YOU\\.copilot\\plugins\\quota-statusline\\statusline.cmd",
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

Then remove the `statusLine` block from `~/.copilot/config.json` and delete `~/.copilot/plugins/quota-statusline/`.

## License

MIT
