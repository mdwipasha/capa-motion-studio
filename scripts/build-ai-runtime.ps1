param(
  [Parameter(Mandatory = $true)]
  [string]$FfmpegDir,

  [string]$Python = "python",
  [string]$OutputDir = "dist-ai-runtime"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$pythonRoot = Join-Path $repoRoot "python"
$ffmpegPath = Join-Path $FfmpegDir "ffmpeg.exe"
$ffprobePath = Join-Path $FfmpegDir "ffprobe.exe"
$distRoot = Join-Path $repoRoot $OutputDir
$bundleRoot = Join-Path $distRoot "capamotion-ai-runtime"
$archivePath = Join-Path $distRoot "capamotion-ai-runtime-windows-x64.zip"
$venvRoot = Join-Path $distRoot ".venv"

if (!(Test-Path $ffmpegPath)) {
  throw "ffmpeg.exe was not found in $FfmpegDir"
}

if (!(Test-Path $ffprobePath)) {
  throw "ffprobe.exe was not found in $FfmpegDir"
}

New-Item -ItemType Directory -Force -Path $distRoot | Out-Null

if (!(Test-Path $venvRoot)) {
  & $Python -m venv $venvRoot
}

$venvPython = Join-Path $venvRoot "Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $pythonRoot "requirements.txt") pyinstaller

Push-Location $pythonRoot
try {
  & $venvPython -m PyInstaller --clean --noconfirm --onefile --name capamotion-ai server.py
}
finally {
  Pop-Location
}

if (Test-Path $bundleRoot) {
  Remove-Item -LiteralPath $bundleRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $bundleRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $pythonRoot "dist\capamotion-ai.exe") -Destination (Join-Path $bundleRoot "capamotion-ai.exe") -Force
Copy-Item -LiteralPath $ffmpegPath -Destination (Join-Path $bundleRoot "ffmpeg.exe") -Force
Copy-Item -LiteralPath $ffprobePath -Destination (Join-Path $bundleRoot "ffprobe.exe") -Force

if (Test-Path $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Compress-Archive -LiteralPath (Join-Path $bundleRoot "*") -DestinationPath $archivePath -Force
Write-Host "AI runtime bundle created: $archivePath"
