@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo BTS WEEK 1-21 AND STUDENT PORTAL LINK PUBLISH
echo ================================================
where git >nul 2>nul || (echo Git not found.& pause & exit /b 1)
if not exist ".git" (
  echo Run this file from your cloned GitHub repository root.
  pause
  exit /b 1
)
git add index.html teacher.html ssc.html cgpsc.html vyapam.html sitemap.xml README_STUDENT_PORTAL_UPDATE.txt DEMO_*.html *demo-test.html
git commit -m "Update student demo portal and login links"
git push origin main
pause
