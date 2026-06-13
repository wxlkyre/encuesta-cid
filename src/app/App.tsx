import { useState, useMemo, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type SurveyType = "cubiculos" | "prestamo" | "general";
type Rating = 1 | 2 | 3;
type AdminTab = "charts" | "history" | "comments";
type View = "home" | "survey" | "comment" | "thanks" | "admin" | "admin-login";

interface SurveyResponse {
  id: string;
  type: SurveyType;
  date: string;
  answers: Rating[];
  comment?: string;
}

// ─── Survey definitions ───────────────────────────────────────────────────────

const SURVEYS: Record<SurveyType, { title: string; desc: string; questions: string[] }> = {
  cubiculos: {
    title: "Cubículos y Laptops",
    desc: "Evalúa los espacios de estudio y el equipo tecnológico disponible.",
    questions: [
      "¿El cubículo estaba limpio y ordenado?",
      "¿El equipo tecnológico funcionó correctamente?",
      "¿El proceso de reserva fue sencillo y rápido?",
      "¿El tiempo de uso disponible fue suficiente?",
      "¿El personal te atendió con amabilidad?",
    ],
  },
  prestamo: {
    title: "Préstamo de Libros",
    desc: "Califica el servicio de préstamo y devolución de material bibliográfico.",
    questions: [
      "¿Encontraste el material que necesitabas?",
      "¿El proceso de préstamo fue ágil?",
      "¿El personal te orientó de forma correcta?",
      "¿El estado físico del material fue adecuado?",
      "¿El plazo de préstamo fue suficiente?",
    ],
  },
  general: {
    title: "Encuesta General",
    desc: "Comparte tu experiencia general con las instalaciones y el personal.",
    questions: [
      "¿Las instalaciones están limpias y ordenadas?",
      "¿El ambiente es propicio para el estudio?",
      "¿El horario de atención te resulta conveniente?",
      "¿El personal es amable y servicial?",
      "¿En general, estás satisfecho con los servicios?",
    ],
  },
};

const ADMIN_PIN = "2024";
const STORAGE_KEY = "biblioteca_encuestas_v1";

function loadResponses(): SurveyResponse[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function persistResponses(data: SurveyResponse[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Background orbs ──────────────────────────────────────────────────────────

function BgOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(147,197,253,0.14) 0%, transparent 68%)" }} />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 68%)" }} />
      <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(186,220,255,0.11) 0%, transparent 68%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[320px] rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(210,230,255,0.09) 0%, transparent 70%)" }} />
    </div>
  );
}

// ─── Glass card ───────────────────────────────────────────────────────────────

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border shadow-xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.58)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        borderColor: "rgba(255,255,255,0.70)",
        boxShadow: "0 8px 32px rgba(30,60,120,0.10), 0 1.5px 0 rgba(255,255,255,0.55) inset",
      }}
    >
      {children}
    </div>
  );
}

// ─── SVG Face icons ───────────────────────────────────────────────────────────

const T = "0.2s ease";

