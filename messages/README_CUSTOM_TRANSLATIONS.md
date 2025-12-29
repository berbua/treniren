# Custom Polish Translations

## Overview

This directory contains translation files for the application. The `pl-custom.json` file is a special file that allows you to override standard Polish translations with custom/informal versions.

## File Structure

- `en.json` - English translations (can be modified by agent)
- `pl.json` - Standard Polish translations (can be modified by agent)
- `pl-custom.json` - **Custom Polish translations (USER ONLY - protected from agent)**

## How Custom Translations Work

1. **Precedence**: Translations in `pl-custom.json` override corresponding keys in `pl.json`
2. **Deep Merge**: The system performs a deep merge, so you only need to define the keys you want to override
3. **Protection**: The file is listed in `.cursorignore` to prevent AI agents from modifying it

## Usage Example

To override the "save" button text with an informal version:

**In `pl.json` (standard):**
```json
{
  "common": {
    "save": "Zapisz"
  }
}
```

**In `pl-custom.json` (custom):**
```json
{
  "common": {
    "save": "Zapisz (nieformalnie)"
  }
}
```

Result: The app will display "Zapisz (nieformalnie)" instead of "Zapisz"

## Adding Custom Translations

1. Open `messages/pl-custom.json`
2. Add your custom translations following the same structure as `pl.json`
3. Only include the keys you want to override
4. Save the file - changes take effect immediately (may need page refresh)

## Example Structure

```json
{
  "common": {
    "save": "Zapisz (custom)",
    "cancel": "Anuluj (custom)"
  },
  "nav": {
    "home": "Strona główna (custom)"
  }
}
```

## Important Notes

- ✅ **Safe to edit**: This file is protected and will not be modified by AI agents
- ✅ **Override only**: You only need to define keys you want to change
- ✅ **Deep merge**: Nested objects are merged, not replaced
- ⚠️ **File structure**: Keep the same structure as `pl.json` for consistency
- ⚠️ **Comments**: The `_comment`, `_instructions`, etc. fields are ignored by the system

## Troubleshooting

**Custom translations not working?**
- Check that the JSON syntax is valid
- Ensure the key path matches exactly (case-sensitive)
- Try refreshing the page
- Check browser console for errors

**Want to revert a custom translation?**
- Simply remove the key from `pl-custom.json`
- The standard translation from `pl.json` will be used

## Protection

This file is protected by:
- `.cursorignore` - Prevents Cursor AI from seeing/modifying the file
- Documentation - Clear instructions that this is user-only

If you need to share custom translations with others, you can commit this file to git. Otherwise, you can add it to `.gitignore` to keep it local.

