/* Firebase connection details.

   These are NOT secrets. A Firebase web config is meant to ship in the page —
   it identifies the project, it does not grant access. What actually protects
   the chat is two things, and neither of them is this file:

     1. Firebase Authentication — you must sign in with an account the
        Chairman created.
     2. The rules in firestore.rules — they decide, per channel, whose account
        may read and write.

   So this file is safe in the public repo. The passwords are not: they are
   handed out by the Chairman and live nowhere in git, exactly like the
   six-digit report codes in Klever-Access-Codes.txt.

   TO FILL THIS IN:
   Firebase console → Project settings → General → Your apps → Web app.
   Copy the config object it shows you and replace the blanks below.
   Until then CHAT.ready() is false and the chat page says so instead of
   breaking.                                                                 */

const FIREBASE_CONFIG = {
  apiKey:            '',
  authDomain:        '',
  projectId:         '',
  storageBucket:     '',
  messagingSenderId: '',
  appId:             ''
};

/* Accounts are <slug>@KLEVER_DOMAIN. The domain is never emailed to or from —
   it exists only because Firebase email sign-in wants an email shape. Nobody
   types it: the sign-in box asks for a name and a password, and this is added
   behind the scenes. */
const KLEVER_DOMAIN = 'klever.local';
