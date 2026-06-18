import "dotenv/config";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { serve } from "@hono/node-server";
import WebSocket from "ws";
import { applyGainToUlaw } from "./ulaw";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable");
  process.exit(1);
}

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
  console.warn("Missing PERPLEXITY_API_KEY — web search will be unavailable");
}

const REMINDERS_API_URL = process.env.REMINDERS_API_URL ?? "http://localhost:3004";
const MEMORY_API_URL = process.env.MEMORY_API_URL ?? "http://localhost:3001";
const USERDATA_API_URL = process.env.USERDATA_API_URL ?? "http://localhost:3002";

const SYSTEM_INSTRUCTIONS = `You are Nelson, a warm, patient, and reliable AI voice assistant designed specifically for elderly people in Bulgaria. They are calling you from a standard telephone.

CORE RULES:
1. LANGUAGE: You must speak ONLY in natural, fluent Bulgarian. Use the polite/respectful form ("Вие").
2. BREVITY (CRITICAL): Keep your responses extremely short—ideally 1 to 2 short sentences. Speak like a human in a real phone conversation. Do not overwhelm the caller with information. Pause and wait for them to reply.
3. TONE: Be compassionate, reassuring, and clear. Act like a trusted family friend. Never use technical jargon (never say "AI", "database", "prompt", or "system").
4. NO FORMATTING: Never use markdown, asterisks (*), hashtags (#), or bullet points. Write numbers and acronyms in a way that is easy to read aloud.

YOUR CAPABILITIES & TOOLS:
- REMINDERS: If the caller asks you to remind them of something (e.g., taking medicine, feeding the dog, a doctor's appointment), immediately use the "create_reminder" tool. You must determine the appropriate startTime and endTime from the conversation context.
- MEMORY: If they tell you a fact about themselves (e.g., "My doctor is Dr. Petrov" or "My knee hurts today"), acknowledge it warmly and use the "save_memory" tool to save it.
- PROFILE: At the START of each conversation, use the "get_user_profile" tool to load the caller's saved memories and upcoming reminders. Use this context to personalize the conversation.
- WEB SEARCH: If the caller asks a factual question you are unsure about (general knowledge), use the "web_search" tool to find the answer. Summarize the result in 1-2 short sentences.
- WEATHER: For any weather question, use the "get_weather" tool. If they don't name a place, pass the town from their saved profile. Read the temperature and conditions aloud simply.
- NEWS: When they ask what's happening or for the news, use the "get_news" tool and read 2-3 short headlines.
- FAMILY: To pass a message to a relative, use "notify_family" with their saved contacts. Always confirm WHO and WHAT before sending, and tell them once it's done.
- MEDICATIONS: When they mention a medicine they take, save it with "add_medication". Use "list_medications" to read their medicines back. You may also offer to set a reminder for the dose.
- MANAGE REMINDERS: Use "list_reminders" to tell them what's coming up, and "cancel_reminder" to remove one (call list_reminders first to find the right id).
- CORRECT OR FORGET: Use "update_memory" to change a saved detail, and "delete_memory" when they ask you to forget something.

IMPORTANT RULES:
- The caller is on a phone and CANNOT visit websites, check links, or look things up themselves. You must ALWAYS give a complete answer with all the details they need (times, dates, names, numbers). NEVER say "check the website" or "you can find it at...".
- When asked about Bulgarian train schedules or timetables, search for "БДЖ разписание" along with the specific route. Give the exact departure and arrival times.

NEW CALLERS:
- When "get_user_profile" returns "isNewUser": true, this is someone calling for the first time.
- Greet them warmly, introduce yourself, and ask for their name: "Здравейте, аз съм Нелсън. Не мисля, че сме се запознавали. Как се казвате?"
- Once they give their name, immediately use "register_user" to create their profile. Then continue the conversation naturally.

VOLUME CONTROL:
- You have a tool "adjust_volume" that controls how loud your voice is on a 0-10 scale (5 = normal, 0 = muted, 10 = maximum).
- Your current volume level is 5 (normal) at the start of each call.
- If the user says anything like "Не те чувам", "Говори по-силно", "По-високо", "Louder", or "I can't hear you", IMMEDIATELY call adjust_volume with a level 2 higher than the current level.
- If the user says anything like "Много силно", "По-тихо", "Намали", "Quiet down", or "Too loud", IMMEDIATELY call adjust_volume with a level 2 lower than the current level.
- After adjusting, briefly confirm: "Добре, усилих/намалих звука."

CONVERSATION START:
When the user connects, first call "get_user_profile" to load their data. If they are a returning user, greet them by name: "Здравейте, [име]! Как мога да ви помогна днес?" If they are new, follow the NEW CALLERS instructions above.`;

