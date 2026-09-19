@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0.."
set "FORCE=0"
set "SEED_DYNAMODB=0"
set "REGION=ap-south-1"
set "NO_OPEN=0"
set "HELP_EXIT=2"

:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="--force" (
  set "FORCE=1"
  shift
  goto parse_args
)
if /I "%~1"=="--dynamodb" (
  set "SEED_DYNAMODB=1"
  shift
  goto parse_args
)
if /I "%~1"=="--no-open" (
  set "NO_OPEN=1"
  shift
  goto parse_args
)
if /I "%~1"=="--region" (
  if "%~2"=="" (
    echo Missing value for --region.
    exit /b 2
  )
  set "REGION=%~2"
  shift
  shift
  goto parse_args
)
if /I "%~1"=="--help" (
  set "HELP_EXIT=0"
  goto help
)
if /I "%~1"=="-h" (
  set "HELP_EXIT=0"
  goto help
)
echo Unknown argument: %~1
goto help

:args_done
echo UtilitySync reset
echo.
echo This will reset the normal local UtilitySync app to the bundled Bengaluru dataset.
echo It clears UtilitySync localStorage keys for the app origin when the reset helper opens.
if "%SEED_DYNAMODB%"=="1" echo It will also run scripts\seed_dynamodb.py for region %REGION%.
echo.

if "%FORCE%"=="1" goto do_reset
set /P "CONFIRM=Type RESET to delete current UtilitySync app data and continue: "
if /I not "%CONFIRM%"=="RESET" (
  echo Reset cancelled.
  exit /b 1
)

:do_reset
set "HELPER=%ROOT%\frontend\reset-local.html"

break > "%HELPER%"
>> "%HELPER%" echo ^<!doctype html^>
>> "%HELPER%" echo ^<html lang="en"^>
>> "%HELPER%" echo ^<head^>
>> "%HELPER%" echo ^<meta charset="utf-8"^>
>> "%HELPER%" echo ^<title^>UtilitySync Local Reset^</title^>
>> "%HELPER%" echo ^<style^>
>> "%HELPER%" echo body{font-family:Segoe UI,Arial,sans-serif;background:#0f172a;color:#e5e7eb;margin:0;display:grid;min-height:100vh;place-items:center}
>> "%HELPER%" echo main{max-width:720px;padding:28px;border:1px solid #334155;border-radius:8px;background:#111827}
>> "%HELPER%" echo h1{margin-top:0;font-size:24px} code{color:#67e8f9}
>> "%HELPER%" echo .ok{color:#86efac}.bad{color:#fca5a5}
>> "%HELPER%" echo ^</style^>
>> "%HELPER%" echo ^</head^>
>> "%HELPER%" echo ^<body^>
>> "%HELPER%" echo ^<main^>
>> "%HELPER%" echo ^<h1^>UtilitySync reset^</h1^>
>> "%HELPER%" echo ^<p id="status"^>Resetting local working data...^</p^>
>> "%HELPER%" echo ^<pre id="details"^>^</pre^>
>> "%HELPER%" echo ^<p^>Open ^<code^>frontend/index.html^</code^> after this page reports success.^</p^>
>> "%HELPER%" echo ^</main^>
>> "%HELPER%" echo ^<script^>
>> "%HELPER%" echo window.US_RESET_TOKEN = 'bin-reset-2026-09-19';
>> "%HELPER%" echo ['utilitysync.devdb.v1','utilitysync.devdb.v2','utilitysync.devdb.v3','utilitysync.bengaluru.v1','utilitysync.reset.token'].forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
>> "%HELPER%" echo ^</script^>
>> "%HELPER%" echo ^<script src="js/data-store.js"^>^</script^>
>> "%HELPER%" echo ^<script^>
>> "%HELPER%" echo (function(){
>> "%HELPER%" echo   var status = document.getElementById('status');
>> "%HELPER%" echo   var details = document.getElementById('details');
>> "%HELPER%" echo   try {
>> "%HELPER%" echo     var db = window.US_DATA.reset();
>> "%HELPER%" echo     var alerts = window.US_DATA.listAlerts();
>> "%HELPER%" echo     status.className = 'ok';
>> "%HELPER%" echo     status.textContent = 'Reset complete. Bengaluru dataset is now the normal local app data.';
>> "%HELPER%" echo     details.textContent = JSON.stringify({corridors:db.corridors.length, utilities:db.utilities.length, projects:db.projects.length, contractors:db.contractors.length, activeAlerts:alerts.length}, null, 2);
>> "%HELPER%" echo   } catch (err) {
>> "%HELPER%" echo     status.className = 'bad';
>> "%HELPER%" echo     status.textContent = 'Reset failed: ' + err.message;
>> "%HELPER%" echo     details.textContent = err.stack || String(err);
>> "%HELPER%" echo   }
>> "%HELPER%" echo })();
>> "%HELPER%" echo ^</script^>
>> "%HELPER%" echo ^</body^>
>> "%HELPER%" echo ^</html^>

echo Local reset helper written:
echo   %HELPER%

if "%NO_OPEN%"=="0" (
  echo Opening reset helper in your default browser...
  start "" "%HELPER%"
) else (
  echo Skipped browser launch because --no-open was passed.
)

if "%SEED_DYNAMODB%"=="1" (
  echo.
  echo Seeding DynamoDB from data\seed\*.json...
  python "%ROOT%\scripts\seed_dynamodb.py" --region "%REGION%"
  if errorlevel 1 exit /b 1
)

echo.
echo Reset command finished.
exit /b 0

:help
echo Usage: bin\reset.bat [--force] [--no-open] [--dynamodb] [--region REGION]
echo.
echo   --force      Skip confirmation.
echo   --no-open    Write the local reset helper but do not open it.
echo   --dynamodb   Also run scripts\seed_dynamodb.py.
echo   --region     AWS region for --dynamodb. Default: ap-south-1.
exit /b %HELP_EXIT%
