@echo off
chcp 65001 >nul

cls

echo.
echo ===========================================================================
echo                                应用启动脚本
echo ===========================================================================
echo.            
type .\ASCII.txt
echo.
echo.

:: 进入脚本所在目录
cd %~dp0

echo 正在启动应用，请稍候...
cmd /c start /B npm start
echo.
cmd /c node check-service.mjs
echo.
echo [链接] http://localhost:3007
echo 提示：请按住 Ctrl 键并点击以上链接以在浏览器中打开。
echo.
echo 若要退出应用，请关闭此窗口。
echo.
echo ===========================================================================
echo.

pause >nul