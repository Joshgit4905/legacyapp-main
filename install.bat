@echo off
echo ========================================
echo Instalando Dependencias
echo ========================================
echo.

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias de Python...
cd backend
pip install -r requirements.txt

echo.
echo ========================================
echo Instalacion completada!
echo ========================================
echo.
echo Para ejecutar la aplicacion, usa: start.bat
echo.
pause
