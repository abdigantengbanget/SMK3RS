import React from "react";
import { CheckCircle2, AlertCircle, Info, ExternalLink, X } from "lucide-react";
import { useK3 } from "../context/K3Context";

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useK3();

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
          toast.type === "success"
            ? "bg-emerald-950 text-emerald-50 border-emerald-700/80 shadow-emerald-950/20"
            : toast.type === "error"
              ? "bg-rose-950 text-rose-50 border-rose-700/80 shadow-rose-950/20"
              : "bg-slate-900 text-slate-50 border-slate-700/80 shadow-slate-950/20"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {toast.type === "success" && (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          )}
          {toast.type === "info" && <Info className="h-5 w-5 text-blue-400" />}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {toast.message}
          </p>
          {toast.actionUrl && (
            <a
              href={toast.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold underline text-teal-300 hover:text-teal-200 transition-colors"
            >
              <span>{toast.actionLabel || "Buka Tautan"}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <button
          onClick={dismissToast}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Tutup pemberitahuan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
