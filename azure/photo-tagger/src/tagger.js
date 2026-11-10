import { VENUES, SCENES, PREFERRED_SUBJECTS, MOODS } from './vocabulary.js';

export const MODEL = 'claude-opus-5-5';

const VENUE_CODES = [...Object.keys(VENUES), 'unknown'];

// JSON schema for structured output — every field required, no extras.
export const TAG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['venue', 'scene', 'subjects', 'setting', 'people', 'mood', 'caption', 'suggested_name'],
  properties: {
    venue: { type: 'string', enum: VENUE_CODES },
    scene: { type: 'string', enum: SCENES },
    subjects: { type: 'array', items: { type: 'string' } },
    setting: { type: 'string', enum: ['indoor', 'outdoor', 'unknown'] },
    people: { type: 'string', enum: ['none', 'one', 'couple', 'group', 'crowd'] },
    mood: { type: 'array', items: { type: 'string', enum: MOODS } },
    caption: { type: 'string' },
    suggested_name: { type: 'string' },
  },
};

export const SYSTEM_PROMPT = `You tag photos for the Marlin Group's marketing photo library. Marlin runs these hospitality venues (code: name):
${Object.entries(VENUES).map(([c, n]) => `- ${c}: ${n}`).join('\n')}

Tags are used to search the library (for example "WBC beer" or "Ravenswood live music"), so accuracy matters more than coverage.

- venue: use the folder path and file name hints you are given, plus any visible signage or branding. Use "unknown" unless you have real evidence; never guess from the type of venue alone.
- scene: the single main subject of the photo.
- subjects: 2-8 short lowercase tags for what is clearly visible. Prefer these words where they fit: ${PREFERRED_SUBJECTS.join(', ')}. Add other specific items only when you are confident. If you can't tell exactly what a dish or drink is (for example beef vs chicken), use the general word ("skewers", "beer") rather than guessing.
- mood: 0-3 values.
- caption: one plain sentence, under 20 words, suitable as image alt text. No marketing language.
- suggested_name: a file name stem in the form VENUE_scene_subject-subject, lowercase except the venue code, words joined with hyphens, no extension (for example "WBC_drink_beer-tasting-paddle"). Use "MARLIN" when the venue is unknown.`;

// Build the comma-separated AITags string the OS searches on.
export function tagsString(t) {
  const parts = [
    t.venue !== 'unknown' ? t.venue : null,
    t.venue !== 'unknown' ? VENUES[t.venue] : null,
    t.scene,
    ...(t.subjects || []),
    t.setting !== 'unknown' ? t.setting : null,
    t.people !== 'none' ? t.people : null,
    ...(t.mood || []),
  ];
  const seen = new Set();
  return parts
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter((p) => p && !seen.has(p.toLowerCase()) && seen.add(p.toLowerCase()))
    .join(', ');
}

// Tenant id from a Microsoft access token. Only trusted after Graph has accepted the same token
// (see index.js), because Graph is what verifies the signature.
export function tenantOf(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'));
    return payload.tid || null;
  } catch {
    return null;
  }
}

export function buildUserPrompt({ name, folderPath }) {
  return `File name: ${name || '(unknown)'}\nFolder path: ${folderPath || '(unknown)'}\nTag this photo.`;
}
