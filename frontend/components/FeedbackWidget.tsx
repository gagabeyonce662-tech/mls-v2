"use client";

import { MessageCircle } from "lucide-react";

export default function FeedbackWidget() {
  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <a
          href="https://wa.me/14168214200"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366] text-white shadow-lg px-4 py-3 text-sm font-semibold hover:opacity-90 transition"
          aria-label="Speak to us on WhatsApp"
        >
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Speak to us
          </span>
        </a>

        {/* Feedback disabled for now
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-ds-primary text-white shadow-lg px-4 py-3 text-sm font-semibold hover:opacity-90 transition"
          aria-label="Open feedback form"
        >
          <span className="inline-flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Feedback
          </span>
        </button>
        */}
      </div>

      {/* Feedback modal disabled for now
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
      */}
    </>
  );
}
