$basePath = 'C:\Users\Dell\.nuget\packages'
$pkgs = @(
  'microsoft.aspnetcore.openapi\10.0.0',
  'microsoft.codeanalysis.analyzers\3.11.0',
  'microsoft.entityframeworkcore.analyzers\10.0.0',
  'microsoft.extensions.configuration.binder\10.0.0',
  'microsoft.extensions.logging.abstractions\10.0.0',
  'microsoft.extensions.logging.abstractions\6.0.0',
  'microsoft.extensions.logging.abstractions\8.0.0',
  'microsoft.extensions.logging.abstractions\9.0.0',
  'microsoft.extensions.options\10.0.0',
  'microsoft.extensions.options\8.0.0',
  'microsoft.extensions.options\9.0.0',
  'microsoft.extensions.telemetry.abstractions\10.0.0',
  'xunit.analyzers\1.18.0'
)

foreach ($p in $pkgs) {
  $fullPath = Join-Path $basePath $p
  if (Test-Path $fullPath) {
    Write-Output "Deleting: $fullPath"
    Remove-Item $fullPath -Recurse -Force
    Write-Output "  Deleted."
  } else {
    Write-Output "Already gone: $fullPath"
  }
}