function FaceHappy({ size = 56, active, hovered }: { size?: number; active: boolean; hovered: boolean }) {
  const lit = active || hovered;
  const fill = active ? "#34C759" : hovered ? "rgba(52,199,89,0.28)" : "rgba(52,199,89,0.13)";
  const stroke = active ? "#28A745" : hovered ? "rgba(52,199,89,0.6)" : "rgba(52,199,89,0.35)";
  const ink = active ? "#fff" : hovered ? "rgba(52,199,89,0.9)" : "rgba(52,199,89,0.6)";

  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" style={{ transition: `transform ${T}` }}>
      <circle cx="26" cy="26" r="25" fill={fill} stroke={stroke} strokeWidth="1.5"
        style={{ transition: `fill ${T}, stroke ${T}` }} />

      {/* Eyes — grow slightly on hover */}
      <ellipse cx="18.5" cy="21" rx="2.5" ry={lit ? 3.6 : 3} fill={ink}
        style={{ transition: `ry ${T}, fill ${T}` }} />
      <ellipse cx="33.5" cy="21" rx="2.5" ry={lit ? 3.6 : 3} fill={ink}
        style={{ transition: `ry ${T}, fill ${T}` }} />

      {/* Closed smile — fades out on hover/active */}
      <path d="M16 31 Q26 40 36 31" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none"
        style={{ opacity: lit ? 0 : 1, transition: `opacity ${T}` }} />

      {/* Open-mouth smile — fades in on hover/active */}
      <g style={{ opacity: lit ? 1 : 0, transition: `opacity ${T}` }}>
        {/* Filled mouth interior */}
        <path d="M15 29 Q26 44 37 29 Q26 37 15 29 Z" fill={active ? "rgba(255,255,255,0.9)" : "rgba(52,199,89,0.25)"} />
        {/* Upper lip arc */}
        <path d="M15 29 Q26 44 37 29" stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Teeth divider */}
        <line x1="20" y1="34.5" x2="32" y2="34.5"
          stroke={active ? "rgba(40,167,69,0.35)" : "rgba(52,199,89,0.3)"}
          strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function FaceNeutral({ size = 56, active, hovered }: { size?: number; active: boolean; hovered: boolean }) {
  const lit = active || hovered;
  const fill = active ? "#FF9F0A" : hovered ? "rgba(255,159,10,0.28)" : "rgba(255,159,10,0.13)";
  const stroke = active ? "#E68900" : hovered ? "rgba(255,159,10,0.6)" : "rgba(255,159,10,0.35)";
  const ink = active ? "#fff" : hovered ? "rgba(255,159,10,0.9)" : "rgba(255,159,10,0.6)";
  const browInk = active ? "rgba(255,255,255,0.85)" : hovered ? "rgba(255,159,10,0.8)" : "rgba(255,159,10,0.45)";

  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="25" fill={fill} stroke={stroke} strokeWidth="1.5"
        style={{ transition: `fill ${T}, stroke ${T}` }} />

      {/* Eyebrows — raise on hover/active */}
      <path d={lit ? "M14.5 15.5 Q18.5 13.5 22.5 15.5" : "M15.5 18 Q18.5 17 21.5 18"}
        stroke={browInk} strokeWidth="1.8" strokeLinecap="round" fill="none"
        style={{ transition: `d ${T}, stroke ${T}` }} />
      <path d={lit ? "M29.5 15.5 Q33.5 13.5 37.5 15.5" : "M30.5 18 Q33.5 17 36.5 18"}
        stroke={browInk} strokeWidth="1.8" strokeLinecap="round" fill="none"
        style={{ transition: `d ${T}, stroke ${T}` }} />

      {/* Eyes */}
      <ellipse cx="18.5" cy={lit ? 21.5 : 21} rx="2.5" ry="2.5" fill={ink}
        style={{ transition: `cy ${T}, fill ${T}` }} />
      <ellipse cx="33.5" cy={lit ? 21.5 : 21} rx="2.5" ry="2.5" fill={ink}
        style={{ transition: `cy ${T}, fill ${T}` }} />

      {/* Flat mouth — widens on hover/active, stays flat */}
      <line
        x1={lit ? 13 : 17} y1="34"
        x2={lit ? 39 : 35} y2="34"
        stroke={ink} strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: `x1 ${T}, x2 ${T}, stroke ${T}` }}
      />
    </svg>
  );
}

