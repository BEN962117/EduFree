import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_USER = process.env.FEEDBACK_ADMIN_USER;
const ADMIN_PASSWORD = process.env.FEEDBACK_ADMIN_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL;
const FEEDBACK_FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

if (!ALLOWED_ORIGIN) {
  console.error("Set ALLOWED_ORIGIN as a private server environment variable.");
  process.exit(1);
}
const openai = API_KEY ? new OpenAI({ apiKey: API_KEY }) : null;
const supabase = (SUPABASE_URL && SUPABASE_SECRET_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === ALLOWED_ORIGIN) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "12kb" }));

const tutorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20,
  standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Too many tutor requests. Please wait a little and try again." }
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "EduFree services" }));

const feedbackLimiter = rateLimit({
  windowMs: 60 *  60 * 1000, limit: 5,
  standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Too many feedback submissions. Please try again later." }
});

async function readFeedback() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("feedback")
    .select("id, category, message, created_at, status")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data || [];
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded || !ADMIN_USER || !ADMIN_PASSWORD) {
    res.set("WWW-Authenticate", 'Basic realm="EduFree feedback admin"');
    return res.status(401).send("Admin sign-in required.");
  }
  let decoded = ""; try { decoded = Buffer.from(encoded, "base64").toString("utf8"); } catch {}
  const split = decoded.indexOf(":");
  const user = split >= 0 ? decoded.slice(0, split) : "";
  const pass = split >= 0 ? decoded.slice(split + 1) : "";
  if (!safeEqual(user, ADMIN_USER) || !safeEqual(pass, ADMIN_PASSWORD)) {
    res.set("WWW-Authenticate", 'Basic realm="EduFree feedback admin"');
    return res.status(401).send("Incorrect admin sign-in.");
  }
  next();
}

app.post("/api/feedback", feedbackLimiter, async (req, res) => {
  try {
    const { category, message, website = "" } = req.body || {};
    if (website) return res.json({ ok: true }); // honeypot: silently discard bots
    const categories = ["Suggestion", "Problem or bug", "Lesson correction", "New topic request", "Learning experience"];
    if (!categories.includes(category) || typeof message !== "string" || message.trim().length < 5 || message.length > 2000) {
      return res.status(400).json({ error: "Choose a feedback category and enter a message between 5 and 2,000 characters." });
    }
    if (!supabase) return res.status(503).json({ error: "Feedback storage is not configured yet." });
    const { data: item, error: saveError } = await supabase
      .from("feedback")
      .insert({ category, message: message.trim(), status: "new" })
      .select("id, category, message, created_at, status")
      .single();
    if (saveError) throw saveError;

    // Email is a notification; the Supabase record remains the source of truth.
    if (RESEND_API_KEY && FEEDBACK_TO_EMAIL && FEEDBACK_FROM_EMAIL) {
      try {
        const email = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FEEDBACK_FROM_EMAIL, to: [FEEDBACK_TO_EMAIL], subject: `New EduFree feedback: ${category}`, text: `Category: ${category}\nReceived: ${item.created_at}\n\n${item.message}\n\nOpen your private EduFree feedback dashboard to review this message.` })
        });
        if (!email.ok) console.error("Feedback email notification failed:", email.status);
      } catch (error) { console.error("Feedback email notification failed:", error.message); }
    }
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Feedback save failed:", error.message);
    return res.status(500).json({ error: "Feedback could not be saved right now. Please try again later." });
  }
});

app.post("/admin/feedback/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid feedback ID." });
    }

    if (!["new", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid feedback status." });
    }

    const { data, error } = await supabase
      .from("feedback")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) throw error;

    return res.json({ ok: true, feedback: data });
  } catch (error) {
    console.error("Feedback status update failed:", error.message);
    return res.status(500).json({ error: "Could not update feedback." });
  }
});

app.post("/admin/feedback/:id/delete", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid feedback ID." });
    }

    const { data, error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;

    return res.json({ ok: true, deleted: data.id });
  } catch (error) {
    console.error("Feedback deletion failed:", error.message);
    return res.status(500).json({ error: "Could not delete feedback." });
  }
});

app.get("/admin/feedback", requireAdmin, async (_req, res) => {
  try {
    const entries = await readFeedback();
    const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
    const rows = entries.map(item => `<article><div class="meta">${esc(item.category)} · ${esc(new Date(item.created_at).toLocaleString())} · ${esc(item.status || "new")}</div><p>${esc(item.message).replace(/\n/g,"<br>")}</p></article>`).join("");
    res.type("html").send(`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EduFree feedback</title><style>body{font:16px/1.5 system-ui;max-width:850px;margin:35px auto;padding:0 16px;color:#172b3a;background:#f3f6f9}article{background:white;border:1px solid #dce5eb;border-radius:12px;padding:16px;margin:12px 0}.meta{font-size:13px;color:#176b87;font-weight:700}h1{color:#102b46}.empty{color:#657889}</style><h1>EduFree feedback</h1><p>${entries.length} submission(s)</p>${rows || '<p class="empty">No feedback received yet.</p>'}</html>`);
  } catch (error) { console.error("Admin feedback load failed:", error.message); res.status(500).send("Could not load feedback."); }
});

app.post("/api/tutor", tutorLimiter, async (req, res) => {
  try {
    if (!openai) return res.status(503).json({ error: "The live AI tutor is not configured yet." });
    const { message, language = "en", educationLevel = "Secondary", history = [] } = req.body || {};
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Please enter a question." });
    if (message.length > 3000) return res.status(400).json({ error: "Please keep each question under 3,000 characters." });

    const languages = { en: "English", fr: "French", rn: "Kirundi" };
    const languageName = languages[language] || "English";
    const levels = ["Primary", "Secondary", "College", "University", "All levels"];
    const level = levels.includes(educationLevel) ? educationLevel : "Secondary";
    const safeHistory = Array.isArray(history) ? history.slice(-8).filter(m =>
      m && ["user", "assistant"].includes(m.role) &&
      typeof m.content === "string" && m.content.length <= 3000
    ).map(m => ({ role: m.role, content: m.content })) : [];

    const instructions = `You are EduFree AI, a patient educational tutor for learners from primary school through university.
Respond in ${languageName}, unless the learner asks for another language. Adapt vocabulary and depth to this level: ${level}.
Teach step by step: identify the idea, explain the steps, give a simple example, then offer one short check-for-understanding question when useful.
For homework, guide the learner through reasoning rather than shaming them. Be accurate; if unsure, say so.
Keep all content age-appropriate for minors. Do not provide sexual content involving minors, instructions for dangerous activities, self-harm details, or hateful/harassing content.
For sensitive personal or safety concerns, respond supportively and encourage speaking with a trusted adult or appropriate professional.
Do not ask for passwords, addresses, phone numbers, school login details, or unnecessary personal data. You are an AI study helper, not a human teacher.`;

    const response = await openai.responses.create({
      model: MODEL,
      instructions,
      input: [...safeHistory, { role: "user", content: message.trim() }],
      max_output_tokens: 900
    });
    const answer = response.output_text?.trim();
    if (!answer) return res.status(502).json({ error: "The AI returned an empty answer. Please try again." });
    return res.json({ answer });
  } catch (error) {
    console.error("Tutor request failed:", error?.status || "", error?.message || "Unknown error");
    if (error?.status === 429) return res.status(429).json({ error: "The AI service is busy or its usage limit has been reached. Please try later." });
    return res.status(502).json({ error: "The AI tutor is temporarily unavailable. Please try again later." });
  }
});

app.listen(PORT, () => console.log(`EduFree AI backend listening on port ${PORT}`));
