import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ImageIcon,
  Sparkles,
  RefreshCw,
  Download,
  Wand2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Point this at your running FastAPI server.
// In development: http://localhost:8000
// In production: your deployed API URL (e.g. https://api.yourdomain.com)
// ---------------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Status = "idle" | "loading" | "ready" | "error";

// ---------------------------------------------------------------------------
// Preview card
// ---------------------------------------------------------------------------
interface PreviewProps {
  label: string;
  src: string | null;
  loading?: boolean;
  accent?: boolean;
}

function PreviewCard({ label, src, loading, accent }: PreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-2xl p-5 flex flex-col items-center gap-4"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        {accent && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-gradient-primary text-primary-foreground font-medium">
            Restored
          </span>
        )}
      </div>
      <div
        className={`relative w-64 h-64 rounded-xl overflow-hidden bg-muted/40 border border-border ${
          accent ? "glow-ring" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {src && !loading && (
            <motion.img
              key={src}
              src={src}
              alt={label}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center" }}
            />
          )}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute inset-0 animate-shimmer" />
              <div className="relative flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary"
                />
                <span className="text-xs text-muted-foreground tracking-wide">
                  Removing filters…
                </span>
              </div>
            </motion.div>
          )}
          {!src && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/60">
              <ImageIcon className="w-10 h-10" strokeWidth={1.2} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FilterRemover() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl]   = useState<string | null>(null);
  const [restoredUrl, setRestoredUrl]   = useState<string | null>(null);
  const [status, setStatus]             = useState<Status>("idle");
  const [errorMsg, setErrorMsg]         = useState<string>("");
  const [drag, setDrag]                 = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke old object URL to avoid memory leaks
  const revokeRestored = () => {
    if (restoredUrl) URL.revokeObjectURL(restoredUrl);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setOriginalFile(file);
    setOriginalUrl(URL.createObjectURL(file));
    revokeRestored();
    setRestoredUrl(null);
    setStatus("idle");
    setErrorMsg("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------
  // Send the image to the FastAPI backend and receive a JPEG blob back
  // -------------------------------------------------------------------
  const runRemoval = useCallback(async () => {
    if (!originalFile) return;
    setStatus("loading");
    setErrorMsg("");
    revokeRestored();
    setRestoredUrl(null);

    try {
      const form = new FormData();
      form.append("file", originalFile);

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(detail?.detail ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setRestoredUrl(url);
      setStatus("ready");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error. Is the backend running?";
      setErrorMsg(message);
      setStatus("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    revokeRestored();
    setOriginalFile(null);
    setOriginalUrl(null);
    setRestoredUrl(null);
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl animate-float-orb" />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl animate-float-orb"
          style={{ animationDelay: "3s" }}
        />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
        {/* Nav */}
        <header className="flex items-center justify-between mb-12 md:mb-20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center glow-ring">
              <Wand2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold tracking-tight">Unfilter</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            AI engine online
          </span>
        </header>

        {/* Hero */}
        <section className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs tracking-wide mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Reverse filters with neural precision</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-4xl md:text-6xl font-bold leading-[1.05] mb-5"
          >
            Strip every filter. <br />
            <span className="text-gradient">Reveal the real photo.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg"
          >
            Upload an image and our model removes color casts, fake glow and
            over-processed effects — restoring a natural, true-to-life look.
          </motion.p>
        </section>

        {/* Main */}
        <AnimatePresence mode="wait">
          {!originalUrl ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                className={`glass relative block rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  drag
                    ? "border-primary scale-[1.01] glow-ring"
                    : "border-border hover:border-primary/60 hover:scale-[1.005]"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <div className="flex flex-col items-center justify-center text-center px-6 py-16 md:py-24">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 glow-ring"
                  >
                    <Upload className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2">
                    Drop a photo to begin
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Drag &amp; drop your image here, or click to browse. JPG, PNG
                    and WebP supported.
                  </p>
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium glow-ring">
                    <ImageIcon className="w-4 h-4" />
                    Choose image
                  </span>
                </div>
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-6 place-items-center">
                <PreviewCard label="Before" src={originalUrl} />
                <PreviewCard
                  label="After"
                  src={restoredUrl}
                  loading={status === "loading"}
                  accent
                />
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive text-sm max-w-xl mx-auto"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Show "Remove filters" when idle or after an error */}
                {(status === "idle" || status === "error") && (
                  <button
                    onClick={runRemoval}
                    className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold tracking-wide glow-ring cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_oklch(1_0_0/0.5)] active:translate-y-0 transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    {status === "error" ? "Try again" : "Remove filters"}
                  </button>
                )}

                {/* Processing spinner button (non-clickable) */}
                {status === "loading" && (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold tracking-wide opacity-60 cursor-not-allowed"
                  >
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full inline-block"
                    />
                    Processing…
                  </button>
                )}

                <button
                  onClick={reset}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full glass cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm font-semibold hover:-translate-y-0.5 active:translate-y-0"
                >
                  <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                  Upload another
                </button>

                {status === "ready" && restoredUrl && (
                  <a
                    href={restoredUrl}
                    download="unfiltered.jpg"
                    className="group inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold tracking-wide glow-ring cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_oklch(1_0_0/0.5)] active:translate-y-0 transition-all duration-300"
                  >
                    <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                    Download result
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features strip */}
        <section className="grid sm:grid-cols-2 gap-4 mt-20">
          {[
            {
              t: "Filter Detection",
              d: "Identifies common Instagram-style overlays and color presets.",
            },
            {
              t: "Server-Side AI",
              d: "Processing happens on our secure backend. Your photo is never stored.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-5"
            >
              <h4 className="font-semibold mb-1.5">{f.t}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </motion.div>
          ))}
        </section>

        <footer className="mt-20 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Unfilter — Restore the real you.</span>
          <span className="flex items-center gap-4">
            <a className="hover:text-foreground transition-colors" href="#">Privacy</a>
            <a className="hover:text-foreground transition-colors" href="#">Terms</a>
            <a className="hover:text-foreground transition-colors" href="#">Contact</a>
          </span>
        </footer>
      </div>
    </div>
  );
}
