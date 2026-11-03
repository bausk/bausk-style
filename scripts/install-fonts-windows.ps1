# Installs the bausk-style desktop fonts (fonts/ttf/**) for the current Windows user, no admin rights.
# PowerPoint, Word and other desktop apps need them for the templates to render as designed.
#   powershell -ExecutionPolicy Bypass -File scripts\install-fonts-windows.ps1 [-Source <dir>]
# Remove: delete the files from %LOCALAPPDATA%\Microsoft\Windows\Fonts and their values under
# HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts.
param([string]$Source = (Join-Path $PSScriptRoot '..\fonts\ttf'))
$dest = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
$reg = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
if (-not (Test-Path $reg)) { New-Item -Path $reg -Force | Out-Null }
Add-Type -Namespace BauskStyle -Name Gdi -MemberDefinition '[DllImport("gdi32.dll", CharSet = CharSet.Unicode)] public static extern int AddFontResource(string file);'
Get-ChildItem -Path $Source -Recurse -Include *.ttf, *.otf | ForEach-Object {
  $target = Join-Path $dest $_.Name
  Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  $name = [System.IO.Path]::GetFileNameWithoutExtension($_.Name) + ' (TrueType)'
  New-ItemProperty -Path $reg -Name $name -Value $target -PropertyType String -Force | Out-Null
  [void][BauskStyle.Gdi]::AddFontResource($target)
  Write-Output "installed $($_.Name)"
}
