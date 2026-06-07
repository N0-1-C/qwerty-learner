@echo off
chcp 65001 >nul
title Qwerty Learner - 启动项目

echo ========================================
echo     Qwerty Learner 项目启动脚本
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js！
    echo 请先访问 https://nodejs.org/ 安装 Node.js 18+
    echo.
    pause
    exit /b 1
)

echo [OK] 检测到 Node.js
node -v

:: 检查 node_modules
if not exist "node_modules" (
    echo.
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 依赖安装失败！
        pause
        exit /b 1
    )
)

echo.
echo [OK] 依赖检查完成
echo.
echo ========================================
echo     正在启动开发服务器...
echo     请等待浏览器自动打开
echo     或手动访问: http://localhost:5173/
echo ========================================
echo.

:: 启动项目
npm run dev

pause
