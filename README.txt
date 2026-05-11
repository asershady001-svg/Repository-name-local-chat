LOCAL CHAT - README

App name:
Local Chat

Description:
Local Chat is a simple real-time chat application built with Node.js, Express, and Socket.io.

Current status:
- Works locally on laptop.
- Works on phone on the same Wi-Fi network.
- Supports real-time messages.
- Has PWA preparation files:
  - public/manifest.json
  - public/local-chat-icon.svg
  - public/service-worker.js

Technologies:
- Node.js
- Express
- Socket.io
- HTML / CSS / JavaScript

Local run command on Windows PowerShell:
npm.cmd start

Do not use:
npm start

Reason:
PowerShell blocks npm.ps1 on this device.

Local test links:
Laptop:
http://localhost:3000

Phone on same Wi-Fi:
http://192.168.18.18:3000

Important notes:
- The original chat-app folder must not be edited.
- Official development happens only inside chat-app-official.
- Create a backup before any new change.
- The app is not ready for Google Play yet because it still runs locally.
- Before Play Store release, the app needs online hosting, HTTPS, safer login, and final privacy policy URL.

Package name suggested for Android:
com.shady.localchat

Support email:
shlovey1990@gmail.com
