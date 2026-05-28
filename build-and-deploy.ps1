# build-and-deploy.ps1
# Run this AFTER doing "Build Web Mobile" from Cocos Creator 2.4.8 editor.
# It copies game assets into the CC build output and deploys to Firebase.

$root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$build = "$root\build\web-mobile"

if (-not (Test-Path $build)) {
    Write-Host "ERROR: $build not found. Build the project in Cocos Creator first." -ForegroundColor Red
    exit 1
}

Write-Host "Copying game assets to CC build output..." -ForegroundColor Cyan
# Copy res/ (game assets served directly, outside CC's asset pipeline)
Copy-Item -Path "$root\res" -Destination "$build\res" -Recurse -Force
Write-Host "Assets copied." -ForegroundColor Green

Write-Host "Deploying to Firebase..." -ForegroundColor Cyan
Push-Location $root
# Tell Firebase to deploy from build/web-mobile
firebase deploy --only hosting --public "build/web-mobile"
Pop-Location
Write-Host "Deploy complete." -ForegroundColor Green
