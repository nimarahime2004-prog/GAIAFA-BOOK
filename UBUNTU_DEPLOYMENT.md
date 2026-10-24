# راهنمای اجرای سامانه روی سرور لینوکس اوبونتو (Ubuntu Linux Guide)

این سامانه به دو روش روی سرور لینوکس اوبونتو قابل اجراست:

---

## روش اول (پیشنهادی / فول‌استک با Nginx و PM2):
اگر مایلید بک‌اند Node.js روی سرور شما اجرا شود و درخواست‌ها از طریق سرور ارسال شوند:

### مرحله ۱: بیلد پروژه
```bash
npm install
npm run build
```

### مرحله ۲: اجرای سرور با PM2
ابتدا مطمئن شوید PM2 نصب است (`npm install -g pm2`):
```bash
# اجرای سرور Node.js روی پورت ۳۰۰۰
pm2 start "npm run dev" --name "book-translator"
# یا در محیط پروداکشن:
pm2 start server.ts --name "book-translator" --interpreter ./node_modules/.bin/tsx
pm2 save
```

### مرحله ۳: تنظیم Nginx در اوبونتو
فایل کانفیگ را باز کنید:
```bash
sudo nano /etc/nginx/sites-available/book-translator
```
محتوای زیر را قرار دهید (توجه کنید مسیر `root` به پوشه `dist` شما اشاره کند):
```nginx
server {
    listen 80;
    server_name your-domain.com; # یا آی‌پی سرور

    root /var/www/book-translator/dist;
    index index.html;
    client_max_body_size 100M;

    # فوروارد مسیر /api به سرور Node.js (برای جلوگیری از خطای HTML 200)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
سپس فعال‌سازی و بارگذاری مجدد Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/book-translator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## روش دوم (فوق سریع / بدون نیاز به اجرای Node.js):
اگر نمی‌خواهید سرویس Node.js را روی اوبونتو در حال اجرا نگه دارید:
1. پروژه را با `npm run build` بیلد بگیرید.
2. پوشه `dist` را روی هر وب‌سروری (Nginx یا آپاچی) قرار دهید.
3. در سامانه، به بخش **«ویرایش سرورها و کلیدهای API»** بروید و حالت اتصال را روی:
   **«مستقیم مرورگر (ویژه خروجی بیلد)»** قرار دهید.
4. کلیدهای API خود را برای سرورهای دلخواه وارد کنید.
5. سیستم بدون وابستگی به هیچ بک‌اندا و بدون خطای ۴۰۴/HTML، مستقیماً از طریق مرورگر به OpenRouter، DeepSeek یا Gemini متصل شده و چرخش و سوئیچ خودکار کلیدها را انجام می‌دهد.
