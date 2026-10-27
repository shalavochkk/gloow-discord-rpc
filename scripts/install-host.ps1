# Установка Native Messaging Host для Windows
$HostName = "com.gloowroom.discordrpc"
$BridgeDir = Join-Path (Split-Path $PSScriptRoot -Parent) "bridge"
$IndexPath = Join-Path $BridgeDir "index.js"
$BatPath = Join-Path $BridgeDir "start.bat"
"@echo off`nnode `"$IndexPath`"" | Out-File -FilePath $BatPath -Encoding ASCII
$Manifest = @{name=$HostName; description="Gloowroom Discord RPC Native Host"; path=$BatPath; type="stdio"; allowed_origins=@("chrome-extension://EXTENSION_ID/")}
$ManifestJson = $Manifest | ConvertTo-Json -Depth 10
$ManifestFile = Join-Path $BridgeDir "$HostName.json"
$ManifestJson | Out-File -FilePath $ManifestFile -Encoding UTF8
$RegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
New-Item -Path $RegPath -Force | Out-Null
Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestFile
Write-Host "Установлено! $ManifestFile"
