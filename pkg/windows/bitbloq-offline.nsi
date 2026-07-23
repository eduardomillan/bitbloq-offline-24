; Bitbloq Offline - NSIS installer script
; Builds bitbloq-offline-setup-<version>.exe from the Windows build folder.
; Run: makensis -DAPPVERSION=X.Y.Z pkg/windows/bitbloq-offline.nsi
; (version is passed automatically by grunt pkg-nsis-win)

!define APPNAME "Bitbloq Offline"
!ifndef APPVERSION
    !define APPVERSION "dev"
!endif
!define PUBLISHER "Eduardo Millán"
!define WEBSITE "https://github.com/eduardomillan/bitbloq-offline-24"
!define SRC "/home/eduardo/bitbloq-offline-24/dist/BitbloqOfflineWin"
!define ICON "/home/eduardo/bitbloq-offline-24/res/buildWindowsExe/Bitbloq.ico"

; NSIS modern UI
!include "MUI2.nsh"
!include "x64.nsh"

Name "${APPNAME} ${APPVERSION}"
OutFile "/home/eduardo/bitbloq-offline-24/dist/bitbloq-offline-setup-${APPVERSION}.exe"
InstallDir "$PROGRAMFILES64\BitbloqOffline"
InstallDirRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "InstallLocation"
RequestExecutionLevel admin

;--------------------------------
; Interface settings
!define MUI_ABORTWARNING
!define MUI_ICON "${ICON}"
!define MUI_UNICON "${ICON}"

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "Spanish"
!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Component selection
InstType "Full installation (with arduino-cli setup)"
InstType "Minimal installation (arduino-cli must be installed separately)"

;--------------------------------
; Installer sections
Section "Install" SecInstall
    SectionIn 1 2
    SetOutPath "$INSTDIR"
    ; Copy the whole build preserving structure (Bitbloq.exe at root,
    ; resources\app\... and zowi_samples\ next to it).
    File /r "${SRC}"

    ; Board USB drivers are no longer bundled: on modern Windows they are
    ; installed via Windows Update / arduino-cli or manually (see INSTALL.md).
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayVersion" "${APPVERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "Publisher" "${PUBLISHER}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "URLInfoAbout" "${WEBSITE}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoRepair" 1

    ; Start menu shortcut
    CreateDirectory "$SMPROGRAMS\${APPNAME}"
    CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\Bitbloq.exe" "" "$INSTDIR\Bitbloq.exe" 0
    CreateShortCut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0

    ; Desktop shortcut
    CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\Bitbloq.exe" "" "$INSTDIR\Bitbloq.exe" 0

    ; Uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Arduino CLI Setup Scripts" SecArduinoScripts
    SectionIn 1 2
    SetOutPath "$INSTDIR\tools"
    
    ; Include the installation scripts
    File "${SRC}\..\..\scripts\install-arduino-cli.ps1"
    File "${SRC}\..\..\scripts\install-arduino-cli.cmd"
    
    ; Create shortcut to setup script in Start Menu
    CreateShortCut "$SMPROGRAMS\${APPNAME}\Setup Arduino CLI.lnk" "$INSTDIR\tools\install-arduino-cli.cmd" "" "$INSTDIR\tools\install-arduino-cli.cmd" 0
SectionEnd

Section "Run Arduino CLI Setup" SecRunArduinoSetup
    SectionIn 1
    ; Run the PowerShell script to install arduino-cli
    ; This is optional and can be run later from Start Menu
    ExecWait 'powershell.exe -ExecutionPolicy Bypass -File "$INSTDIR\tools\install-arduino-cli.ps1" -Silent'
SectionEnd

;--------------------------------
; Descriptions
LangString DESC_SecInstall ${LANG_ENGLISH} "Install Bitbloq Offline application files."
LangString DESC_SecInstall ${LANG_SPANISH} "Instalar los archivos de la aplicación Bitbloq Offline."
LangString DESC_SecArduinoScripts ${LANG_ENGLISH} "Install Arduino CLI setup scripts (can be run later from Start Menu)."
LangString DESC_SecArduinoScripts ${LANG_SPANISH} "Instalar scripts de configuración de Arduino CLI (pueden ejecutarse después desde el Menú Inicio)."
LangString DESC_SecRunArduinoSetup ${LANG_ENGLISH} "Run Arduino CLI setup now (installs arduino-cli, AVR core, and Servo library)."
LangString DESC_SecRunArduinoSetup ${LANG_SPANISH} "Ejecutar configuración de Arduino CLI ahora (instala arduino-cli, core AVR y librería Servo)."

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecInstall} $(DESC_SecInstall)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecArduinoScripts} $(DESC_SecArduinoScripts)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecRunArduinoSetup} $(DESC_SecRunArduinoSetup)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall" SecUninstall
    Delete "$INSTDIR\uninstall.exe"
    RMDir /r "$INSTDIR"
    Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\Setup Arduino CLI.lnk"
    RMDir "$SMPROGRAMS\${APPNAME}"
    Delete "$DESKTOP\${APPNAME}.lnk"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
SectionEnd
