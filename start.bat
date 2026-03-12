@echo off
echo Starting NetLearn local server...
echo.
echo Open your browser and go to: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server when done.
echo.

REM Try Python 3 first
python -m http.server 8080 2>nul
if %errorlevel% neq 0 (
    REM Try py launcher
    py -m http.server 8080 2>nul
    if %errorlevel% neq 0 (
        echo Python not found. Trying alternative...
        REM Try npx serve as fallback
        npx serve -p 8080 . 2>nul
        if %errorlevel% neq 0 (
            echo.
            echo ERROR: Could not start server automatically.
            echo Please install Python from https://python.org
            echo Then run: python -m http.server 8080
            pause
        )
    )
)
pause
