$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$sdkRoot = Join-Path $projectRoot ".android-sdk"
$downloadUrl = "https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip"
$downloadZip = Join-Path $projectRoot ".android-commandlinetools.zip"
$extractRoot = Join-Path $projectRoot ".android-cmdline-tools"
$cmdlineRoot = Join-Path $sdkRoot "cmdline-tools"
$latestRoot = Join-Path $cmdlineRoot "latest"
$licensesRoot = Join-Path $sdkRoot "licenses"

function Ensure-Directory($path) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
  }
}

function Get-JavaHome() {
  $preferred = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
  if (Test-Path $preferred) {
    return $preferred
  }

  $javaCommand = Get-Command java -ErrorAction SilentlyContinue
  if (-not $javaCommand) {
    throw "Java was not found. Install a JDK before running this setup."
  }

  return Split-Path (Split-Path $javaCommand.Source -Parent) -Parent
}

function Set-UserEnvVar($name, $value) {
  [Environment]::SetEnvironmentVariable($name, $value, "User")
  Set-Item -Path "Env:$name" -Value $value
}

function Add-UserPathEntry($entry) {
  $current = [Environment]::GetEnvironmentVariable("Path", "User")
  $parts = @()
  if ($current) {
    $parts = $current.Split(";") | Where-Object { $_ }
  }

  if ($parts -notcontains $entry) {
    $newPath = @($parts + $entry) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  }

  if (($env:Path -split ";") -notcontains $entry) {
    $env:Path = "$env:Path;$entry"
  }
}

function Ensure-AndroidLicenses() {
  Ensure-Directory $licensesRoot
  $androidSdkLicensePath = Join-Path $licensesRoot "android-sdk-license"
  @(
    "24333f8a63b6825ea9c5514f83c2829b004d1fee",
    "d56f5187479451eabf01fb78af6dfcb131a6481e"
  ) | Set-Content -Path $androidSdkLicensePath
}

function Invoke-SdkManager([string[]] $arguments) {
  $sdkManagerPath = Join-Path $latestRoot "bin\sdkmanager.bat"
  if (-not (Test-Path $sdkManagerPath)) {
    throw "sdkmanager.bat was not found at $sdkManagerPath"
  }

  $processInfo = New-Object System.Diagnostics.ProcessStartInfo
  $processInfo.FileName = $sdkManagerPath
  $processInfo.Arguments = (($arguments + "--sdk_root=$sdkRoot") -join " ")
  $processInfo.UseShellExecute = $false

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $processInfo
  $process.Start() | Out-Null

  $process.WaitForExit()
  if ($process.ExitCode -ne 0) {
    throw "sdkmanager failed with exit code $($process.ExitCode)."
  }
}

function Accept-SdkLicenses() {
  $sdkManagerPath = Join-Path $latestRoot "bin\sdkmanager.bat"
  $escapedManagerPath = $sdkManagerPath.Replace('"', '\"')
  $escapedSdkRoot = $sdkRoot.Replace('"', '\"')
  $command = "(for /L %i in (1,1,200) do @echo y) | `"$escapedManagerPath`" --licenses --sdk_root=`"$escapedSdkRoot`""
  $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $command" -Wait -PassThru -NoNewWindow
  if ($process.ExitCode -ne 0) {
    throw "Accepting Android SDK licenses failed with exit code $($process.ExitCode)."
  }
}

Ensure-Directory $sdkRoot

Write-Host "Downloading Android command-line tools..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadZip

if (Test-Path $extractRoot) {
  Remove-Item -Recurse -Force $extractRoot
}

Write-Host "Extracting Android command-line tools..."
Expand-Archive -Path $downloadZip -DestinationPath $extractRoot -Force

Ensure-Directory $cmdlineRoot
if (Test-Path $latestRoot) {
  Remove-Item -Recurse -Force $latestRoot
}
Ensure-Directory $latestRoot

$unzippedRoot = Join-Path $extractRoot "cmdline-tools"
Get-ChildItem -Path $unzippedRoot | ForEach-Object {
  Move-Item -Path $_.FullName -Destination $latestRoot -Force
}

$javaHome = Get-JavaHome
Set-UserEnvVar "JAVA_HOME" $javaHome
Set-UserEnvVar "ANDROID_HOME" $sdkRoot
Set-UserEnvVar "ANDROID_SDK_ROOT" $sdkRoot
Add-UserPathEntry (Join-Path $latestRoot "bin")
Add-UserPathEntry (Join-Path $sdkRoot "platform-tools")

Write-Host "Accepting Android SDK licenses..."
Accept-SdkLicenses
Ensure-AndroidLicenses

Write-Host "Installing Android SDK packages..."
Invoke-SdkManager @(
  '"platform-tools"',
  '"platforms;android-36"',
  '"build-tools;36.0.0"'
)

Write-Host ""
Write-Host "Android SDK setup complete."
Write-Host "ANDROID_SDK_ROOT=$sdkRoot"
Write-Host "JAVA_HOME=$javaHome"
Write-Host "Open a new PowerShell window before running Android build commands."
