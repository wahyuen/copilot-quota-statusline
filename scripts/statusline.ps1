# Copilot CLI Status Line Script (Windows PowerShell)
# Fetches premium quota from GitHub API and displays pacing vs month progress.

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

function Get-MiniBar([double]$pct, [string]$colorCode) {
    $width  = 12
    $filled = [int][math]::Round($pct / 100 * $width)
    $bar    = ("#" * $filled).PadRight($width, ".")
    return "$colorCode[$bar]$rst"
}

# 4. Build output
if ($null -ne $usedPct) {
    $diff = $usedPct - $monthPct

    if ($diff -lt -5) {
        $icon      = "OK"
        $paceAnsi  = "$esc[32m"
        $diffLabel = "$([math]::Abs([math]::Round($diff, 1)))% ahead"
    } elseif ($diff -gt 5) {
        $icon      = "!!"
        $paceAnsi  = "$esc[31m"
        $diffLabel = "$([math]::Round($diff, 1))% behind"
    } else {
        $icon      = "~~"
        $paceAnsi  = "$esc[33m"
        $diffLabel = "on pace"
    }

    $quotaBar = Get-MiniBar $usedPct "$esc[35m"
    $monthBar = Get-MiniBar $monthPct "$esc[34m"
    Write-Output "Q:$quotaBar $usedPct% | M:$monthBar $monthPct% | ${paceAnsi}${icon} ${diffLabel}${rst}"
} else {
    $monthBar = Get-MiniBar $monthPct "$esc[34m"
    Write-Output "Quota:? | M:$monthBar $monthPct% ($elapsedDays/$daysInMonth)"
}
