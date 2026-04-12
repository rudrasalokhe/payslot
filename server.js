require("dotenv").config();
const PDFDocument = require("pdfkit");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/static", express.static(path.join(__dirname, "static")));

const SECRET = process.env.SECRET_KEY || "dev-secret-key";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017", {
  dbName: process.env.DB_NAME || "docdrop",
});

const DoctorSchema = new mongoose.Schema({
  name: String,
  specialty: String,
  email: { type: String, unique: true },
  password: Buffer,
  initials: String,
  color: String,
  colorBg: String,
  photo_url: String,
  bio: String,
  linkedin: String,
  experience: Number,
  education: String,
  languages: [String],
});

const PatientSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: Buffer,
  created_at: { type: Date, default: Date.now },
});

const AppointmentSchema = new mongoose.Schema({
  doctor_id: String,
  patient_id: String,
  patient_name: String,
  patient_email: String,
  date: String,
  time_slot: String,
  notes: { type: String, default: "" },
  status: { type: String, default: "upcoming" },
  created_at: { type: Date, default: Date.now },
});

const PrescriptionSchema = new mongoose.Schema({
  appointment_id: String,
  doctor_id: String,
  doctor_name: String,
  patient_id: String,
  patient_name: String,
  patient_email: String,
  medications: [{ name: String, dosage: String, instructions: String }],
  diagnosis: { type: String, default: "" },
  notes: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});

const OtpSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  otp: String,
  expires: Date,
  name: String,
});

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  token: String,
  expires: Date,
});

const Doctor = mongoose.model("Doctor", DoctorSchema);
const Patient = mongoose.model("Patient", PatientSchema);
const Appointment = mongoose.model("Appointment", AppointmentSchema);
const Prescription = mongoose.model("Prescription", PrescriptionSchema);
const Otp = mongoose.model("Otp", OtpSchema);
const PasswordReset = mongoose.model("PasswordReset", PasswordResetSchema);

const DOCTORS_SEED = [
  {
    name: "Dr. Shaurya Jaiswal", specialty: "General", email: "shaurya@docdrop.com",
    initials: "SJ", color: "#c8f135", colorBg: "rgba(200,241,53,0.12)", photo_url: null,
    bio: "Dr. Jaiswal is a general practitioner with a patient-first philosophy, focused on preventive care and holistic wellness. He helps patients navigate complex health decisions with clarity and compassion.",
    linkedin: "https://linkedin.com/in/shaurya-jaiswal",
    experience: 9, education: "MBBS, Grant Medical College, Mumbai", languages: ["English", "Hindi", "Marathi"],
  },
  {
    name: "Dr. Rudra Salokhe", specialty: "Cardiology", email: "rudra@docdrop.com",
    initials: "RS", color: "#ff4ecd", colorBg: "rgba(255,78,205,0.12)", photo_url: "/static/img/doctors/salokhe.png",
    bio: "Dr. Salokhe is an interventional cardiologist specialising in complex coronary artery disease and heart failure management. He trained at the prestigious Bombay Hospital Institute of Medical Sciences.",
    linkedin: "https://linkedin.com/in/rudra-salokhe-cardiology",
    experience: 14, education: "MBBS, MD (Cardiology), Bombay Hospital IMS", languages: ["English", "Hindi", "Marathi"],
  },
  {
    name: "Dr. Devvrat Bondre", specialty: "Dermatology", email: "devvrat@docdrop.com",
    initials: "DB", color: "#4f8bff", colorBg: "rgba(79,139,255,0.12)", photo_url: "/static/img/doctors/bondre.png",
    bio: "Dr. Bondre is a board-certified dermatologist with expertise in cosmetic dermatology, acne management, and skin cancer screening. He has published research on pigmentation disorders in South Asian skin types.",
    linkedin: "https://linkedin.com/in/devvrat-bondre",
    experience: 11, education: "MBBS, DVD, KEM Hospital Mumbai", languages: ["English", "Hindi"],
  },
  {
    name: "Dr. Tanvi Shadija", specialty: "Neurology", email: "tanvi@docdrop.com",
    initials: "TS", color: "#ff7a35", colorBg: "rgba(255,122,53,0.12)", photo_url: "/static/img/doctors/shadija.png",
    bio: "Dr. Shadija is a consultant neurologist specialising in headache disorders, epilepsy, and neurodegenerative diseases. She is passionate about improving quality of life for patients with chronic neurological conditions.",
    linkedin: "https://linkedin.com/in/tanvi-shadija-neuro",
    experience: 12, education: "MBBS, DM (Neurology), AIIMS New Delhi", languages: ["English", "Hindi", "Gujarati"],
  },
  {
    name: "Dr. Shreyas Patil", specialty: "Pediatrics", email: "shreyas@docdrop.com",
    initials: "SP", color: "#2dd4bf", colorBg: "rgba(45,212,191,0.12)", photo_url: "/static/img/doctors/patil.png",
    bio: "Dr. Patil is a dedicated paediatrician known for his gentle approach with children and clear communication with parents. He specialises in newborn care, developmental assessments, and childhood vaccinations.",
    linkedin: "https://linkedin.com/in/shreyas-patil-paeds",
    experience: 8, education: "MBBS, MD (Paediatrics), Pune University", languages: ["English", "Hindi", "Marathi"],
  },
  {
    name: "Dr. Ravi Patel", specialty: "Orthopedics", email: "ravi@docdrop.com",
    initials: "RP", color: "#a78bfa", colorBg: "rgba(167,139,250,0.12)", photo_url: null,
    bio: "Dr. Patel is an orthopaedic surgeon with a focus on sports medicine, joint replacement, and minimally invasive procedures. He has treated athletes at the national level and has a strong track record in complex fracture management.",
    linkedin: "https://linkedin.com/in/ravi-patel-ortho",
    experience: 16, education: "MBBS, MS (Orthopaedics), Seth GS Medical College", languages: ["English", "Hindi", "Gujarati"],
  },
];