function FaceSad({ size = 56, active, hovered }: { size?: number; active: boolean; hovered: boolean }) {
  const lit = active || hovered;
  const fill = active ? "#FF453A" : hovered ? "rgba(255,69,58,0.28)" : "rgba(255,69,58,0.13)";
  const stroke = active ? "#E0362C" : hovered ? "rgba(255,69,58,0.6)" : "rgba(255,69,58,0.35)";
  const ink = active ? "#fff" : hovered ? "rgba(255,69,58,0.9)" : "rgba(255,69,58,0.6)";
  const browInk = active ? "#fff" : hovered ? "rgba(255,69,58,0.8)" : "rgba(255,69,58,0.55)";

  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="25" fill={fill} stroke={stroke} strokeWidth="1.5"
        style={{ transition: `fill ${T}, stroke ${T}` }} />

      {/* Eyes */}
      <ellipse cx="18.5" cy="22" rx="2.5" ry="2.5" fill={ink}
        style={{ transition: `fill ${T}` }} />
      <ellipse cx="33.5" cy="22" rx="2.5" ry="2.5" fill={ink}
        style={{ transition: `fill ${T}` }} />

      {/* Brows — steeper on hover */}
      <path d={lit ? "M14 19 Q18.5 15.5 22 18.5" : "M15.5 18 Q18.5 16 21.5 18"}
        stroke={browInk} strokeWidth="1.8" strokeLinecap="round" fill="none"
        style={{ transition: `d ${T}, stroke ${T}` }} />
      <path d={lit ? "M30 18.5 Q33.5 15.5 38 19" : "M30.5 18 Q33.5 16 36.5 18"}
        stroke={browInk} strokeWidth="1.8" strokeLinecap="round" fill="none"
        style={{ transition: `d ${T}, stroke ${T}` }} />

      {/* Frown — deepens on hover */}
      <path d={lit ? "M14 39 Q26 26 38 39" : "M16 37 Q26 29 36 37"}
        stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none"
        style={{ transition: `d ${T}, stroke ${T}` }} />

      {/* Mouth fill on hover/active */}
      <g style={{ opacity: lit ? 1 : 0, transition: `opacity ${T}` }}>
        <path d={lit ? "M14 39 Q26 26 38 39 Q26 32 14 39 Z" : ""}
          fill={active ? "rgba(255,255,255,0.75)" : "rgba(255,69,58,0.2)"} />
      </g>
    </svg>
  );
}

type FaceType = "happy" | "neutral" | "sad";

const FACE_RATING: Record<FaceType, Rating> = { happy: 3, neutral: 2, sad: 1 };
const FACE_LABEL: Record<FaceType, string> = { happy: "Satisfecho", neutral: "Regular", sad: "Insatisfecho" };

