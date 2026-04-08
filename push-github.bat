@echo off
echo Configurando Git e fazendo push para GitHub...
echo.

echo 1. Inicializando repositorio Git...
git init

echo.
echo 2. Adicionando todos os arquivos...
git add .

echo.
echo 3. Fazendo commit inicial...
git commit -m "Initial commit - FestHaus Game"

echo.
echo 4. Adicionando remote origin...
git remote add origin https://github.com/JeanMaxSKrebs/FestHausGame.git

echo.
echo 5. Renomeando branch para main...
git branch -M main

echo.
echo 6. Fazendo push para o GitHub...
git push -u origin main

echo.
echo Pronto! Verifique seu repositorio em GitHub.
pause
