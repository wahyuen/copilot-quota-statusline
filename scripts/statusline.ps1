# Copilot CLI Status Line Script (Windows PowerShell)
# Fetches premium quota from GitHub API and displays pacing vs month progress.

# 0. Load plugin config — defaults used if file is absent or a key is missing
$pluginDir = if ($env:CLAUDE_PLUGIN_DATA) { $env:CLAUDE_PLUGIN_DATA } else { Join-Path $env:USERPROFILE '.copilot\plugins\quota-statusline' }
$cfgPath   = Join-Path $pluginDir 'config.json'
$cfg       = if (Test-Path $cfgPath) { try { Get-Content $cfgPath -Raw | ConvertFrom-Json } catch { $null } } else { $null }

function Get-Cfg([string]$key, $default) {
    if ($cfg -and ($cfg.PSObject.Properties.Name -contains $key)) { return $cfg.$key }
    return $default
}

$filledChar   = Get-Cfg 'filledChar'    '█'
$unfilledChar = Get-Cfg 'unfilledChar'  '░'
$barWidth     = [int](Get-Cfg 'barWidth' 12)
$quotaColor   = Get-Cfg 'quotaBarColor' '35'
$monthColor   = Get-Cfg 'monthBarColor' '34'
$quotaLabel   = Get-Cfg 'quotaLabel'    'Q'
$monthLabel   = Get-Cfg 'monthLabel'    'M'
$aheadIcon    = Get-Cfg 'aheadIcon'     '🟢'
$onPaceIcon   = Get-Cfg 'onPaceIcon'    '🟡'
$behindIcon   = Get-Cfg 'behindIcon'    '🔴'
$aheadText    = Get-Cfg 'aheadText'     'ahead'
$onPaceText   = Get-Cfg 'onPaceText'    'on pace'
$behindText   = Get-Cfg 'behindText'    'behind'
$aheadColor   = Get-Cfg 'aheadColor'   '32'
$onPaceColor  = Get-Cfg 'onPaceColor'  '33'
$behindColor  = Get-Cfg 'behindColor'  '31'

# 1. Fetch premium quota from GitHub API using stored git credentials
$usedPct = $null
try {
    $token = ("url=https://github.com" | git credential fill 2>$null | Select-String "^password=").ToString().Split("=", 2)[1]
    if ($token) {
        $quota        = Invoke-RestMethod -Uri "https://api.github.com/copilot_internal/user" `
                            -Headers @{ "Authorization" = "Bearer $token"; "Accept" = "application/json" } `
                            -TimeoutSec 5 -ErrorAction Stop
        $remainingPct = $quota.quota_snapshots.premium_interactions.percent_remaining
        $usedPct      = [math]::Round(100 - $remainingPct, 1)
    }
} catch { }

# 2. Month progress
$now         = Get-Date
$daysInMonth = [DateTime]::DaysInMonth($now.Year, $now.Month)
$elapsedDays = $now.Day
$monthPct    = [math]::Round($elapsedDays / $daysInMonth * 100, 1)

# 3. ANSI helpers
$esc = [char]27
$rst = "$esc[0m"

function Get-MiniBar([double]$pct, [string]$ansiColor) {
    $filled   = [int][math]::Round($pct / 100 * $barWidth)
    $unfilled = $barWidth - $filled
    $bar      = ($filledChar * $filled) + ($unfilledChar * $unfilled)
    return "$ansiColor[$bar]$rst"
}

# 4. Build output
if ($null -ne $usedPct) {
    $diff = $usedPct - $monthPct

    if ($diff -lt -5) {
        $icon      = $aheadIcon
        $paceAnsi  = "$esc[${aheadColor}m"
        $diffLabel = "$([math]::Abs([math]::Round($diff, 1)))% $aheadText"
    } elseif ($diff -gt 5) {
        $icon      = $behindIcon
        $paceAnsi  = "$esc[${behindColor}m"
        $diffLabel = "$([math]::Round($diff, 1))% $behindText"
    } else {
        $icon      = $onPaceIcon
        $paceAnsi  = "$esc[${onPaceColor}m"
        $diffLabel = $onPaceText
    }

    $quotaBar = Get-MiniBar $usedPct "$esc[${quotaColor}m"
    $monthBar = Get-MiniBar $monthPct "$esc[${monthColor}m"
    Write-Output "${quotaLabel}:$quotaBar $usedPct% | ${monthLabel}:$monthBar $monthPct% | ${paceAnsi}${icon} ${diffLabel}${rst}"
} else {
    $monthBar = Get-MiniBar $monthPct "$esc[${monthColor}m"
    Write-Output "${quotaLabel}:? | ${monthLabel}:$monthBar $monthPct% ($elapsedDays/$daysInMonth)"
}