const TOOLS = [
  {
    type: "function" as const,
    name: "create_reminder",
    description: "Create a reminder for the user. Determine the appropriate startTime and endTime from the conversation.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "What to remind about" },
        startTime: { type: "string", description: "When the reminder should fire (ISO 8601)" },
        endTime: { type: "string", description: "When the reminder period ends (ISO 8601). Can be the same as startTime for one-time reminders." },
        description: { type: "string", description: "Additional details about the reminder" },
      },
      required: ["title", "startTime", "endTime"],
    },
  },
  {
    type: "function" as const,
    name: "save_memory",
    description: "Save a fact about the user to their profile for future reference",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Short label for the memory (e.g., 'doctor_name', 'favorite_food', 'health_note')" },
        value: { type: "string", description: "The value to remember" },
      },
      required: ["key", "value"],
    },
  },
  {
    type: "function" as const,
    name: "get_user_profile",
    description: "Load the caller's saved memories and upcoming reminders to personalize the conversation. Call this at the start of each conversation. Returns isNewUser: true if this phone number has never called before.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    type: "function" as const,
    name: "register_user",
    description: "Register a new caller after asking for their name. Only use this when get_user_profile returned isNewUser: true.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "The caller's name" },
      },
      required: ["name"],
    },
  },
  {
    type: "function" as const,
    name: "web_search",
    description:
      "Search the web for current information (news, weather, facts, etc.)",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
      },
      required: ["query"],
    },
  },
  {
    type: "function" as const,
    name: "get_weather",
    description:
      "Get the current weather and a short forecast for a place. Use this whenever the caller asks about the weather. If they don't name a place, pass their known city/town.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City or town in Bulgaria (e.g. 'София', 'Пловдив'). Optional.",
        },
      },
    },
  },
  {
    type: "function" as const,
    name: "get_news",
    description:
      "Get the top current news headlines (default: Bulgaria). Use when the caller asks what's happening / for the news.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Optional topic to focus on (e.g. 'спорт', 'времето', a town).",
        },
      },
    },
  },
  {
    type: "function" as const,
    name: "notify_family",
    description:
      "Send a message to one of the caller's saved family contacts, by SMS or by an automated voice call. Use when the caller asks you to tell/call/message a relative (e.g. their son or daughter).",
    parameters: {
      type: "object",
      properties: {
        contactName: {
          type: "string",
          description: "Name or role of the contact to reach (e.g. 'Иван', 'син', 'дъщеря'). Optional if they only have one contact.",
        },
        message: { type: "string", description: "The message to deliver, in Bulgarian." },
        method: {
          type: "string",
          enum: ["sms", "call"],
          description: "How to reach them. Default 'sms'.",
        },
      },
      required: ["message"],
    },
  },
  {
    type: "function" as const,
    name: "add_medication",
    description:
      "Save a medication and its schedule to the caller's profile. Use when they mention a medicine they take.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Medication name." },
        schedule: { type: "string", description: "When/how often to take it (e.g. 'всяка сутрин', '2 пъти на ден')." },
      },
      required: ["name"],
    },
  },
  {
    type: "function" as const,
    name: "list_medications",
    description: "List the medications saved on the caller's profile.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "list_reminders",
    description:
      "List the caller's upcoming reminders. Call this before cancelling a reminder so you know its id and title.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function" as const,
    name: "cancel_reminder",
    description:
      "Cancel/delete a reminder by its id. First use list_reminders to find the matching id from the caller's description.",
    parameters: {
      type: "object",
      properties: {
        reminderId: { type: "string", description: "The id of the reminder to cancel." },
      },
      required: ["reminderId"],
    },
  },
  {
    type: "function" as const,
    name: "update_memory",
    description:
      "Update an existing saved fact about the caller (by its key) with a new value. Use when a previously saved detail has changed.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "The key of the memory to update (as used in save_memory)." },
        value: { type: "string", description: "The new value." },
      },
      required: ["key", "value"],
    },
  },
  {
    type: "function" as const,
    name: "delete_memory",
    description:
      "Delete a saved fact about the caller by its key. Use when the caller asks you to forget something.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "The key of the memory to delete." },
      },
      required: ["key"],
    },
  },
  {
    type: "function" as const,
    name: "adjust_volume",
    description:
      "Adjust the volume (loudness) of your voice output on a 0-10 scale. 0 = muted, 5 = normal (default), 10 = maximum loudness. Call this when the user asks you to speak louder or quieter.",
    parameters: {
      type: "object",
      properties: {
        level: {
          type: "number",
          description: "Volume level from 0 (muted) to 10 (max). Default is 5.",
        },
      },
      required: ["level"],
    },
  },
];

