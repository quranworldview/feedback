# QWV Sabiqun Form
### Ramadan Challenge 2026 — Feedback & Filter Form

A standalone, Firebase-backed feedback form for Qur'an World View. Designed to match Miftah's level of aesthetic quality.

---

## Setup — 10 minutes

### 1. Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use your existing QWV project)
3. Enable **Firestore Database** (Start in test mode)
4. Go to Project Settings → Your Apps → Add Web App
5. Copy the config object

### 2. Add Firebase Config
Open `js/app.js` and replace the `FIREBASE_CONFIG` object:

```js
const FIREBASE_CONFIG = {
  apiKey:            "your-api-key",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId:             "your-app-id"
};
```

### 3. Firestore Rules (for the form collection)
In Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sabiqun_responses/{doc} {
      allow create: if true;   // anyone can submit
      allow read: if false;    // only you via console
    }
  }
}
```

### 4. Deploy to GitHub Pages
1. Create repo: `quranworldview/sabiqun` (or similar)
2. Push this folder
3. Go to Settings → Pages → Source: main branch
4. Your form will be live at: `quranworldview.github.io/sabiqun`

---

## Reading Responses

### In Firebase Console
Firestore → sabiqun_responses → Browse all documents

### Export to Google Sheets
In Firebase Console → Firestore → Export → follow prompts

### Key fields to filter on:
- `q11_readiness` — `absolutely` and `yes_community` are your Sabiquns
- `q12_vision` — length and quality of response is the real test
- `q10_relationship` — honesty and depth
- `time_taken_seconds` — people who take >10min are serious

---

## Customisation

- **Logo**: Replace `icons/logo.png` with your QWV logo
- **Colours**: Edit CSS variables in `css/design.css` (`:root` block)
- **Firebase collection name**: Change `sabiqun_responses` in `js/app.js`
- **Form URL in WhatsApp message**: Use your GitHub Pages URL

---

*Qur'an World View · Ramadan 1447 · Built with sincerity*