async function seedDoctors() {
  for (const d of DOCTORS_SEED) {
    const exists = await Doctor.findOne({ email: d.email });
    if (!exists) {
      const hashed = bcrypt.hashSync("doc123", 10);
      await Doctor.create({ ...d, password: Buffer.from(hashed) });
    } else {
      // Update name, initials, photo_url if changed
      await Doctor.updateOne({ email: d.email }, { $set: { name: d.name, initials: d.initials, photo_url: d.photo_url, color: d.color, colorBg: d.colorBg } });
    }
  }
  console.log("Doctors seeded");
}

function generateOtp() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
}

function makeToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

function getCurrentUser(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.split(" ")[1], SECRET);
  } catch {
    return null;
  }
}

function requireAuth(role = null) {
  return (req, res, next) => {
    const user = getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Not logged in" });
    if (role && user.role !== role) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  };
}

function serialize(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id?.toString() || obj.id;
  delete obj._id;
  delete obj.__v;
  delete obj.password;
  return obj;
}

async function sendOtpEmail(toEmail, otp, name) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[Email] SMTP not configured");
    return false;
  }

  const htmlBody = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f7f3ed;margin:0;padding:32px"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4ddd2"><div style="background:#1c1612;padding:24px 32px"><span style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:#f7f3ed">Doc<span style="color:#e05a3a;font-style:normal">Drop</span></span></div><div style="padding:32px"><p style="color:#3a342d;font-size:16px;margin:0 0 8px">Hi ${name},</p><p style="color:#6b6158;font-size:14px;margin:0 0 28px">Here is your verification code:</p><div style="background:#fdf1ed;border:1.5px dashed rgba(224,90,58,.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px"><span style="font-family:monospace;font-size:38px;font-weight:700;letter-spacing:10px;color:#1c1612">${otp}</span></div><p style="color:#9c9389;font-size:12px;margin:0">Expires in <strong>10 minutes</strong>.</p></div><div style="background:#f7f3ed;padding:16px 32px;border-top:1px solid #e4ddd2"><p style="color:#9c9389;font-size:11px;font-family:monospace;margin:0">© 2024 DocDrop · Mumbai</p></div></div></body></html>`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"DocDrop" <${SMTP_USER}>`,
      to: toEmail,
      subject: "Your DocDrop verification code",
      html: htmlBody,
      text: `Hi ${name},\n\nYour DocDrop code: ${otp}\n\nExpires in 10 minutes.`,
    });
    console.log(`[Email] OTP sent to ${toEmail}`);
    return true;
  } catch (e) {
    console.error(`[Email] Error: ${e.message}`);
    return false;
  }
}

async function sendReceiptEmail(appt, doctor) {
  if (!SMTP_USER || !SMTP_PASS) return false;

  const htmlBody = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f7f3ed;margin:0;padding:32px"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4ddd2">
<div style="background:#1c1612;padding:24px 32px;display:flex;align-items:center;justify-content:space-between">
  <span style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:#f7f3ed">Doc<span style="color:#e05a3a;font-style:normal">Drop</span></span>
  <span style="color:#9c9389;font-size:12px;font-family:monospace">BOOKING RECEIPT</span>
</div>
<div style="padding:32px">
  <p style="color:#3a342d;font-size:16px;margin:0 0 6px">Hi <strong>${appt.patient_name}</strong>,</p>
  <p style="color:#6b6158;font-size:14px;margin:0 0 28px">Your appointment has been confirmed. Here are the details:</p>
  <div style="background:#fdf8f5;border-radius:12px;padding:24px;border:1px solid #e4ddd2;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="color:#9c9389;font-size:12px;font-family:monospace;padding:6px 0;width:40%">DOCTOR</td><td style="color:#1c1612;font-size:14px;font-weight:600">${doctor.name}</td></tr>
      <tr><td style="color:#9c9389;font-size:12px;font-family:monospace;padding:6px 0">SPECIALTY</td><td style="color:#1c1612;font-size:14px">${doctor.specialty}</td></tr>
      <tr><td style="color:#9c9389;font-size:12px;font-family:monospace;padding:6px 0">DATE</td><td style="color:#1c1612;font-size:14px">${appt.date}</td></tr>
      <tr><td style="color:#9c9389;font-size:12px;font-family:monospace;padding:6px 0">TIME</td><td style="color:#1c1612;font-size:14px">${appt.time_slot}</td></tr>
      ${appt.notes ? `<tr><td style="color:#9c9389;font-size:12px;font-family:monospace;padding:6px 0">NOTES</td><td style="color:#6b6158;font-size:13px">${appt.notes}</td></tr>` : ""}
    </table>
  </div>
  <p style="color:#9c9389;font-size:12px;margin:0">If you need to cancel or reschedule, log in to DocDrop.</p>
</div>
<div style="background:#f7f3ed;padding:16px 32px;border-top:1px solid #e4ddd2">
  <p style="color:#9c9389;font-size:11px;font-family:monospace;margin:0">© 2024 DocDrop · Mumbai</p>
</div>
</div></body></html>`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"DocDrop" <${SMTP_USER}>`,
      to: appt.patient_email,
      subject: `Appointment Confirmed — ${doctor.name} on ${appt.date}`,
      html: htmlBody,
      text: `Hi ${appt.patient_name},\n\nYour appointment with ${doctor.name} (${doctor.specialty}) is confirmed.\nDate: ${appt.date}\nTime: ${appt.time_slot}\n\nThank you for using DocDrop.`,
    });
    console.log(`[Email] Receipt sent to ${appt.patient_email}`);
    return true;
  } catch (e) {
    console.error(`[Email] Receipt error: ${e.message}`);
    return false;
  }
}