async function searchWeb(query: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    return "Търсенето в интернет не е налично в момента.";
  }
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: query }],
      }),
    });
    if (!res.ok) {
      console.error(`Perplexity API error: ${res.status} ${res.statusText}`);
      return "Не успях да намеря информация в момента.";
    }
    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content ?? "";

    console.log(answer);

    return answer || "Не бяха намерени резултати.";
  } catch (err) {
    console.error("Perplexity search failed:", err);
    return "Не успях да направя търсене в момента.";
  }
}

async function createReminder(userId: string, args: { title: string; startTime: string; endTime: string; description?: string }): Promise<string> {
  try {
    const res = await fetch(`${REMINDERS_API_URL}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: args.title,
        startTime: args.startTime,
        endTime: args.endTime,
        description: args.description,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`Reminders API error: ${res.status} ${text}`);
      return JSON.stringify({ success: false, error: "Не успях да създам напомнянето." });
    }
    const data = await res.json();
    return JSON.stringify({ success: true, reminder: data });
  } catch (err) {
    console.error("Create reminder failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да създам напомнянето." });
  }
}

async function saveMemory(userId: string, key: string, value: string): Promise<string> {
  try {
    const res = await fetch(`${MEMORY_API_URL}/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, key, value }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`Memory API error: ${res.status} ${text}`);
      return JSON.stringify({ success: false, error: "Не успях да запазя информацията." });
    }
    const data = await res.json();
    return JSON.stringify({ success: true, memory: data });
  } catch (err) {
    console.error("Save memory failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да запазя информацията." });
  }
}

async function getUserProfile(userId: string): Promise<string> {
  try {
    // Check if user exists in UserData API
    const userDataRes = await fetch(
      `${USERDATA_API_URL}/userMemory/${encodeURIComponent(userId)}`
    ).catch(() => null);

    const userRefs = userDataRes?.ok ? await userDataRes.json() : [];
    const isNewUser = !Array.isArray(userRefs) || userRefs.length === 0;

    if (isNewUser) {
      console.log(`New caller: ${userId}`);
      return JSON.stringify({ userId, isNewUser: true, memories: [], reminders: [] });
    }

    // Existing user — load their data
    const [memoriesRes, remindersRes] = await Promise.all([
      fetch(`${MEMORY_API_URL}/memories?userId=${encodeURIComponent(userId)}`).catch(() => null),
      fetch(`${REMINDERS_API_URL}/reminders?userId=${encodeURIComponent(userId)}`).catch(() => null),
    ]);

    const memories = memoriesRes?.ok ? await memoriesRes.json() : [];
    const reminders = remindersRes?.ok ? await remindersRes.json() : [];

    // Get user name from profile
    let name: string | undefined;
    try {
      const profileRes = await fetch(`${USERDATA_API_URL}/userData/${encodeURIComponent(userRefs[0]._id)}`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        name = profile.name;
      }
    } catch { /* ignore */ }

    return JSON.stringify({ userId, isNewUser: false, name, memories, reminders });
  } catch (err) {
    console.error("Get user profile failed:", err);
    return JSON.stringify({ userId, isNewUser: false, memories: [], reminders: [] });
  }
}

async function registerUser(userId: string, name: string): Promise<string> {
  try {
    const res = await fetch(`${USERDATA_API_URL}/userData`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: userId,
        password: "auto-registered",
        name,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`UserData API error: ${res.status} ${text}`);
      return JSON.stringify({ success: false, error: "Не успях да запазя профила." });
    }
    const data = await res.json();
    console.log(`Registered new user: ${name} (${userId})`);
    return JSON.stringify({ success: true, name: data.name, userId });
  } catch (err) {
    console.error("Register user failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да запазя профила." });
  }
}

