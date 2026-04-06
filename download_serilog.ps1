$tmpDir = Join-Path $env:TEMP 'serilog_test'
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$pkgPath = Join-Path $tmpDir 'serilog.nupkg'
$url = 'https://www.nuget.org/api/v2/package/Serilog.AspNetCore/10.0.0'
Invoke-WebRequest -Uri $url -OutFile $pkgPath -UseBasicParsing
$zipPath = Join-Path $tmpDir 'serilog.zip'
Rename-Item $pkgPath $zipPath -Force
$extractDir = Join-Path $tmpDir 'extracted'
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
Get-ChildItem (Join-Path $extractDir 'lib') -Recurse -Filter '*.dll' | Select-Object FullName, Length
Remove-Item $tmpDir -Recurse -Force
