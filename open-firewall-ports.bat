@echo off
echo Открываем порты 5173 и 3001 для телефона в Wi-Fi...
netsh advfirewall firewall add rule name="3Minutes App 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="3Minutes Signaling 3001" dir=in action=allow protocol=TCP localport=3001
echo.
echo Готово. На телефоне открой: http://192.168.1.13:5173/discover
pause