// Short Bulgarian descriptions for WMO weather codes returned by Open-Meteo.
const WEATHER_CODES: Record<number, string> = {
  0: "ясно",
  1: "предимно ясно",
  2: "разкъсана облачност",
  3: "облачно",
  45: "мъгла",
  48: "мъгла",
  51: "лек ръмеж",
  53: "ръмеж",
  55: "силен ръмеж",
  56: "заледяващ ръмеж",
  57: "заледяващ ръмеж",
  61: "слаб дъжд",
  63: "дъжд",
  65: "силен дъжд",
  66: "заледяващ дъжд",
  67: "заледяващ дъжд",
  71: "слаб сняг",
  73: "сняг",
  75: "силен сняг",
  77: "снежни зърна",
  80: "превалявания",
  81: "превалявания",
  82: "силни превалявания",
  85: "снежни превалявания",
  86: "снежни превалявания",
  95: "гръмотевична буря",
  96: "буря с градушка",
  99: "буря с градушка",
};

async function getWeather(location?: string): Promise<string> {
  const place = (location ?? "").trim() || "София";
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=bg&format=json`,
    );
    const geo = await geoRes.json();
    const first = geo?.results?.[0];
    if (!first) {
      return JSON.stringify({ success: false, error: `Не намерих населено място "${place}".` });
    }
    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${first.latitude}&longitude=${first.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
    );
    const w = await wRes.json();
    const code = Number(w?.current?.weather_code);
    return JSON.stringify({
      success: true,
      location: first.name,
      temperatureC: Math.round(Number(w?.current?.temperature_2m)),
      description: WEATHER_CODES[code] ?? "променливо",
      highC: Math.round(Number(w?.daily?.temperature_2m_max?.[0])),
      lowC: Math.round(Number(w?.daily?.temperature_2m_min?.[0])),
    });
  } catch (err) {
    console.error("Weather lookup failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да взема прогнозата за времето." });
  }
}

async function getNews(topic?: string): Promise<string> {
  const focus = (topic ?? "").trim();
  const query = focus
    ? `Дай ми трите най-важни новини в България днес по темата "${focus}". Само кратки заглавия, без линкове.`
    : `Дай ми трите най-важни новини в България днес. Само кратки заглавия, без линкове.`;
  const answer = await searchWeb(query);
  return JSON.stringify({ success: true, headlines: answer });
}

async function notifyFamily(
  userId: string,
  args: { contactName?: string; message: string; method?: string },
): Promise<string> {
  try {
    const res = await fetch(`${USERDATA_API_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: userId,
        contactName: args.contactName,
        message: args.message,
        method: args.method,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return JSON.stringify({
        success: false,
        error: data?.error ?? "Не успях да изпратя съобщението.",
        ...(data?.available ? { available: data.available } : {}),
      });
    }
    return JSON.stringify({ success: true, ...data });
  } catch (err) {
    console.error("Notify family failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да се свържа с близкия." });
  }
}

async function addMedication(
  userId: string,
  args: { name: string; schedule?: string },
): Promise<string> {
  try {
    const res = await fetch(`${USERDATA_API_URL}/medications/${encodeURIComponent(userId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: args.name, schedule: args.schedule ?? "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return JSON.stringify({ success: false, error: data?.error ?? "Не успях да запазя лекарството." });
    }
    return JSON.stringify({ success: true, medication: data?.medication });
  } catch (err) {
    console.error("Add medication failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да запазя лекарството." });
  }
}

async function listMedications(userId: string): Promise<string> {
  try {
    const res = await fetch(`${USERDATA_API_URL}/medications/${encodeURIComponent(userId)}`);
    if (!res.ok) return JSON.stringify({ success: false, error: "Не успях да заредя лекарствата." });
    const medications = await res.json();
    return JSON.stringify({ success: true, medications });
  } catch (err) {
    console.error("List medications failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да заредя лекарствата." });
  }
}

async function listRemindersTool(userId: string): Promise<string> {
  try {
    const res = await fetch(`${REMINDERS_API_URL}/reminders?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return JSON.stringify({ success: false, error: "Не успях да заредя напомнянията." });
    const reminders = await res.json();
    return JSON.stringify({ success: true, reminders });
  } catch (err) {
    console.error("List reminders failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да заредя напомнянията." });
  }
}

