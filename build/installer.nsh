!macro killMiniJwebProcesses
  nsExec::ExecToLog 'taskkill /F /IM "Mini J-Web EX.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "Mini J-Web EX Windows.exe" /T'
!macroend

!macro removeKnownMiniJwebDir DIR
  ${if} ${FileExists} "${DIR}\Mini J-Web EX Windows.exe"
    DetailPrint "Removing old Mini J-Web EX Windows directory: ${DIR}"
    RMDir /r "${DIR}"
  ${elseif} ${FileExists} "${DIR}\Mini J-Web EX.exe"
    DetailPrint "Removing old Mini J-Web EX directory: ${DIR}"
    RMDir /r "${DIR}"
  ${endif}
!macroend

!macro cleanupBrokenInstallRoot ROOT
  ReadRegStr $0 ${ROOT} "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${if} "$0" != ""
    !insertmacro removeKnownMiniJwebDir "$0"
  ${endif}
  DeleteRegKey ${ROOT} "${UNINSTALL_REGISTRY_KEY}"
  !ifdef UNINSTALL_REGISTRY_KEY_2
    DeleteRegKey ${ROOT} "${UNINSTALL_REGISTRY_KEY_2}"
  !endif
  DeleteRegKey ${ROOT} "${INSTALL_REGISTRY_KEY}"
!macroend

!macro cleanupBrokenInstall
  SetRegView 64
  !insertmacro cleanupBrokenInstallRoot HKLM
  !insertmacro cleanupBrokenInstallRoot HKCU
  SetRegView 32
  !insertmacro cleanupBrokenInstallRoot HKLM
  !insertmacro cleanupBrokenInstallRoot HKCU
  SetRegView lastused
  !insertmacro removeKnownMiniJwebDir "$PROGRAMFILES64\${APP_FILENAME}"
  !insertmacro removeKnownMiniJwebDir "$PROGRAMFILES\${APP_FILENAME}"
  !insertmacro removeKnownMiniJwebDir "$LOCALAPPDATA\Programs\${APP_FILENAME}"
!macroend

!macro recoverBrokenOldUninstaller
  StrCpy $R1 0
  IfErrors 0 +3
    DetailPrint "Old uninstaller could not be executed. Removing old application files directly."
    StrCpy $R1 1

  ${if} $R0 != 0
    DetailPrint "Old uninstaller returned error $R0. Removing old application files directly."
    StrCpy $R1 1
  ${endif}

  ${if} $R1 == 0
    Return
  ${endif}

    !insertmacro killMiniJwebProcesses
    ${if} "$INSTDIR" != ""
      !insertmacro removeKnownMiniJwebDir "$INSTDIR"
    ${endif}
    DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}"
    !ifdef UNINSTALL_REGISTRY_KEY_2
      DeleteRegKey SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY_2}"
    !endif
    DeleteRegKey SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}"
    StrCpy $R0 0
    ClearErrors
!macroend

!macro customInit
  !insertmacro killMiniJwebProcesses
  !insertmacro cleanupBrokenInstall
!macroend

!macro customInstall
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" "Publisher" "Pichan Pratummal"
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" UninstallString '"$INSTDIR\resources\elevate.exe" "$appExe" --mini-jweb-uninstall'
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" QuietUninstallString '"$INSTDIR\resources\elevate.exe" "$appExe" --mini-jweb-uninstall --silent'
!macroend

!macro customUnInstallCheck
  !insertmacro recoverBrokenOldUninstaller
!macroend

!macro customUnInstallCheckCurrentUser
  !insertmacro recoverBrokenOldUninstaller
!macroend

!macro customUnInit
  !insertmacro killMiniJwebProcesses
!macroend

!macro customUnInstall
  RMDir "$INSTDIR"
!macroend
