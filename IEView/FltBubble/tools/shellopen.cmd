@ECHO OFF
:: 2021 Dmitry Chigiryov (Dm1)

SET "DESKTOP=%USERPROFILE%\Desktop"
CALL :regGetValue "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" "Desktop" "DESKTOP"
CALL :expandVariable "DESKTOP"
SET "MYDOCUMENTS=%USERPROFILE%\Documents"
CALL :regGetValue "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" "Personal" "MYDOCUMENTS"
CALL :expandVariable "MYDOCUMENTS"

IF "%~1" == "" EXIT /B 1
IF "%~2" == "" EXIT /B 1
CALL :%~1 %2 2>NUL

GOTO :EOF

:file
	START "" "%~1"
EXIT /B

:dir
	START "" explorer.exe /select,"%~1"
EXIT /B

:regGetValue
	SET "_REGGETVALUE=1"
	FOR %%A IN (%~2) DO SET /A "_REGGETVALUE+=1"
	FOR /F "skip=2 tokens=%_REGGETVALUE%,*" %%A IN ('REG QUERY "%~1" /V "%~2" 2^>NUL') DO SET "%~3=%%B"
EXIT /B

:expandVariable
	FOR /F %%A IN ('ECHO %%%~1%%') DO CALL SET "%~1=%%A"
EXIT /B