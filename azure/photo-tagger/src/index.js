import { app } from '@azure/functions';
import Anthropic from '@anthropic-ai/sdk';
import { MODEL, TAG_SCHEMA, SYSTEM_PROMPT, tagsString, tenantOf, buildUserPrompt } from './tagger.js';

// Digital Media library drive. Only photos in this library can be tagged.
const DEFAULT_DRIVE_ID = 'b!nNEymQHH-USapvbmTivj6MUjOnOvRKdGt3tKLEHQKgW6fFNcyMOoR51GxWrNifrc';

let client;
function anthropic() {
  // Reads ANTHROPIC_API_KEY from the Function App's environment variables.
  if (!client) client = new Anthropic();
  return client;
}

const json = (status, body) => ({ status, jsonBody: body });

app.http('tag-photo', {
  methods: ['POST'],
  authLevel: 'anonymous', // access is enforced below with the caller's Microsoft token
  handler: async (request, context) => {
    const allowedTenant = process.env.ALLOWED_TENANT_ID;
    const allowedDrive = process.env.ALLOWED_DRIVE_ID || DEFAULT_DRIVE_ID;
    if (!allowedTenant || !process.env.ANTHROPIC_API_KEY) {
      return json(500, { error: 'The photo tagger is not configured yet (missing ALLOWED_TENANT_ID or ANTHROPIC_API_KEY).' });
    }

    // 1. Caller must send a Microsoft Graph token from the Marlin tenant.
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || tenantOf(token) !== allowedTenant) {
      return json(401, { error: 'Sign in to the OS with your Marlin Microsoft account first.' });
    }

    let body;
    try { body = await request.json(); } catch { return json(400, { error: 'Invalid request body.' }); }
    const { driveId, itemId, name, folderPath } = body || {};
    if (driveId !== allowedDrive) return json(403, { error: 'Only photos in the Digital Media library can be tagged.' });
    if (!/^[A-Za-z0-9!_.-]{1,200}$/.test(String(itemId || ''))) return json(400, { error: 'Invalid photo id.' });

    // 2. Fetch an ~800px thumbnail with the caller's own token. Graph verifies the token here, so a
    //    forged or foreign token fails at this step, and the caller can only tag photos they can see.
    const thumbRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/thumbnails/0/large/content`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (thumbRes.status === 401 || thumbRes.status === 403) return json(401, { error: 'Microsoft rejected your sign-in. Sign out of the OS and back in.' });
    if (!thumbRes.ok) return json(502, { error: `Could not load the photo thumbnail from SharePoint (HTTP ${thumbRes.status}).` });
    const mediaType = (thumbRes.headers.get('content-type') || 'image/jpeg').split(';')[0];
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
      return json(415, { error: `Unsupported thumbnail type ${mediaType}.` });
    }
    const imageData = Buffer.from(await thumbRes.arrayBuffer()).toString('base64');

    // 3. Ask Claude for structured tags.
    let response;
    try {
      response = await anthropic().beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: TAG_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
            { type: 'text', text: buildUserPrompt({ name, folderPath }) },
          ],
        }],
      });
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) return json(429, { error: 'The AI is busy. Wait a minute and try again.' });
      if (error instanceof Anthropic.AuthenticationError) {
        context.error('Anthropic authentication failed: check ANTHROPIC_API_KEY.');
        return json(500, { error: 'The photo tagger’s AI key is invalid. Ask an admin to check ANTHROPIC_API_KEY.' });
      }
      if (error instanceof Anthropic.APIError) {
        context.error(`Anthropic API error ${error.status}: ${error.message}`);
        return json(502, { error: `AI request failed (HTTP ${error.status}).` });
      }
      throw error;
    }

    if (response.stop_reason === 'refusal') return json(422, { error: 'The AI declined to tag this photo. Tag it by hand instead.' });
    if (response.stop_reason === 'max_tokens') return json(502, { error: 'The AI response was cut off. Try again.' });
    const text = response.content.find((b) => b.type === 'text')?.text || '';
    let tags;
    try { tags = JSON.parse(text); } catch {
      context.error('Could not parse model output', text.slice(0, 500));
      return json(502, { error: 'The AI returned an unreadable answer. Try again.' });
    }

    return json(200, {
      tags: tagsString(tags),
      venue: tags.venue,
      scene: tags.scene,
      subjects: tags.subjects,
      setting: tags.setting,
      people: tags.people,
      mood: tags.mood,
      caption: tags.caption,
      suggestedName: tags.suggested_name,
    });
  },
});