async function cancelReminder(reminderId: string): Promise<string> {
  try {
    const res = await fetch(`${REMINDERS_API_URL}/reminders/${encodeURIComponent(reminderId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      return JSON.stringify({ success: false, error: "Не успях да премахна напомнянето." });
    }
    return JSON.stringify({ success: true });
  } catch (err) {
    console.error("Cancel reminder failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да премахна напомнянето." });
  }
}

async function updateMemory(userId: string, key: string, value: string): Promise<string> {
  try {
    const res = await fetch(`${MEMORY_API_URL}/memories/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, value }),
    });
    if (!res.ok) {
      return JSON.stringify({ success: false, error: "Не намерих тази информация, за да я обновя." });
    }
    const memory = await res.json();
    return JSON.stringify({ success: true, memory });
  } catch (err) {
    console.error("Update memory failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да обновя информацията." });
  }
}

async function deleteMemory(userId: string, key: string): Promise<string> {
  try {
    const res = await fetch(
      `${MEMORY_API_URL}/memories/${encodeURIComponent(key)}?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      return JSON.stringify({ success: false, error: "Не успях да изтрия информацията." });
    }
    const data = await res.json();
    return JSON.stringify({ success: true, deletedCount: data?.deletedCount ?? 0 });
  } catch (err) {
    console.error("Delete memory failed:", err);
    return JSON.stringify({ success: false, error: "Не успях да изтрия информацията." });
  }
}

/** Map 0–10 volume level to a gain multiplier: 0→0.0, 5→1.0, 10→2.0 */
function volumeToGain(level: number): number {
  const clamped = Math.max(0, Math.min(10, level));
  return clamped / 5;
}

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Twilio webhook for outbound reminder calls — returns TwiML to connect to media stream with reminder context
app.post("/reminder-callback", async (c) => {
  const url = new URL(c.req.url);
  const reminderId = url.searchParams.get("reminderId") ?? "";
  const callerPhone = url.searchParams.get("callerPhone") ?? "unknown";
  const reminderTitle = url.searchParams.get("reminderTitle") ?? "";
  console.log(`Reminder callback: ${reminderId} for ${callerPhone} — "${reminderTitle}"`);

  const host = c.req.header("Host") ?? "localhost:3000";
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${host}/media-stream">
      <Parameter name="callerPhone" value="${callerPhone}"/>
      <Parameter name="reminderId" value="${reminderId}"/>
      <Parameter name="reminderTitle" value="${reminderTitle}"/>
    </Stream>
  </Connect>
</Response>`;
  return c.text(twiml, 200, { "Content-Type": "text/xml" });
});

// Twilio webhook — returns TwiML to connect the call to a media stream
app.post("/incoming-call", async (c) => {
  const body = await c.req.parseBody();
  const from = body["From"] ?? "unknown";
  const to = body["To"] ?? "unknown";
  console.log(`Incoming call from ${from} to ${to}`);
  const host = c.req.header("Host") ?? "localhost:3000";
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${host}/media-stream">
      <Parameter name="callerPhone" value="${String(from)}"/>
    </Stream>
  </Connect>
</Response>`;
  return c.text(twiml, 200, { "Content-Type": "text/xml" });
});

// WebSocket endpoint for Twilio media stream
app.get(
  "/media-stream",
  upgradeWebSocket((c) => {
    let callerPhone = "unknown";
    let reminderId: string | null = null;
    let reminderTitle: string | null = null;
    let callEventId: string | null = null;
    let callStartedAt: Date | null = null;

    let openaiWs: WebSocket | null = null;
    let streamSid: string | null = null;
    let lastAssistantItemId: string | null = null;
    const markQueue: string[] = [];

    let currentVolumeLevel = 5;
    let currentGain = 1.0;

    function getInstructions(): string {
      if (reminderId && reminderTitle) {
        return `You are Nelson, a warm, patient, and reliable AI voice assistant designed specifically for elderly people in Bulgaria. You are making an OUTBOUND call to remind the user about something.

CORE RULES:
1. LANGUAGE: You must speak ONLY in natural, fluent Bulgarian. Use the polite/respectful form ("Вие").
2. BREVITY (CRITICAL): Keep your responses extremely short—ideally 1 to 2 short sentences.
3. TONE: Be compassionate, reassuring, and clear. Act like a trusted family friend. Never use technical jargon.
4. NO FORMATTING: Never use markdown, asterisks (*), hashtags (#), or bullet points.

THIS IS A REMINDER CALL:
- You are calling the user to remind them about: "${reminderTitle}"
- Start the call by greeting them and immediately telling them the reminder: "Здравейте! Обаждам се да ви напомня: ${reminderTitle}."
- After delivering the reminder, ask if they need anything else.
- If they don't need anything, say goodbye warmly and end naturally.
- Keep the call short — the purpose is just the reminder.

YOUR CAPABILITIES & TOOLS:
- PROFILE: Use "get_user_profile" to load the caller's name and personalize the greeting.
- REMINDERS: If they ask for a new reminder during the call, use "create_reminder". Use "list_reminders" / "cancel_reminder" to read or remove existing ones.
- MEMORY: If they tell you a fact, use "save_memory". Use "update_memory" / "delete_memory" to change or forget a saved detail.
- WEATHER & NEWS: Use "get_weather" for the weather and "get_news" for the news.
- FAMILY: Use "notify_family" to message or call one of their saved relatives (confirm who and what first).
- MEDICATIONS: Use "add_medication" / "list_medications" for their medicines.
- WEB SEARCH: If they ask a general factual question, use "web_search".

VOLUME CONTROL:
- You have a tool "adjust_volume" that controls how loud your voice is on a 0-10 scale (5 = normal, 0 = muted, 10 = maximum).
- If the user says they can't hear you or asks you to speak louder, call adjust_volume with a level 2 higher than current.
- If the user says you're too loud, call adjust_volume with a level 2 lower than current.

IMPORTANT: The caller is on a phone and CANNOT visit websites. Always give complete answers.`;
      }
      return SYSTEM_INSTRUCTIONS;
    }

    function openOpenAI(twilioWs: { send: (data: string) => void }) {
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-realtime",
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      ws.on("open", () => {
        console.log("Connected to OpenAI Realtime API");
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              type: "realtime",
              model: "gpt-realtime",
              output_modalities: ["audio"],
              audio: {
                input: {
                  format: { type: "audio/pcmu" },
                  turn_detection: { type: "server_vad" },
                },
                output: {
                  format: { type: "audio/pcmu" },
                  voice: "cedar",
                },
              },
              instructions: getInstructions(),
              tools: TOOLS,
            },
          })
        );
        // Trigger the initial greeting immediately
        ws.send(JSON.stringify({ type: "response.create" }));
      });

      ws.on("message", (raw) => {
        const data = JSON.parse(raw.toString());

        switch (data.type) {
          case "response.output_audio.delta":
            if (streamSid && data.delta) {
              const payload = currentGain === 1.0
                ? data.delta
                : applyGainToUlaw(data.delta, currentGain);
              twilioWs.send(
                JSON.stringify({
                  event: "media",
                  streamSid,
                  media: { payload },
                })
              );
              if (data.item_id) {
                lastAssistantItemId = data.item_id;
              }
            }
            break;

          case "response.output_audio.done":
            if (streamSid) {
              const markLabel = `audio-done-${Date.now()}`;
              markQueue.push(markLabel);
              twilioWs.send(
                JSON.stringify({
                  event: "mark",
                  streamSid,
                  mark: { name: markLabel },
                })
              );
            }
            break;

          case "input_audio_buffer.speech_started":
            // User started speaking — interrupt any playing audio
            if (streamSid) {
              twilioWs.send(
                JSON.stringify({ event: "clear", streamSid })
              );
              if (lastAssistantItemId) {
                ws.send(
                  JSON.stringify({
                    type: "conversation.item.truncate",
                    item_id: lastAssistantItemId,
                    content_index: 0,
                    audio_end_ms: 0,
                  })
                );
              }
            }
            markQueue.length = 0;
            lastAssistantItemId = null;
            break;

          case "response.function_call_arguments.done": {
            console.log(
              `Tool call: ${data.name}(${data.arguments})`
            );
            const callId = data.call_id;
            const args = JSON.parse(data.arguments);

            const handleToolResult = (output: string) => {
              ws.send(
                JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output,
                  },
                })
              );
              ws.send(JSON.stringify({ type: "response.create" }));
            };

            if (data.name === "adjust_volume") {
              const level = Math.max(0, Math.min(10, Math.round(Number(args.level) || 5)));
              currentVolumeLevel = level;
              currentGain = volumeToGain(level);
              console.log(`[Volume] Set to ${level}/10 (gain: ${currentGain.toFixed(2)}x)`);
              handleToolResult(
                JSON.stringify({ success: true, level: currentVolumeLevel, gain: currentGain })
              );
            } else if (data.name === "web_search") {
              searchWeb(args.query).then(handleToolResult);
            } else if (data.name === "get_weather") {
              getWeather(args.location).then(handleToolResult);
            } else if (data.name === "get_news") {
              getNews(args.topic).then(handleToolResult);
            } else if (data.name === "notify_family") {
              notifyFamily(callerPhone, args).then(handleToolResult);
            } else if (data.name === "add_medication") {
              addMedication(callerPhone, args).then(handleToolResult);
            } else if (data.name === "list_medications") {
              listMedications(callerPhone).then(handleToolResult);
            } else if (data.name === "list_reminders") {
              listRemindersTool(callerPhone).then(handleToolResult);
            } else if (data.name === "cancel_reminder") {
              cancelReminder(args.reminderId).then(handleToolResult);
            } else if (data.name === "update_memory") {
              updateMemory(callerPhone, args.key, args.value).then(handleToolResult);
            } else if (data.name === "delete_memory") {
              deleteMemory(callerPhone, args.key).then(handleToolResult);
            } else if (data.name === "create_reminder") {
              createReminder(callerPhone, args).then(handleToolResult);
            } else if (data.name === "save_memory") {
              saveMemory(callerPhone, args.key, args.value).then(handleToolResult);
            } else if (data.name === "get_user_profile") {
              getUserProfile(callerPhone).then(handleToolResult);
            } else if (data.name === "register_user") {
              registerUser(callerPhone, args.name).then(handleToolResult);
            } else {
              handleToolResult(
                JSON.stringify({ success: false, error: "Unknown tool" })
              );
            }
            break;
          }

          case "error":
            console.error("OpenAI error:", data.error);
            break;

          default:
            break;
        }
      });

      ws.on("error", (err) => {
        console.error("OpenAI WebSocket error:", err);
      });

      ws.on("close", () => {
        console.log("OpenAI WebSocket closed");
      });

      return ws;
    }

    return {
      onOpen(_event, ws) {
        console.log("Twilio media stream connected");
        openaiWs = openOpenAI({
          send: (data: string) => ws.send(data),
        });
      },

      onMessage(event, ws) {
        const msg = JSON.parse(
          typeof event.data === "string"
            ? event.data
            : event.data.toString()
        );

        switch (msg.event) {
          case "start":
            streamSid = msg.start.streamSid;
            callerPhone = msg.start.customParameters?.callerPhone ?? "unknown";
            reminderId = msg.start.customParameters?.reminderId ?? null;
            reminderTitle = msg.start.customParameters?.reminderTitle ?? null;
            callStartedAt = new Date();
            console.log(`Stream started: ${streamSid}, caller: ${callerPhone}${reminderId ? `, reminder: ${reminderId}` : ""}`);

            // Log call event (fire-and-forget)
            fetch(`${MEMORY_API_URL}/call-events`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: callerPhone,
                type: reminderId ? "outbound" : "inbound",
                startedAt: callStartedAt.toISOString(),
                ...(reminderId ? { reminderId } : {}),
              }),
            })
              .then((r) => r.json())
              .then((data: any) => { callEventId = data._id ?? null; })
              .catch((err) => console.error("Failed to log call start:", err));
            break;

          case "media":
            if (openaiWs?.readyState === WebSocket.OPEN) {
              openaiWs.send(
                JSON.stringify({
                  type: "input_audio_buffer.append",
                  audio: msg.media.payload,
                })
              );
            }
            break;

          case "mark":
            markQueue.shift();
            break;

          case "stop":
            console.log("Twilio stream stopped");
            break;

          default:
            break;
        }
      },

      onClose() {
        console.log("Twilio media stream disconnected");

        // Log call end (fire-and-forget)
        if (callEventId && callStartedAt) {
          const endedAt = new Date();
          const durationSec = Math.round((endedAt.getTime() - callStartedAt.getTime()) / 1000);
          fetch(`${MEMORY_API_URL}/call-events/${callEventId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endedAt: endedAt.toISOString(), durationSec }),
          }).catch((err) => console.error("Failed to log call end:", err));
        }

        if (openaiWs) {
          openaiWs.close();
          openaiWs = null;
        }
        streamSid = null;
        callEventId = null;
        callStartedAt = null;
      },

      onError(event) {
        console.error("Twilio WebSocket error:", event);
      },
    };
  })
);

const PORT = Number(process.env.PORT) || 3000;
const server = serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Voice gateway listening on port ${PORT}`);
});
injectWebSocket(server);