async function sendPrescriptionEmail(prescription) {
  if (!SMTP_USER || !SMTP_PASS) return false;

  const medsRows = prescription.medications.map(m =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e4ddd2;color:#1c1612;font-size:14px">${m.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e4ddd2;color:#6b6158;font-size:13px">${m.dosage}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e4ddd2;color:#6b6158;font-size:13px">${m.instructions}</td>
    </tr>`
  ).join("");

  const htmlBody = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f7f3ed;margin:0;padding:32px"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4ddd2">
<div style="background:#1c1612;padding:24px 32px;display:flex;align-items:center;justify-content:space-between">
  <span style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:#f7f3ed">Doc<span style="color:#e05a3a;font-style:normal">Drop</span></span>
  <span style="color:#9c9389;font-size:12px;font-family:monospace">PRESCRIPTION</span>
</div>
<div style="padding:32px">
  <p style="color:#3a342d;font-size:16px;margin:0 0 4px">Hi <strong>${prescription.patient_name}</strong>,</p>
  <p style="color:#6b6158;font-size:14px;margin:0 0 24px">${prescription.doctor_name} has shared a prescription for you.</p>
  ${prescription.diagnosis ? `<div style="background:#fdf1ed;border-left:3px solid #e05a3a;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px"><p style="margin:0;color:#9c9389;font-size:11px;font-family:monospace;margin-bottom:4px">DIAGNOSIS</p><p style="margin:0;color:#1c1612;font-size:14px">${prescription.diagnosis}</p></div>` : ""}
  <p style="color:#1c1612;font-size:13px;font-weight:600;margin:0 0 12px;font-family:monospace">MEDICATIONS</p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e4ddd2;border-radius:10px;overflow:hidden;margin-bottom:24px">
    <thead>
      <tr style="background:#f7f3ed">
        <th style="padding:10px 12px;text-align:left;color:#9c9389;font-size:11px;font-family:monospace;font-weight:600">MEDICATION</th>
        <th style="padding:10px 12px;text-align:left;color:#9c9389;font-size:11px;font-family:monospace;font-weight:600">DOSAGE</th>
        <th style="padding:10px 12px;text-align:left;color:#9c9389;font-size:11px;font-family:monospace;font-weight:600">INSTRUCTIONS</th>
      </tr>
    </thead>
    <tbody>${medsRows}</tbody>
  </table>
  ${prescription.notes ? `<div style="background:#fdf8f5;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e4ddd2"><p style="margin:0;color:#9c9389;font-size:11px;font-family:monospace;margin-bottom:6px">DOCTOR'S NOTES</p><p style="margin:0;color:#6b6158;font-size:14px">${prescription.notes}</p></div>` : ""}
  <p style="color:#9c9389;font-size:12px;margin:0">This prescription is issued by <strong>${prescription.doctor_name}</strong> via DocDrop. Always follow your doctor's advice.</p>
</div>
<div style="background:#f7f3ed;padding:16px 32px;border-top:1px solid #e4ddd2">
  <p style="color:#9c9389;font-size:11px;font-family:monospace;margin:0">© 2024 DocDrop · Mumbai</p>
</div>
</div></body></html>`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"DocDrop" <${SMTP_USER}>`,
      to: prescription.patient_email,
      subject: `Prescription from ${prescription.doctor_name} — DocDrop`,
      html: htmlBody,
      text: `Hi ${prescription.patient_name},\n\nPrescription from ${prescription.doctor_name}:\n\n${prescription.medications.map(m => `- ${m.name}: ${m.dosage} — ${m.instructions}`).join("\n")}\n\nDiagnosis: ${prescription.diagnosis || "N/A"}\nNotes: ${prescription.notes || "N/A"}`,
    });
    console.log(`[Email] Prescription sent to ${prescription.patient_email}`);
    return true;
  } catch (e) {
    console.error(`[Email] Prescription error: ${e.message}`);
    return false;
  }
}