function FaceButton({ face, selected, onClick }: { face: FaceType; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border select-none focus:outline-none",
        selected ? "scale-110 shadow-lg" : hovered ? "scale-105 shadow-md" : "",
      ].join(" ")}
      style={{
        background: selected ? "rgba(255,255,255,0.82)" : hovered ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.38)",
        borderColor: selected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.52)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: `transform 0.2s cubic-bezier(.34,1.56,.64,1), background 0.2s ease, box-shadow 0.2s ease`,
      }}
    >
      {face === "happy"   && <FaceHappy   active={selected} hovered={hovered} />}
      {face === "neutral" && <FaceNeutral active={selected} hovered={hovered} />}
      {face === "sad"     && <FaceSad     active={selected} hovered={hovered} />}
      <span
        className="text-xs font-semibold tracking-wide"
        style={{
          color: selected ? "#1A1F2E" : hovered ? "rgba(26,31,46,0.80)" : "rgba(26,31,46,0.55)",
          transition: `color 0.2s ease`,
        }}
      >
        {FACE_LABEL[face]}
      </span>
    </button>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("home");
  const [surveyType, setSurveyType] = useState<SurveyType | null>(null);
  const [answers, setAnswers] = useState<(Rating | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("charts");
  const [historyFilter, setHistoryFilter] = useState<SurveyType | "all">("all");
  const [responses, setResponses] = useState<SurveyResponse[]>(loadResponses);
  // transient state to animate face selection before advancing
  const [pendingRating, setPendingRating] = useState<Rating | null>(null);

  const survey = surveyType ? SURVEYS[surveyType] : null;
  const totalQuestions = survey?.questions.length ?? 0;
  const isLastQuestion = currentQ === totalQuestions - 1;

  // ── Actions ──────────────────────────────────────────────────────────────────

  function startSurvey(type: SurveyType) {
    setSurveyType(type);
    setAnswers(new Array(SURVEYS[type].questions.length).fill(null));
    setCurrentQ(0);
    setCommentText("");
    setPendingRating(null);
    setView("survey");
  }

  function selectRating(rating: Rating) {
    if (pendingRating !== null) return; // already processing
    setPendingRating(rating);

    const newAnswers = [...answers];
    newAnswers[currentQ] = rating;
    setAnswers(newAnswers);

    setTimeout(() => {
      setPendingRating(null);
      if (!isLastQuestion) {
        setCurrentQ((q) => q + 1);
      } else {
        setView("comment");
      }
    }, 420);
  }

  function saveAndFinish(comment?: string) {
    if (!surveyType) return;
    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      type: surveyType,
      date: new Date().toISOString().split("T")[0],
      answers: answers as Rating[],
      comment: comment?.trim() || undefined,
    };
    const updated = [...responses, response];
    setResponses(updated);
    persistResponses(updated);
    setView("thanks");
  }

  function goHome() {
    setView("home");
    setSurveyType(null);
    setAnswers([]);
    setCurrentQ(0);
    setCommentText("");
    setPendingRating(null);
  }

  function tryAdminLogin() {
    if (adminPin === ADMIN_PIN) {
      setAdminPin("");
      setAdminError(false);
      setView("admin");
    } else {
      setAdminError(true);
    }
  }

  function exportCSV() {
    const header = ["ID", "Tipo", "Fecha", "P1", "P2", "P3", "P4", "P5", "Promedio", "Comentario"];
    const rows = responses.map((r) => {
      const avg = (r.answers.reduce((a, b) => a + b, 0) / r.answers.length).toFixed(2);
      return [r.id, SURVEYS[r.type].title, r.date, ...r.answers, avg, r.comment ?? ""].join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `encuestas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    if (window.confirm("¿Eliminar todos los datos de encuestas? Esta acción no se puede deshacer.")) {
      setResponses([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // ── Chart data ────────────────────────────────────────────────────────────────

  const pieData = useMemo(() => {
    let happy = 0, neutral = 0, sad = 0;
    responses.forEach((r) => r.answers.forEach((a) => { if (a === 3) happy++; else if (a === 2) neutral++; else sad++; }));
    return [
      { name: "Satisfecho", value: happy, color: "#34C759" },
      { name: "Regular", value: neutral, color: "#FF9F0A" },
      { name: "Insatisfecho", value: sad, color: "#FF453A" },
    ].filter((d) => d.value > 0);
  }, [responses]);

  const barData = useMemo(() =>
    (["cubiculos", "prestamo", "general"] as SurveyType[]).map((type) => {
      const rs = responses.filter((r) => r.type === type);
      const allA = rs.flatMap((r) => r.answers);
      const avg = allA.length ? +(allA.reduce((a, b) => a + b, 0) / allA.length).toFixed(2) : 0;
      return { name: SURVEYS[type].title.split(" ")[0], avg, count: rs.length };
    }), [responses]);

  const trendData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split("T")[0];
    });
    return days.map((date) => ({
      fecha: date.slice(5),
      respuestas: responses.filter((r) => r.date === date).length,
    }));
  }, [responses]);

  const filteredHistory = useMemo(() =>
    (historyFilter === "all" ? responses : responses.filter((r) => r.type === historyFilter)).slice().reverse(),
    [responses, historyFilter]);

  const userComments = useMemo(() =>
    responses.filter((r) => r.comment).map((r) => ({ type: r.type, date: r.date, text: r.comment! })).reverse(),
    [responses]);

  const ratingEmoji = (v: number) => v === 3 ? "S" : v === 2 ? "R" : "I";

  // ── Shared style helpers ──────────────────────────────────────────────────────

  const glassHeader: React.CSSProperties = {
    background: "rgba(255,255,255,0.52)",
    backdropFilter: "blur(24px) saturate(1.5)",
    WebkitBackdropFilter: "blur(24px) saturate(1.5)",
    borderBottom: "1px solid rgba(255,255,255,0.60)",
  };

  const btnPrimary =
    "px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none";
  const btnSecondary =
    "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none";

  // ── Views ─────────────────────────────────────────────────────────────────────

  // HOME
  if (view === "home") {
    return (
      <div className="min-h-screen relative" style={{ background: "#F3F6FB", fontFamily: "Inter, system-ui, sans-serif" }}>
        <BgOrbs />

        {/* Header */}
        <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between" style={glassHeader}>
          <div>
            <p className="text-[10px] font-mono tracking-[0.18em] uppercase mb-0.5" style={{ color: "rgba(10,132,255,0.7)" }}>
              Centro Integral de Documentación · CID
            </p>
            <h1 className="text-lg font-semibold text-foreground">Encuesta de Satisfacción</h1>
          </div>
          <button
            onClick={() => setView("admin-login")}
            className="text-[10px] tracking-[0.2em] uppercase font-mono transition-opacity hover:opacity-70"
            style={{ color: "rgba(26,31,46,0.25)" }}
          >
            Admin
          </button>
        </header>

        {/* Hero text */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-14 pb-8 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            ¿Cómo fue tu experiencia?
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "#5A6480" }}>
            Tu opinión nos ayuda a mejorar continuamente. Selecciona el servicio que utilizaste hoy.
          </p>
        </div>

        {/* Survey cards */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-5">
          {(["cubiculos", "prestamo", "general"] as SurveyType[]).map((type) => {
            const s = SURVEYS[type];
            return (
              <button
                key={type}
                onClick={() => startSurvey(type)}
                className="group text-left focus:outline-none"
              >
                <Glass className="p-7 h-full flex flex-col gap-4 hover:shadow-2xl transition-all duration-200 hover:-translate-y-1.5 group-focus:ring-2 group-focus:ring-blue-400/50">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1.5">{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#5A6480" }}>{s.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#0A84FF" }}>
                    Comenzar
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </div>
                </Glass>
              </button>
            );
          })}
        </div>

        <div className="relative z-10 text-center pb-6">
          <p className="text-xs font-mono" style={{ color: "rgba(90,100,128,0.6)" }}>
            Tus respuestas son anónimas
          </p>
        </div>
      </div>
    );
  }

  // SURVEY — one question at a time
  if (view === "survey" && survey) {
    const question = survey.questions[currentQ];
    const currentAnswer = answers[currentQ];
    const progress = (currentQ / totalQuestions) * 100;

    return (
      <div className="min-h-screen relative flex flex-col" style={{ background: "#F3F6FB", fontFamily: "Inter, system-ui, sans-serif" }}>
        <BgOrbs />

        {/* Header */}
        <header className="sticky top-0 z-20 px-6 py-4 flex items-center gap-3" style={glassHeader}>
          <button
            onClick={goHome}
            className="text-sm transition-opacity hover:opacity-70 mr-1"
            style={{ color: "#0A84FF" }}
          >
            ← Inicio
          </button>
          <div className="h-4 w-px" style={{ background: "rgba(26,31,46,0.15)" }} />
          <span className="text-sm font-medium text-foreground">{survey.title}</span>
          <div className="ml-auto text-xs font-mono" style={{ color: "rgba(90,100,128,0.7)" }}>
            {currentQ + 1} / {totalQuestions}
          </div>
        </header>

        {/* Progress bar */}
        <div className="relative z-10 h-0.5 w-full" style={{ background: "rgba(200,215,240,0.5)" }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress + (1 / totalQuestions) * 100}%`, background: "#0A84FF" }}
          />
        </div>

        {/* Question card */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
          <Glass className="w-full max-w-lg p-8 flex flex-col items-center text-center gap-8">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: "rgba(10,132,255,0.65)" }}>
                Pregunta {currentQ + 1}
              </p>
              <p className="text-2xl font-semibold text-foreground leading-snug">
                {question}
              </p>
            </div>

            {/* Face buttons */}
            <div className="flex gap-5 justify-center flex-wrap">
              {(["happy", "neutral", "sad"] as FaceType[]).map((face) => (
                <FaceButton
                  key={face}
                  face={face}
                  selected={pendingRating === FACE_RATING[face] || (pendingRating === null && currentAnswer === FACE_RATING[face])}
                  onClick={() => selectRating(FACE_RATING[face])}
                />
              ))}
            </div>

            {/* Dot indicators */}
            <div className="flex gap-2">
              {survey.questions.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentQ ? 20 : 8,
                    height: 8,
                    background: i < currentQ
                      ? "#0A84FF"
                      : i === currentQ
                        ? "#0A84FF"
                        : "rgba(10,132,255,0.2)",
                    opacity: i > currentQ ? 0.5 : 1,
                  }}
                />
              ))}
            </div>
          </Glass>
        </div>
      </div>
    );
  }

  // COMMENT
  if (view === "comment") {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-6 py-12" style={{ background: "#F3F6FB", fontFamily: "Inter, system-ui, sans-serif" }}>
        <BgOrbs />
        <Glass className="relative z-10 w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-1">¿Algo más que compartir?</h2>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: "#5A6480" }}>
            Puedes dejarnos un comentario adicional. Es completamente opcional.
          </p>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe tu comentario aquí…"
            className="w-full h-28 p-4 rounded-xl resize-none text-sm text-foreground focus:outline-none focus:ring-2 leading-relaxed"
            style={{
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.75)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#1A1F2E",
              ringColor: "#0A84FF",
            }}
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => saveAndFinish()}
              className={btnSecondary}
              style={{
                background: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.65)",
                color: "#5A6480",
              }}
            >
              Omitir y finalizar
            </button>
            <button
              onClick={() => saveAndFinish(commentText)}
              className={`${btnPrimary} flex-1`}
              style={{ background: "#0A84FF" }}
            >
              Enviar respuesta
            </button>
          </div>
        </Glass>
      </div>
    );
  }

  // THANKS
  if (view === "thanks") {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-6" style={{ background: "#F3F6FB", fontFamily: "Inter, system-ui, sans-serif" }}>
        <BgOrbs />
        <Glass className="relative z-10 w-full max-w-sm p-10 flex flex-col items-center text-center gap-5">
          {/* Animated check ring */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(52,199,89,0.15)", border: "2px solid rgba(52,199,89,0.4)" }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M8 18 L15 25 L28 11" stroke="#34C759" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Gracias por tu respuesta!</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#5A6480" }}>
              Tus datos fueron enviados correctamente. Tu opinión es muy valiosa para mejorar nuestros servicios.
            </p>
          </div>
          <button
            onClick={goHome}
            className={`${btnPrimary} w-full`}
            style={{ background: "#0A84FF" }}
          >
            Volver al inicio
          </button>
        </Glass>
      </div>
    );
  }

  // ADMIN LOGIN
  if (view === "admin-login") {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-6" style={{ background: "#F3F6FB", fontFamily: "Inter, system-ui, sans-serif" }}>
        <BgOrbs />
        <Glass className="relative z-10 w-full max-w-sm p-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.2)" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="10" width="16" height="11" rx="2.5" stroke="#0A84FF" strokeWidth="1.8" />
              <path d="M7 10V7a4 4 0 018 0v3" stroke="#0A84FF" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="11" cy="15.5" r="1.5" fill="#0A84FF" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Acceso Administrativo</h2>
          <p className="text-sm mb-6" style={{ color: "#5A6480" }}>Ingresa el PIN para ver el panel de estadísticas.</p>
          <input
            type="password"
            inputMode="numeric"
            value={adminPin}
            onChange={(e) => { setAdminPin(e.target.value); setAdminError(false); }}
            onKeyDown={(e) => e.key === "Enter" && tryAdminLogin()}
            placeholder="· · · ·"
            maxLength={6}
            className="w-full p-3.5 rounded-xl text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 mb-2"
            style={{
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.75)",
              color: "#1A1F2E",
            }}
          />
          {adminError && (
            <p className="text-xs text-center mb-3" style={{ color: "#FF453A" }}>PIN incorrecto. Inténtalo de nuevo.</p>
          )}
          <div className="flex gap-3 mt-3">
            <button
              onClick={goHome}
              className={btnSecondary}
              style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.65)", color: "#5A6480" }}
            >
              Cancelar
            </button>
            <button
              onClick={tryAdminLogin}
              className={`${btnPrimary} flex-1`}
              style={{ background: "#0A84FF" }}
            >
              Ingresar
            </button>
          </div>
        </Glass>
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (view === "admin") {
    return (
      <div className="min-h-screen relative" style={{ background: "#F3F6FB", fontFamily: "Inter, system-ui, sans-serif" }}>
        <BgOrbs />

        {/* Admin header */}
        <header className="sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap" style={glassHeader}>
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-0.5" style={{ color: "rgba(10,132,255,0.6)" }}>
              Panel Administrativo
            </p>
            <h1 className="text-base font-semibold text-foreground">Estadísticas de Encuestas</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportCSV}
              className={btnSecondary}
              style={{
                background: "rgba(10,132,255,0.10)",
                border: "1px solid rgba(10,132,255,0.22)",
                color: "#0A84FF",
              }}
            >
              Exportar CSV
            </button>
            <button
              onClick={clearData}
              className={btnSecondary}
              style={{
                background: "rgba(255,69,58,0.10)",
                border: "1px solid rgba(255,69,58,0.22)",
                color: "#FF453A",
              }}
            >
              Limpiar datos
            </button>
            <button
              onClick={goHome}
              className="text-xs font-medium transition-opacity hover:opacity-70 ml-1"
              style={{ color: "rgba(26,31,46,0.4)" }}
            >
              Salir →
            </button>
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-6 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total respuestas", value: responses.length },
              { label: "Cubículos y Laptops", value: responses.filter((r) => r.type === "cubiculos").length },
              { label: "Préstamo de Libros", value: responses.filter((r) => r.type === "prestamo").length },
              { label: "Encuesta General", value: responses.filter((r) => r.type === "general").length },
            ].map((s) => (
              <Glass key={s.label} className="p-5">
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "#5A6480" }}>{s.label}</p>
              </Glass>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.5)" }}>
            {([
              { key: "charts", label: "Gráficas" },
              { key: "history", label: "Historial" },
              { key: "comments", label: "Comentarios" },
            ] as { key: AdminTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAdminTab(key)}
                className={[
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  adminTab === key
                    ? "border-blue-500 text-foreground"
                    : "border-transparent hover:text-foreground",
                ].join(" ")}
                style={{ color: adminTab === key ? "#1A1F2E" : "#5A6480" }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Charts */}
          {adminTab === "charts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ── Donut chart ── */}
              <Glass className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">Distribución global de satisfacción</h3>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-sm" style={{ color: "#5A6480" }}>Sin datos aún</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <defs>
                        {/* Gradient per slice: bright center → lighter edge */}
                        <radialGradient id="pieGrad0" cx="40%" cy="40%" r="60%">
                          <stop offset="0%" stopColor="#4ADE80" stopOpacity={1} />
                          <stop offset="100%" stopColor="#16A34A" stopOpacity={0.75} />
                        </radialGradient>
                        <radialGradient id="pieGrad1" cx="40%" cy="40%" r="60%">
                          <stop offset="0%" stopColor="#FCD34D" stopOpacity={1} />
                          <stop offset="100%" stopColor="#D97706" stopOpacity={0.75} />
                        </radialGradient>
                        <radialGradient id="pieGrad2" cx="40%" cy="40%" r="60%">
                          <stop offset="0%" stopColor="#FCA5A5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#DC2626" stopOpacity={0.80} />
                        </radialGradient>
                      </defs>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius={62}
                        outerRadius={96}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={`pie-cell-${i}`} fill={`url(#pieGrad${i})`} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number, name) => [`${v} respuestas`, name]}
                        contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.90)", backdropFilter: "blur(12px)", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-1">
                  {[
                    { label: "Satisfecho", color: "#4ADE80" },
                    { label: "Regular", color: "#FCD34D" },
                    { label: "Insatisfecho", color: "#FCA5A5" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                      <span className="text-[11px]" style={{ color: "#5A6480" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </Glass>

              {/* ── Bar chart with per-bar gradients ── */}
              <Glass className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-5">Resultados por tipo de encuesta</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 8, left: -18, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C084FC" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7E22CE" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                        <stop offset="100%" stopColor="#065F46" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,132,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5A6480" }} />
                    <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 11, fill: "#5A6480" }} />
                    <Tooltip
                      formatter={(v) => [`${v}/3`, "Promedio"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.90)", backdropFilter: "blur(12px)", fontSize: 12 }}
                    />
                    <Bar dataKey="avg" radius={[7, 7, 0, 0]} isAnimationActive>
                      {barData.map((_, i) => (
                        <Cell key={`bar-cell-${i}`} fill={`url(#barGrad${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-1">
                  {barData.map((d, i) => {
                    const colors = ["#60A5FA", "#C084FC", "#34D399"];
                    return (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
                        <p className="text-[10px] font-mono" style={{ color: "#5A6480" }}>{d.count} resp.</p>
                      </div>
                    );
                  })}
                </div>
              </Glass>

              <Glass className="p-6 lg:col-span-2">
                <h3 className="text-sm font-semibold text-foreground mb-5">Tendencia diaria — últimos 14 días</h3>
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={trendData} margin={{ top: 5, right: 12, left: -18, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,132,255,0.08)" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#5A6480" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5A6480" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="respuestas" stroke="#30B0FF" strokeWidth={2.5} dot={{ r: 4, fill: "#30B0FF", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Glass>
            </div>
          )}

          {/* History */}
          {adminTab === "history" && (
            <Glass className="overflow-hidden">
              <div className="p-4 flex items-center gap-2 flex-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.6)" }}>
                <span className="text-xs font-medium mr-1" style={{ color: "#5A6480" }}>Filtrar:</span>
                {([
                  { key: "all", label: "Todas" },
                  { key: "cubiculos", label: "Cubículos" },
                  { key: "prestamo", label: "Préstamo" },
                  { key: "general", label: "General" },
                ] as { key: SurveyType | "all"; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setHistoryFilter(key)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: historyFilter === key ? "#0A84FF" : "rgba(255,255,255,0.5)",
                      color: historyFilter === key ? "#fff" : "#5A6480",
                      border: "1px solid rgba(255,255,255,0.65)",
                    }}
                  >
                    {label}
                  </button>
                ))}
                <span className="ml-auto text-xs font-mono" style={{ color: "rgba(90,100,128,0.6)" }}>{filteredHistory.length} registros</span>
              </div>
              {filteredHistory.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm" style={{ color: "#5A6480" }}>Sin respuestas registradas</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
                        {["Fecha", "Tipo", "P1", "P2", "P3", "P4", "P5", "Prom.", "Comentario"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#5A6480" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((r) => {
                        const avg = (r.answers.reduce((a, b) => a + b, 0) / r.answers.length).toFixed(1);
                        return (
                          <tr key={r.id} className="transition-colors hover:bg-white/20" style={{ borderBottom: "1px solid rgba(255,255,255,0.35)" }}>
                            <td className="px-4 py-3 font-mono text-xs" style={{ color: "#5A6480" }}>{r.date}</td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">{SURVEYS[r.type].title}</td>
                            {r.answers.map((a, i) => <td key={i} className="px-4 py-3 text-center">{ratingEmoji(a)}</td>)}
                            <td className="px-4 py-3 text-center font-mono font-bold text-sm" style={{ color: "#0A84FF" }}>{avg}</td>
                            <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: "#5A6480" }}>{r.comment ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Glass>
          )}

          {/* Comments */}
          {adminTab === "comments" && (
            <div className="space-y-3">
              {userComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20" style={{ color: "#5A6480" }}>
                  <p className="text-sm">No hay comentarios registrados aún.</p>
                </div>
              ) : (
                userComments.map((c, i) => (
                  <Glass key={i} className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        style={{ background: "rgba(10,132,255,0.1)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.2)" }}>
                        {SURVEYS[c.type].title}
                      </span>
                      <span className="text-xs font-mono ml-auto" style={{ color: "#5A6480" }}>{c.date}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
                  </Glass>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
