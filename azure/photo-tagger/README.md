# Marlin OS photo tagger (Azure Function)

Tags photos in the SharePoint **Digital Media** library with Claude, for the OS's Photo Tagging page.
It keeps the Anthropic API key out of the public `index.html`.

## How it works

1. The OS sends `POST /api/tag-photo` with `{driveId, itemId, name, folderPath}` and the signed-in
   user's Microsoft Graph token (`Authorization: Bearer …`).
2. The function rejects tokens from any tenant other than `ALLOWED_TENANT_ID` and any library other
   than Digital Media.
3. It fetches an ~800px thumbnail **with the user's own token**. Microsoft checks that token at this
   step, so a forged token fails, and a user can only tag photos they can already open.
4. It asks Claude (`claude-opus-5-5`, low effort, structured JSON output) for venue, scene,
   subjects, setting, people, mood, a caption and a suggested file name.
5. It returns the tags. The OS writes them to the `AITags` column, and renames the file if that
   box is ticked.

The tag word list is in `src/vocabulary.js`. Edit it and redeploy to change tags.

## Settings (Function App → Settings → Environment variables)

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Key from console.anthropic.com → API Keys. Never commit it. |
| `ALLOWED_TENANT_ID` | `cafae2a4-6902-432a-9d2f-914bf980f181` (Marlin's Microsoft tenant) |
| `ALLOWED_DRIVE_ID` | Optional. Defaults to the Digital Media library. |

CORS (Function App → API → CORS): add only the OS's own origin, e.g. `https://<name>.github.io`.

## Deploy or update (Azure Cloud Shell, no local tools needed)

In portal.azure.com, open **Cloud Shell** (the `>_` icon in the top bar), choose **Bash**, then run
this, replacing the two names with yours:

```bash
APP=marlin-os-photos
RG=marlin-os
rm -rf marlin-gantt && git clone --depth 1 https://github.com/KimberleyMarlin/marlin-gantt.git
cd marlin-gantt/azure/photo-tagger && npm ci --omit=dev
zip -qr ../photo-tagger.zip . -x '.gitignore' 'test/*' 'README.md'
az functionapp deployment source config-zip -g "$RG" -n "$APP" --src ../photo-tagger.zip
```

Run the same commands again to deploy any later change.

## Turn it on in the OS

Set `PHOTO_TAGGING_BACKEND_URL` in `index.html` to
`https://<Function App default domain>/api/tag-photo`. The address isn't secret; the key is.

## Tests

```bash
npm install && npm test
```
