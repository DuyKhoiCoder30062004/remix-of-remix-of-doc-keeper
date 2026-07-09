import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — VaultSystem" },
      { name: "description", content: "Access your institutional document vault." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "register">("signin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="size-8 bg-foreground rounded-md grid place-items-center text-background text-xs font-semibold">
                V
              </div>
              <span className="font-semibold tracking-tight">VaultSystem</span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-balance mb-6">
              Secure infrastructure for institutional documents
            </h1>
            <p className="text-muted-foreground text-pretty max-w-[48ch]">
              Maintain complete chain of custody for sensitive files with granular permission sets and auditable access logs.
            </p>
          </div>

          <div className="bg-secondary ring-1 ring-border rounded-2xl p-8">
            <div className="flex gap-6 mb-8">
              <button
                onClick={() => setMode("signin")}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                  mode === "signin" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode("register")}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                  mode === "register" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
                }`}
              >
                Create account
              </button>
            </div>

            <form className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg ring-1 ring-border bg-background text-sm focus:outline-none focus:ring-ring"
                    placeholder="Jane Doe"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email address</label>
                <input
                  type="email"
                  className="w-full h-10 px-3 rounded-lg ring-1 ring-border bg-background text-sm focus:outline-none focus:ring-ring"
                  placeholder="name@firm.com"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
                  {mode === "signin" && (
                    <a href="#" className="text-xs text-primary hover:underline">
                      Reset?
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  className="w-full h-10 px-3 rounded-lg ring-1 ring-border bg-background text-sm focus:outline-none focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg hover:brightness-105 transition"
              >
                {mode === "signin" ? "Access documents" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}