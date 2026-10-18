<#
.SYNOPSIS
    Cruzaro Render Backend Keep-Alive PowerShell Script
.DESCRIPTION
    Pings the Render backend /api/health endpoint every 13 minutes to prevent
    free-tier spinning down after 15 minutes of inactivity.
.EXAMPLE
    .\scripts\keep_alive.ps1 "https://cruzaro-backend.onrender.com"
#>

param(
    [string]$Url = $env:RENDER_BACKEND_URL
)

if (-not $Url) {
    $Url = "https://cruzaro-backend.onrender.com"
}

$BaseUrl = $Url.TrimEnd('/')
if (-not $BaseUrl.EndsWith('/api/health')) {
    $TargetUrl = "$BaseUrl/api/health"
} else {
    $TargetUrl = $BaseUrl
}

$IntervalSeconds = 13 * 60

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "🚀 CRUZARO RENDER BACKEND KEEP-ALIVE (POWERSHELL)" -ForegroundColor Cyan
Write-Host "🎯 Target Endpoint: $TargetUrl" -ForegroundColor Yellow
Write-Host "⏱️  Ping Interval:   Every 13 minutes" -ForegroundColor Yellow
Write-Host "🛡️  Mode:            Active (keeps Render free tier awake)" -ForegroundColor Green
Write-Host "===========================================================`n" -ForegroundColor Cyan

while ($true) {
    $Timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$Timestamp] 📡 Pinging $TargetUrl ..." -ForegroundColor Gray
    
    $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $Response = Invoke-RestMethod -Uri $TargetUrl -Method Get -TimeoutSec 90 -ErrorAction Stop
        $Stopwatch.Stop()
        $Latency = $Stopwatch.ElapsedMilliseconds
        $Status = if ($Response.status) { " - status: `"$($Response.status)`"" } else { "" }
        Write-Host "[$Timestamp] ✅ Success ($($Latency)ms)$Status" -ForegroundColor Green
    }
    catch {
        $Stopwatch.Stop()
        $Latency = $Stopwatch.ElapsedMilliseconds
        Write-Host "[$Timestamp] ⚠️ Ping encountered warning/error ($($Latency)ms): $($_.Exception.Message)" -ForegroundColor Red
    }

    $NextTime = (Get-Date).AddSeconds($IntervalSeconds).ToString("HH:mm:ss")
    Write-Host "[$Timestamp] ⏳ Next ping scheduled in 13 minutes (at $NextTime)`n" -ForegroundColor DarkGray

    Start-Sleep -Seconds $IntervalSeconds
}
