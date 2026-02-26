"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectRequirements } from "@/types";
import CriteriaSliders from "./CriteriaSliders";

// ---- Option constants ----

const PROJECT_TYPES: { value: ProjectRequirements["project_type"]; label: string }[] = [
  { value: "web_app", label: "Web Application" },
  { value: "mobile_app", label: "Mobile Application" },
  { value: "api_service", label: "API Service" },
  { value: "data_pipeline", label: "Data Pipeline" },
  { value: "e_commerce", label: "E-Commerce" },
  { value: "saas", label: "SaaS" },
  { value: "ml_platform", label: "ML Platform" },
  { value: "iot", label: "IoT" },
  { value: "cli_tool", label: "CLI Tool" },
  { value: "library", label: "Library" },
];

const EXPECTED_USERS: { value: ProjectRequirements["expected_users"]; label: string }[] = [
  { value: "< 1K", label: "< 1K" },
  { value: "1K-100K", label: "1K - 100K" },
  { value: "100K-1M", label: "100K - 1M" },
  { value: "1M-10M", label: "1M - 10M" },
  { value: "10M+", label: "10M+" },
];

const BUDGETS: { value: ProjectRequirements["budget"]; label: string }[] = [
  { value: "bootstrap", label: "Bootstrap" },
  { value: "startup", label: "Startup" },
  { value: "mid_range", label: "Mid-Range" },
  { value: "enterprise", label: "Enterprise" },
];

const EXPERIENCE_LEVELS: { value: ProjectRequirements["team_experience"]; label: string }[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "mixed", label: "Mixed" },
];

const TIMELINES: { value: ProjectRequirements["timeline"]; label: string }[] = [
  { value: "1_month", label: "1 Month" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "12_months", label: "12 Months" },
];

const LANGUAGES = [
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C#",
  "Ruby",
  "Elixir",
  "PHP",
];

const COMPLIANCE_OPTIONS = ["HIPAA", "SOC2", "GDPR", "PCI-DSS", "FedRAMP"];

const DEFAULT_PRIORITIES: Record<string, number> = {
  scalability: 5,
  cost: 5,
  developer_experience: 5,
  performance: 5,
  security: 5,
};

// ---- Helpers ----

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

// ---- Component ----