async function buildSystemPrompt(user) {
  const apptContext = [];
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const query =
      user.role === "patient"
        ? { patient_id: user.id }
        : { status: { $ne: "cancelled" } };

    const appts = await Appointment.find(query);

    for (const a of appts) {
      const entry = {
        id: a._id.toString(),
        date: a.date,
        time_slot: a.time_slot,
        status: a.status,
        notes: a.notes || "",
      };

      try {
        const doc = await Doctor.findById(a.doctor_id, { password: 0 });
        if (doc) {
          entry.doctor_name = doc.name;
          entry.doctor_specialty = doc.specialty;
        }
      } catch {}

      if (user.role === "doctor") {
        entry.patient_name = a.patient_name;
        entry.patient_email = a.patient_email;
      }

      apptContext.push(entry);
    }
  } catch (e) {
    console.error(`[Chat] appointments error: ${e.message}`);
  }

  if (user.role === "patient") {
    return `You are a helpful medical assistant for DocDrop, a telemedicine platform.
You are chatting with patient ${user.name} (${user.email}). Today: ${todayStr}.
Appointments: ${JSON.stringify(apptContext, null, 2)}
Help with appointments review, consultation prep, and general health guidance.
Never diagnose, never prescribe medicines, and always advise the user to consult a real doctor for medical decisions.
Be warm, empathetic, and concise.`;
  } else {
    return `You are a clinical assistant for DocDrop.
You are chatting with Dr. ${user.name} (${user.email}). Today: ${todayStr}.
Appointments: ${JSON.stringify(apptContext, null, 2)}
Help with schedule review, patient notes, conflicts, and follow-ups.
Be professional and precise.`;
  }
}

async function callGemini(messages) {
  if (!genAI) throw new Error("Gemini not configured");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const cleanedMessages = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim() !== "")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      content: m.content.trim(),
    }));

  const systemMessage = cleanedMessages.find((m) => m.role === "user");
  const conversationText = cleanedMessages
    .map((m) => `${m.role === "model" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n\n");

  const result = await model.generateContent(conversationText);
  const response = await result.response;
  return response.text();
}

function handleGeminiError(e, res) {
  console.error("[Gemini]", e.message);

  if (String(e.message).toLowerCase().includes("quota")) {
    return res.status(503).json({ error: "Gemini quota reached." });
  }

  if (String(e.message).toLowerCase().includes("api key")) {
    return res.status(503).json({ error: "Gemini API key invalid. Check GEMINI_API_KEY in .env" });
  }

  return res.status(500).json({ error: `AI error: ${e.message}` });
}

async function sendPasswordResetEmail(toEmail, resetToken, name) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[Email] SMTP not configured");
    return false;
  }

  // The reset link would be used in a real deployment; here we send the token in a styled email
  const htmlBody = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f7f3ed;margin:0;padding:32px"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4ddd2"><div style="background:#1c1612;padding:24px 32px"><span style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:#f7f3ed">Doc<span style="color:#e05a3a;font-style:normal">Drop</span></span></div><div style="padding:32px"><p style="color:#3a342d;font-size:16px;margin:0 0 8px">Hi ${name},</p><p style="color:#6b6158;font-size:14px;margin:0 0 28px">We received a request to reset your password. Use the code below on the DocDrop reset page:</p><div style="background:#fdf1ed;border:1.5px dashed rgba(224,90,58,.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px"><span style="font-family:monospace;font-size:28px;font-weight:700;letter-spacing:6px;color:#1c1612">${resetToken}</span></div><p style="color:#9c9389;font-size:12px;margin:0 0 8px">This code expires in <strong>15 minutes</strong>.</p><p style="color:#9c9389;font-size:12px;margin:0">If you didn't request a password reset, you can ignore this email.</p></div><div style="background:#f7f3ed;padding:16px 32px;border-top:1px solid #e4ddd2"><p style="color:#9c9389;font-size:11px;font-family:monospace;margin:0">© 2024 DocDrop · Mumbai</p></div></div></body></html>`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"DocDrop" <${SMTP_USER}>`,
      to: toEmail,
      subject: "Reset your DocDrop password",
      html: htmlBody,
      text: `Hi ${name},\n\nYour DocDrop password reset code: ${resetToken}\n\nExpires in 15 minutes.\n\nIf you didn't request this, ignore this email.`,
    });
    console.log(`[Email] Password reset sent to ${toEmail}`);
    return true;
  } catch (e) {
    console.error(`[Email] Password reset error: ${e.message}`);
    return false;
  }
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.post("/api/auth/send-otp", async (req, res) => {
  const { email: rawEmail = "", name: rawName = "" } = req.body;
  const email = rawEmail.trim().toLowerCase();
  const name = rawName.trim() || email.split("@")[0];

  if (!email) return res.status(400).json({ error: "Email required" });

  if (await Patient.findOne({ email })) {
    return res.status(409).json({ error: "Account already exists with this email." });
  }

  const otp = generateOtp();

  await Otp.findOneAndUpdate(
    { email },
    { email, otp, expires: new Date(Date.now() + 10 * 60 * 1000), name },
    { upsert: true, new: true }
  );

  const ok = await sendOtpEmail(email, otp, name);

  if (!ok) {
    await Otp.deleteOne({ email });
    return res.status(500).json({ error: "Could not send verification email." });
  }

  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
  const { name = "", email: rawEmail = "", password: pw = "", otp = "" } = req.body;
  const email = rawEmail.trim().toLowerCase();

  if (!email || !pw) return res.status(400).json({ error: "Email and password required" });
  if (pw.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  if (await Patient.findOne({ email })) return res.status(409).json({ error: "Account already exists" });

  const entry = await Otp.findOne({ email });
  if (!entry) return res.status(400).json({ error: "No OTP sent. Please request a code first." });

  if (new Date() > entry.expires) {
    await Otp.deleteOne({ email });
    return res.status(400).json({ error: "OTP expired." });
  }

  if (entry.otp !== otp.trim()) {
    return res.status(400).json({ error: "Incorrect verification code." });
  }

  await Otp.deleteOne({ email });

  const hashed = bcrypt.hashSync(pw, 10);
  const patient = await Patient.create({
    name: name.trim() || email.split("@")[0],
    email,
    password: Buffer.from(hashed),
  });

  const user = { id: patient._id.toString(), name: patient.name, email, role: "patient" };
  res.status(201).json({ ok: true, token: makeToken({ ...user }), user });
});

app.post("/api/auth/login/patient", async (req, res) => {
  const { email: rawEmail = "", password: pw = "" } = req.body;
  const email = rawEmail.trim().toLowerCase();

  const patient = await Patient.findOne({ email });
  if (!patient) return res.status(404).json({ error: "No account found" });

  if (!bcrypt.compareSync(pw, patient.password.toString())) {
    return res.status(401).json({ error: "Wrong password" });
  }

  const user = { id: patient._id.toString(), name: patient.name, email, role: "patient" };
  res.json({ ok: true, token: makeToken({ ...user }), user });
});

app.post("/api/auth/login/doctor", async (req, res) => {
  const { email: rawEmail = "", password: pw = "" } = req.body;
  const email = rawEmail.trim().toLowerCase();

  const doctor = await Doctor.findOne({ email });
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  if (!bcrypt.compareSync(pw, doctor.password.toString())) {
    return res.status(401).json({ error: "Wrong password" });
  }

  const user = { id: doctor._id.toString(), name: doctor.name, email, role: "doctor" };
  res.json({ ok: true, token: makeToken({ ...user }), user });
});

app.post("/api/auth/logout", (req, res) => res.json({ ok: true }));

// ── Forgot password ──────────────────────────────────────────────────────
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email: rawEmail = "", role = "patient" } = req.body;
  const email = rawEmail.trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    let user = null;
    let name = "";
    if (role === "doctor") {
      user = await Doctor.findOne({ email });
      name = user ? user.name : "";
    } else {
      user = await Patient.findOne({ email });
      name = user ? user.name : "";
    }

    // Always respond 200 to prevent email enumeration
    if (!user) return res.json({ ok: true });

    const token = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordReset.findOneAndUpdate(
      { email },
      { email, token, expires },
      { upsert: true, new: true }
    );

    await sendPasswordResetEmail(email, token, name || email.split("@")[0]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Reset password ───────────────────────────────────────────────────────
app.post("/api/auth/reset-password", async (req, res) => {
  const { email: rawEmail = "", token = "", password = "", role = "patient" } = req.body;
  const email = rawEmail.trim().toLowerCase();

  if (!email || !token || !password) return res.status(400).json({ error: "All fields required" });
  if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });

  try {
    const record = await PasswordReset.findOne({ email });
    if (!record) return res.status(400).json({ error: "No reset request found. Please request a new code." });
    if (record.token !== token) return res.status(400).json({ error: "Invalid reset code" });
    if (new Date() > record.expires) return res.status(400).json({ error: "Code expired. Please request a new one." });

    const hashed = bcrypt.hashSync(password, 10);

    if (role === "doctor") {
      await Doctor.updateOne({ email }, { $set: { password: Buffer.from(hashed) } });
    } else {
      await Patient.updateOne({ email }, { $set: { password: Buffer.from(hashed) } });
    }

    await PasswordReset.deleteOne({ email });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Not logged in" });
  res.json({ user });
});

