<div align="center">

# CCECC  
**Centro Cultural y Educativo Costarricense Chino**

</div>

---

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev

```
then run http://localhost:3000/

This project is built with Next.js using TSX components as the main file structure. It supports three languages—Chinese, Spanish, and English—each of which had to be translated by hand.
As of **08/30/2025**, translations have been contributed as follows:  
- **Chinese**: Steven Yu  
- **Spanish & English**: Jih Bin Luo  

The application uses Supabase as the backend and react-i18next for internationalization. The i18next library provides fast and efficient language switching across the site.

## 🔄 Translation Workflow

To balance speed and accuracy, translations are maintained manually rather than relying solely on machine translation. This requires a larger initial investment in time and effort, as well as collaboration with human translators.

Pros:

- Higher accuracy and cultural appropriateness

- Faster page rendering (no on-demand API translation calls)

- Control over phrasing and consistency across pages

Cons:

- Increased file size due to storing multiple language files

- Manual updates needed whenever content changes

- Requires volunteer translators for continuous maintenance

At present, translations are sustained by volunteers, ensuring the content remains both linguistically accurate and contextually relevant. This collaborative model also reinforces the community-driven mission of CCECC.
The goal of this project is to provide an accessible, multilingual digital platform for the Centro Cultural y Educativo Costarricense Chino (CCECC). By bridging languages and cultures, the platform strengthens educational and cultural ties between Costa Rica and China while maintaining speed, accuracy, and community-driven translation efforts.

Translations are stored as JSON files inside:
- src/locales/en.json
- src/locales/es.json
- src/locales/ch.json


**OR**

- English → en.json
- Spanish → es.json
- Chinese → ch.json


### This is an example of how the code looks like: 
```
{
  Section_Where_It's_Transalted: 
{
    "welcome": "Welcome to CCECC",
    "about": "About Us",
    "contact": "Contact"
}
```

## Golden Rules (Please read!)

** NEVER change the left side (the ID/key).
** Only update the right side (the translated text).

Keep all files using the exact same keys. Do not add, remove, or rename keys unless requested by maintainers.

If you see a raw key on the site like TITLE_CARD_1, it’s wrong—that means the translation is missing or the key is being used incorrectly (see troubleshooting below).
```
Good (✅):

// BEFORE (en.json)
{ "TITLE_CARD_1": "Programs" }

// AFTER (es.json)
{ "TITLE_CARD_1": "Programas" }


Bad (❌):


// BEFORE
//NO CHANGE
{ "TITLE_CARD_1": "Programs" }

//AFTER
// ❌ Key (ID) changed — DO NOT DO THIS
{ "TITLE_CARD_ONE": "Programas" }
```

## How to Contribute

1. Open the appropriate file (en.json, es.json, or ch.json).
2. Find the key and only change the right-hand text.
3. Save the file — with npm run dev running, the site hot-reloads and you’ll see changes immediately.
4. Keep style, punctuation, and placeholders consistent (see below).
5. Submit via Pull Request or send the updated file to the maintainers.

## 🔍 Style & Consistency Checklist

Punctuation & spacing: Match the intent of the original (don’t add extra spaces).

Tone: Keep formal and consistent with the rest of the language.

No embedded HTML unless the original string has it.

Capitalization: Follow the target language’s norms (e.g., sentence case in Spanish).

## 🚑 Troubleshooting: Seeing TITLE_CARD_1 on the page?

If the UI shows a key like TITLE_CARD_1 instead of text:

The key is missing from the locale file you’re viewing.
→ Add that key to the correct *.json file with the proper translation.

The component might be using the wrong key or namespace.
→ Verify the key name exactly matches what’s in the JSON.

The app might be reading the wrong language (toggle language and test again).