export default function RequirementsForm() {
  const router = useRouter();

  // Form state
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [expectedUsers, setExpectedUsers] = useState("");
  const [budget, setBudget] = useState("");
  const [teamSize, setTeamSize] = useState<number | "">("");
  const [teamExperience, setTeamExperience] = useState("");
  const [timeline, setTimeline] = useState("");
  const [languagePreferences, setLanguagePreferences] = useState<string[]>([]);
  const [complianceNeeds, setComplianceNeeds] = useState<string[]>([]);
  const [existingStack, setExistingStack] = useState("");
  const [priorities, setPriorities] = useState<Record<string, number>>(DEFAULT_PRIORITIES);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ---- Validation ----

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!projectDescription.trim()) next.project_description = "Project description is required.";
    if (!projectType) next.project_type = "Please select a project type.";
    if (!expectedUsers) next.expected_users = "Please select expected users.";
    if (!budget) next.budget = "Please select a budget.";
    if (teamSize === "" || teamSize < 1) next.team_size = "Team size must be at least 1.";
    if (!teamExperience) next.team_experience = "Please select team experience.";
    if (!timeline) next.timeline = "Please select a timeline.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ---- Submit ----

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    const body: ProjectRequirements = {
      project_description: projectDescription.trim(),
      project_type: projectType as ProjectRequirements["project_type"],
      expected_users: expectedUsers as ProjectRequirements["expected_users"],
      budget: budget as ProjectRequirements["budget"],
      team_size: Number(teamSize),
      team_experience: teamExperience as ProjectRequirements["team_experience"],
      timeline: timeline as ProjectRequirements["timeline"],
      language_preferences: languagePreferences,
      compliance_needs: complianceNeeds,
      existing_stack: existingStack.trim() || null,
      priorities,
    };

    setSubmitting(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ??
        (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
      const res = await fetch(`${apiBase}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(
          errBody?.detail ?? `Server error (${res.status})`
        );
      }

      const data: { session_id: string } = await res.json();
      router.push(`/evaluate?session=${data.session_id}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Shared styles ----

  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1";
  const inputBase =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";
  const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";
  const sectionClass =
    "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* ---- Project Details ---- */}
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Project Details
        </h2>

        <div className="space-y-4">
          {/* Project Description */}
          <div>
            <label htmlFor="project_description" className={labelClass}>
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="project_description"
              rows={4}
              placeholder="Describe your project, its goals, and key features..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className={inputBase}
            />
            {errors.project_description && (
              <p className={errorClass}>{errors.project_description}</p>
            )}
          </div>

          {/* Project Type + Expected Users (side by side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project_type" className={labelClass}>
                Project Type <span className="text-red-500">*</span>
              </label>
              <select
                id="project_type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className={inputBase}
              >
                <option value="">Select type...</option>
                {PROJECT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.project_type && (
                <p className={errorClass}>{errors.project_type}</p>
              )}
            </div>

            <div>
              <label htmlFor="expected_users" className={labelClass}>
                Expected Users <span className="text-red-500">*</span>
              </label>
              <select
                id="expected_users"
                value={expectedUsers}
                onChange={(e) => setExpectedUsers(e.target.value)}
                className={inputBase}
              >
                <option value="">Select range...</option>
                {EXPECTED_USERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.expected_users && (
                <p className={errorClass}>{errors.expected_users}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Team & Timeline ---- */}
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Team & Timeline
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Team Size */}
            <div>
              <label htmlFor="team_size" className={labelClass}>
                Team Size <span className="text-red-500">*</span>
              </label>
              <input
                id="team_size"
                type="number"
                min={1}
                placeholder="e.g. 5"
                value={teamSize}
                onChange={(e) =>
                  setTeamSize(e.target.value === "" ? "" : Number(e.target.value))
                }
                className={inputBase}
              />
              {errors.team_size && (
                <p className={errorClass}>{errors.team_size}</p>
              )}
            </div>

            {/* Team Experience */}
            <div>
              <label htmlFor="team_experience" className={labelClass}>
                Team Experience <span className="text-red-500">*</span>
              </label>
              <select
                id="team_experience"
                value={teamExperience}
                onChange={(e) => setTeamExperience(e.target.value)}
                className={inputBase}
              >
                <option value="">Select level...</option>
                {EXPERIENCE_LEVELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.team_experience && (
                <p className={errorClass}>{errors.team_experience}</p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <label htmlFor="timeline" className={labelClass}>
                Timeline <span className="text-red-500">*</span>
              </label>
              <select
                id="timeline"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className={inputBase}
              >
                <option value="">Select timeline...</option>
                {TIMELINES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.timeline && (
                <p className={errorClass}>{errors.timeline}</p>
              )}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className={labelClass}>
              Budget <span className="text-red-500">*</span>
            </label>
            <select
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={inputBase}
            >
              <option value="">Select budget...</option>
              {BUDGETS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {errors.budget && (
              <p className={errorClass}>{errors.budget}</p>
            )}
          </div>
        </div>
      </section>

      {/* ---- Preferences ---- */}
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Preferences
        </h2>

        <div className="space-y-5">
          {/* Language Preferences */}
          <div>
            <span className={labelClass}>Language Preferences</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = languagePreferences.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguagePreferences(toggleItem(languagePreferences, lang))}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compliance Needs */}
          <div>
            <span className={labelClass}>Compliance Needs</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMPLIANCE_OPTIONS.map((item) => {
                const selected = complianceNeeds.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setComplianceNeeds(toggleItem(complianceNeeds, item))}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing Stack */}
          <div>
            <label htmlFor="existing_stack" className={labelClass}>
              Existing Stack <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="existing_stack"
              rows={2}
              placeholder="e.g. React, Node.js, PostgreSQL, AWS..."
              value={existingStack}
              onChange={(e) => setExistingStack(e.target.value)}
              className={inputBase}
            />
          </div>
        </div>
      </section>

      {/* ---- Priority Weights ---- */}
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Priority Weights
        </h2>
        <p className="text-sm text-zinc-500 mb-5">
          Adjust the sliders to indicate how important each criterion is for your project.
        </p>
        <CriteriaSliders priorities={priorities} onChange={setPriorities} />
      </section>

      {/* ---- API Error ---- */}
      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {apiError}
        </div>
      )}

      {/* ---- Submit ---- */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-950"
      >
        {submitting ? "Creating session..." : "Evaluate My Stack"}
      </button>
    </form>
  );
}
