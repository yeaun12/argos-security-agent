; ARGOS per-user offline/demo prototype installer.
; Not a signed standalone executable or a live SDP client.
#ifndef BasicRoot
  #error "Compile with build-installer.ps1, which supplies BasicRoot."
#endif

[Setup]
AppId={{6A895BDF-4E62-4673-BED1-DE05D863CC3F}
AppName=ARGOS
AppVersion=0.2.11
AppPublisher=ARGOS student project
DefaultDirName={localappdata}\Programs\ARGOS
DefaultGroupName=ARGOS
PrivilegesRequired=lowest
UsePreviousAppDir=no
DisableDirPage=yes
WizardStyle=modern
Compression=lzma2
SolidCompression=yes
Uninstallable=yes
OutputBaseFilename=ARGOS-Installer
OutputDir=.
SetupLogging=yes

[Files]
Source: "{#BasicRoot}\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#BasicRoot}\launcher\launch-argos.ps1"; DestDir: "{app}\launcher"; Flags: ignoreversion
Source: "{#BasicRoot}\PACKAGE_MANIFEST.json"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\ARGOS (Demo only)"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\launcher\launch-argos.ps1"" -Demo"; WorkingDir: "{app}"; Comment: "Illustrative local demo; not a live security connection"
Name: "{group}\ARGOS (Offline - disconnected)"; Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\launcher\launch-argos.ps1"""; WorkingDir: "{app}"; Comment: "No account or SDP credentials"
