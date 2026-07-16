; Bitbloq Offline - NSIS installer script
; Builds bitbloq-offline-setup-<version>.exe from the Windows build folder.
; Run: makensis pkg/windows/bitbloq-offline.nsi

!define APPNAME "Bitbloq Offline"
!define APPVERSION "1.3.0-rc.1"
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
; Installer sections
Section "Install" SecInstall
    SetOutPath "$INSTDIR"
    ; Copy the whole build preserving structure (Bitbloq.exe at root,
    ; resources\app\... and zowi_samples\ next to it).
    File /r "${SRC}"

    ; Add the user to the dialout-equivalent group is N/A on Windows;
    ; drivers are provided for manual install.
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

Section "Uninstall" SecUninstall
    Delete "$INSTDIR\uninstall.exe"
    RMDir /r "$INSTDIR"
    Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"
    RMDir "$SMPROGRAMS\${APPNAME}"
    Delete "$DESKTOP\${APPNAME}.lnk"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
SectionEnd
