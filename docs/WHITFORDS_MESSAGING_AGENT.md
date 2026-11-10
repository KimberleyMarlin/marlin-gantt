# Whitfords Brewing Co — Facebook & Instagram Messaging Agent

**Status:** Options for review. Nothing set up yet.
**Drafted:** 21 October 2026

Goal: an agent that answers customer DMs on the Whitfords Brewing Co Facebook Page and Instagram account, using the **same knowledge base as the NowBookIt AI agent**. It should handle questions like "what time are you open?", "when can I book?" and "is the kitchen open Monday?".

This is separate from the Hub. It runs inside Meta's inbox, not in `index.html`.

---

## The key principle: one knowledge base

Whatever option is chosen, the answers must come from **one** source. If the NowBookIt agent and the Meta agent each hold their own copy of opening hours, menus and policies, they'll drift apart, and customers will get two different answers.

So option 1 is worth checking first. Copying the knowledge base is only acceptable if someone owns keeping both copies in step.

---

## Options

### 1. Use the NowBookIt agent itself on Messenger / Instagram *(check first)*
Ask NowBookIt whether their AI agent can connect to a **Facebook Page and Instagram inbox** as a channel. Some booking-platform agents can, alongside web chat and phone.

- ✅ Same knowledge base automatically, with nothing duplicated
- ✅ Can likely check live availability and take or hold bookings, which no other option can do natively
- ✅ Likely no extra cost if it's in your current plan
- ❓ Depends entirely on NowBookIt supporting it

**What to ask NowBookIt support:**
> "Can our AI agent for Whitfords Brewing Co respond to Facebook Messenger and Instagram DMs? If not, can we export its knowledge base, or access it through an API?"

### 2. Meta Business Suite's built-in automations *(free, quickest)*
In Meta Business Suite → Inbox → Automations, Meta offers:
- **Instant reply** and **Away message**
- **Frequently asked questions:** tappable buttons with set answers (hours, location, booking link)
- **Keyword replies:** e.g. "book", "hours" or "menu" trigger a set answer
- **Meta's AI-generated replies:** these use your Page and website info. Availability varies by country and account, so check whether it appears under Automations for Whitfords.

- ✅ Free, no code, can be live today
- ✅ Covers most "what time / where / how do I book" traffic
- ❌ The knowledge base is **copied** into Meta, which is a second copy to maintain
- ❌ Can't check live availability. Replies send the NowBookIt booking link instead.

### 3. Custom agent (Meta Messaging API + Claude + the shared knowledge base)
A small always-on service receives DMs from Meta, answers using the knowledge base and replies.

- ✅ Full control over tone, guardrails, hand-off to staff and logging into the Hub
- ✅ Can read the knowledge base from one shared place, if NowBookIt's can be exported or accessed through an API
- ❌ **Costs money:** AI usage is charged per message (small, but not $0), and it needs an always-on endpoint. Cloudflare Workers' free tier would work for hosting; GitHub Actions can't receive messages.
- ❌ **Meta App Review + Business Verification** are required for `pages_messaging` and `instagram_manage_messages`. This takes days to weeks and needs a screencast and a privacy policy.
- ❌ It's the most to build and maintain

### 4. Third-party inbox bot (e.g. ManyChat with AI)
- ✅ No code, has proper Messenger/IG support, with human hand-off built in
- ❌ Monthly subscription
- ❌ The knowledge base is copied again

## Recommendation

1. **Ask NowBookIt first** (option 1). If they support it, it's the clear winner: one knowledge base, and it can actually book.
2. **Meanwhile, switch on option 2 today** for Whitfords: instant reply, FAQs for hours, location, booking link, kitchen times and dogs/kids policy, and keyword replies for "book", "hours" and "menu". It's free, takes about 30 minutes, and handles most DMs straight away.
3. Only consider option 3 if NowBookIt can't do it and the option 2 replies aren't good enough. It's real budget and Meta review time.

## Guardrails (apply to any option)

- **Never confirm a booking in chat** unless the agent is NowBookIt's own and actually creates it. Otherwise always send the NowBookIt link.
- **Hand off to a human** for complaints, refunds, allergies or dietary safety, functions and large groups, lost property, and anything to do with staff.
- **Hours and specials come from one source.** Public holidays and one-off closures are the classic wrong answer, so someone has to update them before the date.
- Responsible service: don't promote excessive drinking. Age-related questions go to a human.
- Tell customers they're talking to an automated assistant, and give them a way to reach a person.

## What's needed from you

1. The **name of the NowBookIt AI product** you're using, and the answer from NowBookIt to the question above.
2. Whether the knowledge base can be **exported** (PDF, doc, or FAQ list). I can turn it into Meta FAQ and keyword replies for option 2.
3. Confirmation that the **Whitfords Facebook Page and Instagram account are both connected** in Business Manager, and that the IG account is a Professional account linked to the Page. Messenger and IG DMs need this to show up in one inbox.
4. The **Whitfords NowBookIt booking link** to use in replies.