app.get("/api/doctors", async (req, res) => {
  const doctors = await Doctor.find({}, { password: 0 });
  res.json(doctors.map(serialize));
});

app.get("/api/appointments/patient", requireAuth("patient"), async (req, res) => {
  const appts = await Appointment.find({ patient_id: req.user.id });

  const result = await Promise.all(
    appts.map(async (a) => {
      const obj = serialize(a);
      try {
        const doc = await Doctor.findById(a.doctor_id, { password: 0 });
        if (doc) {
          obj.doctorName = doc.name;
          obj.specialty = doc.specialty;
        }
      } catch {}
      return obj;
    })
  );

  result.sort((a, b) => a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot));
  res.json(result);
});

app.post("/api/appointments/book", requireAuth("patient"), async (req, res) => {
  const { doctor_id, date, time_slot, notes = "" } = req.body;

  if (!doctor_id || !date || !time_slot) {
    return res.status(400).json({ error: "doctor_id, date and time_slot required" });
  }

  let doctor;
  try {
    doctor = await Doctor.findById(doctor_id);
  } catch {
    return res.status(400).json({ error: "Invalid doctor id" });
  }

  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  const conflict = await Appointment.findOne({
    doctor_id,
    date,
    time_slot,
    status: { $ne: "cancelled" },
  });

  if (conflict) return res.status(409).json({ error: "That slot is already booked" });

  const appt = await Appointment.create({
    doctor_id,
    patient_id: req.user.id,
    patient_name: req.user.name,
    patient_email: req.user.email,
    date,
    time_slot,
    notes: notes.trim(),
    status: "upcoming",
  });

  const obj = serialize(appt);
  obj.doctorName = doctor.name;
  obj.specialty = doctor.specialty;

  // Send booking receipt email to patient (non-blocking)
  sendReceiptEmail(appt, doctor).catch(() => {});

  res.status(201).json(obj);
});

