cd /d "C:\Users\Admin\Desktop\47_SIL_BASTAN_01"
git add src/app/ClientLayout.js src/app/arge/page.js
git commit -m "feat: Ar-Ge and Karargah UI fixes, removed test criteria, added bot chips"
git push origin main
vercel --prod --yes
