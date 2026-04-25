@echo off
echo Starting Backend...
start "Backend" cmd /k "cd backend && python app.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo Both servers started!
echo Backend: http://localhost:5000
echo Frontend: Check the terminal for URL