app.post("/api/appointments/:apptId/cancel", requireAuth(), async (req, res) => {
  let appt;
  try {
    appt = await Appointment.findById(req.params.apptId);
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }

  if (!appt) return res.status(404).json({ error: "Not found" });

  if (req.user.role === "patient" && appt.patient_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await Appointment.updateOne({ _id: appt._id }, { $set: { status: "cancelled" } });
  res.json({ ok: true });
});

app.delete("/api/appointments/:apptId", requireAuth("patient"), async (req, res) => {
  let appt;
  try {
    appt = await Appointment.findById(req.params.apptId);
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
  if (!appt) return res.status(404).json({ error: "Not found" });
  if (appt.patient_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (appt.status === "upcoming") return res.status(400).json({ error: "Cancel the appointment before deleting" });
  await Appointment.deleteOne({ _id: appt._id });
  res.json({ ok: true });
});

app.get("/api/admin/appointments", requireAuth("doctor"), async (req, res) => {
  const query = { status: { $ne: "cancelled" } };
  if (req.query.doctor_id) query.doctor_id = req.query.doctor_id;

  const appts = await Appointment.find(query);

  const result = await Promise.all(
    appts.map(async (a) => {
      const obj = serialize(a);
      try {
        const doc = await Doctor.findById(a.doctor_id, { password: 0 });
        if (doc) {
          obj.doctorName = doc.name;
          obj.specialty = doc.specialty;
        }
      } catch {}
      return obj;
    })
  );

  result.sort((a, b) => a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot));
  res.json(result);
});

app.post("/api/admin/appointments/:apptId/done", requireAuth("doctor"), async (req, res) => {
  try {
    await Appointment.updateOne({ _id: req.params.apptId }, { $set: { status: "done" } });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.get("/api/admin/stats", requireAuth("doctor"), async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const all = await Appointment.find({ status: { $ne: "cancelled" } });

  res.json({
    total: all.length,
    today: all.filter((a) => a.date === today).length,
    upcoming: all.filter((a) => a.date > today).length,
    patients: new Set(all.map((a) => a.patient_id)).size,
  });
});

app.get("/api/slots/taken", async (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !date) return res.status(400).json({ error: "doctor_id and date required" });

  const taken = await Appointment.find(
    { doctor_id, date, status: { $ne: "cancelled" } },
    { time_slot: 1 }
  );

  res.json(taken.map((t) => t.time_slot));
});

app.get("/api/call/room/:apptId", requireAuth(), async (req, res) => {
  let appt;
  try {
    appt = await Appointment.findById(req.params.apptId);
  } catch {
    return res.status(400).json({ error: "Invalid appointment id" });
  }

  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  if (req.user.role === "patient" && appt.patient_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (appt.status === "cancelled") {
    return res.status(400).json({ error: "Appointment is cancelled" });
  }

  const apptId = req.params.apptId;
  const roomId = `docdrop-${apptId}`;
  const peerId = `${roomId}-${req.user.role === "doctor" ? "doc" : "pat"}`;
  const otherPeerId = `${roomId}-${req.user.role === "doctor" ? "pat" : "doc"}`;

  res.json({
    room_id: roomId,
    peer_id: peerId,
    other_peer_id: otherPeerId,
    role: req.user.role,
    appt_id: apptId,
    patient_name: appt.patient_name || "Patient",
    date: appt.date,
    time_slot: appt.time_slot,
  });
});

app.get("/api/test-gemini", async (req, res) => {
  if (!GEMINI_API_KEY || !genAI) {
    return res.status(503).json({ error: "GEMINI_API_KEY not set" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});
    const result = await model.generateContent("Say exactly: Gemini is working");
    const response = await result.response;

    res.json({
      ok: true,
      reply: response.text(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PRESCRIPTIONS ────────────────────────────────────────────────────────────

// Doctor creates a prescription for an appointment
app.post("/api/admin/appointments/:apptId/prescribe", requireAuth("doctor"), async (req, res) => {
  let appt;
  try {
    appt = await Appointment.findById(req.params.apptId);
  } catch {
    return res.status(400).json({ error: "Invalid appointment id" });
  }
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  const { medications = [], diagnosis = "", notes = "" } = req.body;
  if (!Array.isArray(medications) || medications.length === 0) {
    return res.status(400).json({ error: "At least one medication required" });
  }

  const doctor = await Doctor.findById(req.user.id, { password: 0 });

  const rx = await Prescription.create({
    appointment_id: appt._id.toString(),
    doctor_id: req.user.id,
    doctor_name: doctor ? doctor.name : req.user.name,
    patient_id: appt.patient_id,
    patient_name: appt.patient_name,
    patient_email: appt.patient_email,
    medications,
    diagnosis: diagnosis.trim(),
    notes: notes.trim(),
  });

  // Send prescription email to patient (non-blocking)
  sendPrescriptionEmail(rx).catch(() => {});

  res.status(201).json({ ok: true, prescription: serialize(rx) });
});

// Get prescriptions for an appointment (doctor or patient)
app.get("/api/appointments/:apptId/prescriptions", requireAuth(), async (req, res) => {
  const rxList = await Prescription.find({ appointment_id: req.params.apptId }).sort({ created_at: -1 });
  res.json(rxList.map(serialize));
});

// Get all prescriptions for the logged-in patient
app.get("/api/prescriptions/mine", requireAuth("patient"), async (req, res) => {
  const rxList = await Prescription.find({ patient_id: req.user.id }).sort({ created_at: -1 });
  res.json(rxList.map(serialize));
});

// Get all prescriptions sent by the logged-in doctor
app.get("/api/admin/prescriptions", requireAuth("doctor"), async (req, res) => {
  const rxList = await Prescription.find({ doctor_id: req.user.id }).sort({ created_at: -1 }).limit(50);
  res.json(rxList.map(serialize));
});


// ─── INVOICE PDF ───────────────────────────────────────────────────────────────

function formatINR(paise) {
  // We store consultation fee as a fixed amount per specialty
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise);
}

const CONSULTATION_FEES = {
  "General":     500,
  "Cardiology":  1200,
  "Dermatology": 800,
  "Neurology":   1500,
  "Pediatrics":  600,
  "Orthopedics": 1000,
};

function generateInvoicePDF(data) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 0 });

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28;
    const H = 841.89;
    const PAD = 52;

    // ── Dark header ──────────────────────────────────────────────────────
    doc.rect(0, 0, W, 110).fill("#1c1612");

    doc.font("Times-Italic").fontSize(26).fillColor("#f7f3ed")
       .text("Doc", PAD, 36, { continued: true })
       .font("Times-Roman").fillColor("#e05a3a").text("Drop");

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#9c9389")
       .text("INVOICE", W - PAD - 60, 38, { width: 60, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor("#9c9389")
       .text(`# ${data.invoiceNo}`, W - PAD - 60, 51, { width: 60, align: "right" });

    doc.font("Helvetica").fontSize(9).fillColor("#9c9389")
       .text("Medical Appointment Services · Mumbai", PAD, 74);

    // ── Meta strip ───────────────────────────────────────────────────────
    doc.rect(0, 110, W, 44).fill("#f7f3ed");
    const metaY = 122;
    [
      { label: "DATE ISSUED",       value: data.issueDate },
      { label: "APPOINTMENT DATE",  value: data.apptDate  },
      { label: "STATUS",            value: "PAID"         },
    ].forEach((c, i) => {
      const x = PAD + i * 165;
      doc.font("Helvetica-Bold").fontSize(7).fillColor("#9c9389").text(c.label, x, metaY);
      doc.font("Helvetica").fontSize(9).fillColor("#1c1612").text(c.value, x, metaY + 11);
    });

    // ── Bill To / Provider ───────────────────────────────────────────────
    const bY = 182;
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#9c9389").text("BILL TO", PAD, bY);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1c1612").text(data.patientName, PAD, bY + 12);
    doc.font("Helvetica").fontSize(9).fillColor("#6b6158").text(data.patientEmail, PAD, bY + 28);

    const rX = W / 2;
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#9c9389").text("SERVICE PROVIDER", rX, bY);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1c1612").text(data.doctorName, rX, bY + 12);
    doc.font("Helvetica").fontSize(9).fillColor("#6b6158")
       .text(data.specialty, rX, bY + 28)
       .text("DocDrop Medical Platform", rX, bY + 40);

    doc.moveTo(PAD, bY + 64).lineTo(W - PAD, bY + 64).strokeColor("#e4ddd2").lineWidth(1).stroke();

    // ── Line items ───────────────────────────────────────────────────────
    const tTop = bY + 84;
    doc.rect(PAD, tTop, W - PAD * 2, 26).fill("#f7f3ed");

    const cX = { desc: PAD + 10, date: PAD + 238, time: PAD + 326, qty: PAD + 392, amt: PAD + 440 };
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#9c9389");
    ["DESCRIPTION", "DATE", "TIME", "QTY", "AMOUNT"].forEach((h, i) => {
      const keys = ["desc","date","time","qty","amt"];
      doc.text(h, cX[keys[i]], tTop + 9);
    });

    const rY = tTop + 38;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1c1612")
       .text(`Consultation — ${data.specialty}`, cX.desc, rY);
    doc.font("Helvetica").fontSize(9).fillColor("#6b6158")
       .text(`with ${data.doctorName}`, cX.desc, rY + 14);
    doc.font("Helvetica").fontSize(10).fillColor("#1c1612")
       .text(data.apptDate, cX.date, rY)
       .text(data.timeSlot, cX.time, rY)
       .text("1", cX.qty, rY)
       .text(data.amount, cX.amt, rY);

    if (data.notes) {
      doc.font("Helvetica").fontSize(8).fillColor("#9c9389")
         .text(`Notes: ${data.notes}`, cX.desc, rY + 30, { width: 200 });
    }

    const rowEnd = rY + (data.notes ? 54 : 30);
    doc.moveTo(PAD, rowEnd).lineTo(W - PAD, rowEnd).strokeColor("#e4ddd2").lineWidth(0.5).stroke();

    // ── Totals ───────────────────────────────────────────────────────────
    const totY = rowEnd + 26;
    const totX = W - PAD - 200;

    [
      { label: "Subtotal",       val: data.amount },
      { label: "GST (18%)",      val: data.gst    },
      { label: "Platform Fee",   val: "₹0.00"     },
    ].forEach((r, i) => {
      const y = totY + i * 22;
      doc.font("Helvetica").fontSize(9).fillColor("#6b6158").text(r.label, totX, y);
      doc.font("Helvetica").fontSize(9).fillColor("#1c1612")
         .text(r.val, totX + 130, y, { align: "right", width: 60 });
    });

    doc.moveTo(totX, totY + 74).lineTo(W - PAD, totY + 74).strokeColor("#1c1612").lineWidth(0.75).stroke();

    doc.rect(totX - 10, totY + 80, W - PAD - totX + 10, 36).fill("#1c1612");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#f7f3ed").text("TOTAL DUE", totX, totY + 90);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#c8f135")
       .text(data.total, totX + 130, totY + 87, { align: "right", width: 60 });

    // ── Footer ───────────────────────────────────────────────────────────
    const footY = H - 110;
    doc.rect(0, footY, W, 110).fill("#f7f3ed");
    doc.moveTo(PAD, footY + 1).lineTo(W - PAD, footY + 1).strokeColor("#e4ddd2").lineWidth(1).stroke();

    doc.font("Helvetica-Bold").fontSize(7).fillColor("#9c9389").text("PAYMENT NOTE", PAD, footY + 18);
    doc.font("Helvetica").fontSize(8).fillColor("#6b6158")
       .text(
         "This invoice is auto-generated by DocDrop. Payment is collected at time of booking. " +
         "Retain this document for insurance claims or personal records.",
         PAD, footY + 30, { width: 340 }
       );

    doc.font("Helvetica").fontSize(7).fillColor("#9c9389")
       .text("© 2024 DocDrop Medical Platform · Mumbai, India", PAD, footY + 84)
       .text(`Invoice ${data.invoiceNo} · Generated ${data.issueDate}`, W - PAD - 210, footY + 84, { width: 210, align: "right" });

    doc.end();
  });
}

app.get("/api/appointments/:apptId/invoice", requireAuth(), async (req, res) => {
  let appt;
  try {
    appt = await Appointment.findById(req.params.apptId);
  } catch {
    return res.status(400).json({ error: "Invalid appointment id" });
  }
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  // Patients can only get their own invoices
  if (req.user.role === "patient" && appt.patient_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  let doctor;
  try {
    doctor = await Doctor.findById(appt.doctor_id, { password: 0 });
  } catch {}
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  const fee    = CONSULTATION_FEES[doctor.specialty] || 500;
  const gst    = Math.round(fee * 0.18);
  const total  = fee + gst;

  // Format date nicely
  const apptDateObj = new Date(appt.date + "T00:00");
  const fmtDate = apptDateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const issueDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Invoice number: DD-YYYYMMDD-last6ofId
  const invoiceNo = `DD-${appt.date.replace(/-/g, "")}-${appt._id.toString().slice(-6).toUpperCase()}`;

  const pdfBuf = await generateInvoicePDF({
    invoiceNo,
    issueDate,
    apptDate:    fmtDate,
    patientName: appt.patient_name,
    patientEmail:appt.patient_email,
    doctorName:  doctor.name,
    specialty:   doctor.specialty,
    timeSlot:    appt.time_slot,
    notes:       appt.notes || "",
    amount:      `₹${fee.toLocaleString("en-IN")}.00`,
    gst:         `₹${gst.toLocaleString("en-IN")}.00`,
    total:       `₹${total.toLocaleString("en-IN")}.00`,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="docdrop-invoice-${invoiceNo}.pdf"`);
  res.setHeader("Content-Length", pdfBuf.length);
  res.end(pdfBuf);
});

// ─── CHAT ─────────────────────────────────────────────────────────────────────

app.post("/api/chat", requireAuth(), async (req, res) => {
  if (!GEMINI_API_KEY || !genAI) {
    return res.status(503).json({ error: "Chatbot not configured — add GEMINI_API_KEY to .env" });
  }

  const { messages = [] } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const systemPrompt = await buildSystemPrompt(req.user);

    const reply = await callGemini([
      { role: "user", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : "",
      })),
    ]);

    res.json({ reply });
  } catch (e) {
    handleGeminiError(e, res);
  }
});

app.post("/api/chat/voice", requireAuth(), async (req, res) => {
  if (!GEMINI_API_KEY || !genAI) {
    return res.status(503).json({ error: "Chatbot not configured" });
  }

  const { transcript = "", messages = [] } = req.body;
  if (!transcript.trim()) return res.status(400).json({ error: "transcript required" });

  try {
    const systemPrompt = await buildSystemPrompt(req.user);

    const reply = await callGemini([
      { role: "user", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : "",
      })),
      { role: "user", content: transcript },
    ]);

    res.json({ reply, transcript });
  } catch (e) {
    handleGeminiError(e, res);
  }
});

mongoose.connection.once("open", async () => {
  await seedDoctors();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => console.log(`DocDrop running on port ${PORT}`));
});