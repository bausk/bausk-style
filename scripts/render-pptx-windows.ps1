# Renders every slide of a .pptx to PNG with Microsoft PowerPoint (for visual review).
#   powershell -ExecutionPolicy Bypass -File scripts\render-pptx-windows.ps1 -Deck deck.pptx -Out outdir [-Width 1920]
param([Parameter(Mandatory)][string]$Deck, [Parameter(Mandatory)][string]$Out, [int]$Width = 1920)
$work = Join-Path $env:TEMP ('bausk-pptx-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $work, $Out | Out-Null
$local = Join-Path $work (Split-Path $Deck -Leaf)
Copy-Item -LiteralPath $Deck -Destination $local
$pp = New-Object -ComObject PowerPoint.Application
try {
  $pres = $pp.Presentations.Open($local, $true, $false, $false)   # read-only, no window
  $height = [int]($Width * $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth)
  $pres.Export($work, 'PNG', $Width, $height)
  $pres.Close()
} finally { $pp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($pp) }
Get-ChildItem $work -Filter *.png | ForEach-Object { Copy-Item $_.FullName (Join-Path $Out $_.Name) -Force; Write-Output $_.Name }
Remove-Item -Recurse -Force $work
