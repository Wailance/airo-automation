# Страница записи AIRO

Статическая страница для GitHub Pages. Даты и время отображаются локально, а готовая заявка отправляется через Google Apps Script.

## Перед публикацией

1. В `app.js` замените `PASTE_APPS_SCRIPT_EXEC_URL_HERE` на URL deployment Apps Script, который заканчивается на `/exec`.
2. В Apps Script обновите код из `Desktop/airo-automation/infra/google-apps-script/Code.gs`.
3. Опубликуйте проект на GitHub Pages.
4. Проверьте тестовую запись с телефона и убедитесь, что она появилась в листе `Bookings`.

Секретный `API_TOKEN` не добавляется в страницу.
