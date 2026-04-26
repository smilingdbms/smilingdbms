@echo off
echo ========================================================
echo  RecruitBase Pro — Pending User Fix v1.0
echo  1. Login blocks pending users
echo  2. Admin page shows Pending + Approve button
echo ========================================================
echo.

set PRJ=C:\Users\Pravin\OneDrive\Desktop\DBMS Folder\smilingdbms_project\smilingdbms

echo Step 1: Copying updated login page...
copy /y "%~dp0index.tsx" "%PRJ%\pages\index.tsx"
echo Done.

echo.
echo Step 2: Patching admin page for pending/approve...
cd /d "%PRJ%"
node "%~dp0fix_admin_pending.js"

echo.
echo Step 3: Deploying...
call npx vercel --prod

echo.
echo ========================================================
echo  DEPLOYED! Pending User Handling Active:
echo  - Pending user tries login → "Pending approval" message
echo  - Admin page shows Pending badge + Approve button
echo  - Account Owner clicks Approve → user becomes active
echo ========================================================
pause
