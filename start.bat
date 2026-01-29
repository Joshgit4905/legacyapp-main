@echo off
echo ========================================
echo Task Manager - Instalacion y Ejecucion
echo ========================================
echo.

echo [1/4] Activando entorno virtual...
call venv\Scripts\activate.bat

echo [2/4] Instalando dependencias...
cd backend
pip install -r requirements.txt

echo [3/4] Verificando MongoDB...
echo IMPORTANTE: Asegurate de que MongoDB este ejecutandose
echo - MongoDB local: mongodb://localhost:27017
echo - O usa MongoDB Atlas (cloud)
echo.
pause

echo [4/4] Iniciando servidor...
echo.
echo La aplicacion estara disponible en:
echo   Frontend: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Usuario por defecto: admin / admin
echo.
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
