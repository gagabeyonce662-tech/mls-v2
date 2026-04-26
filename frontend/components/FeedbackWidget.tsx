"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import { submitFeedback } from "@/lib/api";

type FeedbackType = "general" | "bug" | "feature";
const FEEDBACK_STORAGE_KEY = "feedback_submissions";

interface CachedFeedbackSubmission {
  id: number;
  feedbackType: FeedbackType;
  message: string;
  pageUrl: string;
  submittedAt: string;
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [lastSubmission, setLastSubmission] =
    useState<CachedFeedbackSubmission | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");

  const isValid = useMemo(() => message.trim().length >= 10, [message]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setFeedbackType("general");
    setMessage("");
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CachedFeedbackSubmission[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setLastSubmission(parsed[0]);
      }
    } catch (error) {
      console.warn("Could not read cached feedback submissions:", error);
    }
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState("idle");
    try {
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : "";
      const response = await submitFeedback({
        page_url: typeof window !== "undefined" ? window.location.href : "",
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        feedback_type: feedbackType,
        message: message.trim(),
      });

      const cachedEntry: CachedFeedbackSubmission = {
        id: response.id,
        feedbackType,
        message: message.trim(),
        pageUrl,
        submittedAt: new Date().toISOString(),
      };

      try {
        const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        const existing = raw ? (JSON.parse(raw) as CachedFeedbackSubmission[]) : [];
        const next = [cachedEntry, ...(Array.isArray(existing) ? existing : [])].slice(0, 20);
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.warn("Could not cache feedback submission locally:", error);
      }

      setLastSubmission(cachedEntry);
      setSubmitState("success");
      resetForm();
    } catch (error) {
      console.error("Feedback submission failed:", error);
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-ds-primary text-white shadow-lg px-4 py-3 text-sm font-semibold hover:opacity-90 transition"
        aria-label="Open feedback form"
      >
        <span className="inline-flex items-center gap-2">
          <MessageSquareText className="h-4 w-4" />
          Feedback
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center sm:justify-center p-3 sm:p-6">
          <div className="w-full sm:max-w-md rounded-2xl bg-white border border-ds-card-border shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ds-card-border">
              <h3 className="text-base font-semibold text-ds-heading">
                Share your feedback
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
                aria-label="Close feedback form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm"
                />
              </div>

              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm bg-white"
              >
                <option value="general">General feedback</option>
                <option value="bug">Report a bug</option>
                <option value="feature">Feature request</option>
              </select>

              <textarea
                placeholder="Tell us what worked well, what was confusing, or what you want next..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-ds-card-border px-3 py-2 text-sm resize-none"
                required
              />

              {submitState === "success" ? (
                <p className="text-sm text-green-700">
                  Thanks for the feedback. We received it.
                </p>
              ) : null}
              {submitState === "error" ? (
                <p className="text-sm text-red-600">
                  We could not submit feedback right now. Please retry.
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ds-body">
                  Minimum 10 characters for useful feedback.
                </p>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="rounded-lg bg-ds-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send feedback"}
                </button>
              </div>

              {lastSubmission ? (
                <p className="text-xs text-ds-body">
                  Last sent:{" "}
                  {new Date(lastSubmission.submittedAt).toLocaleString("en-CA")}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
