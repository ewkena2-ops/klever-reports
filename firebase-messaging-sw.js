/* Klever — phone notifications (Firebase Cloud Messaging).

   A phone shows a notification from a website only through a service worker:
   a small script the browser keeps and wakes when a message arrives, even
   with the site closed. This is that script, and it does nothing else — it
   has no fetch handler, so it never stands between the phone and the site.

   The page registers it (js/fb.js, pushEnable) after the person presses
   "Turn on notifications" and allows them. The script on the server
   (apps-script/Push.js) sends each message with a title, a body and the
   site's address; Firebase shows it here, and a tap opens the site.

   It lives at the site's root on purpose: a service worker can only act for
   the folder it sits in and below.                                          */

importScripts(
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js',
  'js/firebase-config.js'
);

firebase.initializeApp(FIREBASE_CONFIG);
firebase.messaging();
