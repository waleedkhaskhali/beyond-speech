"use client";

import React from "react";
import { Check, BookOpen, Stethoscope, ClipboardList, School } from "lucide-react";

/* ----------------------------- Types ----------------------------- */
type Accent = "brand" | "accent" | "success" | "info";

type Service = {
  title: string;
  icon: React.ElementType;
  points: string[];
  accent?: Accent;
};

/* -------------------------- Data (typed) -------------------------- */
/* Using `satisfies` keeps literal types (so accent isn't widened to `string`) */
const services = [
  {
    title: "Speech, Language & Feeding Therapy",
    icon: Stethoscope,
    points: [
      "Pediatric & adult speech-language therapy",
      "Feeding therapy",
      "Fluency / stuttering",
      "AAC (augmentative & alternative communication)",
    ],
    accent: "brand",
  },
  {
    title: "Literacy & Math Tutoring",
    icon: BookOpen,
    points: [
      "Reading & writing (OG-informed)",
      "Math support",
      "Small-group options (e.g., OG Camp)",
    ],
    accent: "accent",
  },
  {
    title: "Evaluations",
    icon: ClipboardList,
    points: ["Speech-language evaluations", "Remote & in-person (where licensed)"],
    accent: "info",
  },
  {
    title: "Private SEIT / In-School Support",
    icon: School,
    points: ["In-school coverage by private providers", "Flexible scheduling with schools"],
    accent: "success",
  },
] satisfies ReadonlyArray<Service>;

/* --------------------------- Component --------------------------- */

export function ServicesModern() {
  return (
    <section id="services" className="relative overflow-hidden bg-gradient-to-br from-lime-50 via-yellow-50 to-amber-50">
      {/* Decorative blobs for liquid effect */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-lime-200/60 blur-3xl" />
        <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-yellow-200/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight">Our Services</h2>
          <p className="font-body mx-auto mt-3 max-w-2xl text-neutral-600">
            Comprehensive speech-language support for all ages. Private-pay with remote and in-person options available where licensed.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#contact"
            className="inline-block rounded-xl bg-blue-500 px-6 py-4 text-white font-semibold shadow-lg hover:bg-blue-600 hover:shadow-xl hover:scale-105 transition-all"
          >
            Request Services
          </a>
        </div>
      </div>
    </section>
  );
}

/* Small card with soft, premium feel */
function ServiceCard({ title, icon: Icon, points, accent = "brand" }: Service) {
  const ring =
    accent === "accent"
      ? "ring-accent/30"
      : accent === "success"
      ? "ring-success/30"
      : accent === "info"
      ? "ring-info/30"
      : "ring-brand/30";

  const iconBg =
    accent === "accent"
      ? "bg-accent/10"
      : accent === "success"
      ? "bg-success/10"
      : accent === "info"
      ? "bg-info/10"
      : "bg-brand/10";

  const iconColor =
    accent === "accent"
      ? "text-accent"
      : accent === "success"
      ? "text-success"
      : accent === "info"
      ? "text-info"
      : "text-brand";

  return (
    <div className={`group rounded-2xl bg-white p-6 shadow-lg ring-2 ${ring} transition hover:-translate-y-2 hover:shadow-2xl hover:ring-4`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-base font-semibold">{title}</h3>
      </div>

      <ul className="font-body mt-4 grid gap-2 text-sm text-neutral-700">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <Check className={`mt-0.5 h-4 w-4 ${iconColor}`} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
