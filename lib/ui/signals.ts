import type { Signal } from "@/lib/types";

export function signalText(signal: Signal): string {
  switch (signal) {
    case "positive":
      return "text-emerald-400";
    case "negative":
      return "text-red-400";
    default:
      return "text-zinc-400";
  }
}

export function signalBg(signal: Signal): string {
  switch (signal) {
    case "positive":
      return "bg-emerald-500/10 border-emerald-500/25";
    case "negative":
      return "bg-red-500/10 border-red-500/25";
    default:
      return "bg-white/[0.03] border-white/[0.06]";
  }
}

export function signalDot(signal: Signal): string {
  switch (signal) {
    case "positive":
      return "bg-emerald-400";
    case "negative":
      return "bg-red-400";
    default:
      return "bg-zinc-500";
  }
}

export function signalLabel(signal: Signal): string {
  switch (signal) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    default:
      return "Neutral";
  }
}

export function severityText(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "low":
      return "text-emerald-400";
    case "medium":
      return "text-amber-400";
    case "high":
      return "text-red-400";
  }
}

export function severityBg(severity: "low" | "medium" | "high"): string {
  switch (severity) {
    case "low":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    case "high":
      return "bg-red-500/10 text-red-400 border-red-500/25";
  }
}

export function ratingText(rating: "Strong" | "Adequate" | "Weak"): string {
  switch (rating) {
    case "Strong":
      return "text-emerald-400";
    case "Adequate":
      return "text-amber-400";
    case "Weak":
      return "text-red-400";
  }
}

export function riskOverallText(risk: "Low" | "Medium" | "High"): string {
  switch (risk) {
    case "Low":
      return "text-emerald-400";
    case "Medium":
      return "text-amber-400";
    case "High":
      return "text-red-400";
  }
}
