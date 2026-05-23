
' Sane-AI Brain Engine Launcher
' Double-click this file to start the Brain GUI without any CMD window.

Dim sScriptDir
sScriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

Dim sPythonW
' Try to find pythonw.exe automatically
Dim oShell
Set oShell = CreateObject("WScript.Shell")

' Use pythonw (no console window) to launch the GUI
Dim sCmd
sCmd = "pythonw """ & sScriptDir & "brain_gui.pyw"""

' Run with window style 0 = hidden (no CMD box)
oShell.Run sCmd, 0, False

Set oShell = Nothing
