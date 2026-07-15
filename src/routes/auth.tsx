import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiErrorMessage } from "@/lib/api";

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
  const [email, setEmail] = useState("admin@firm.com");
  const [password, setPassword] = useState("admin123");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") await login(email, password);
      else await register(name, email, password);
      navigate({ to: "/" });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

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
            <p className="text-muted-foreground text-pretty max-w-[48ch] mb-6">
              Maintain complete chain of custody for sensitive files with granular permission sets and auditable access logs.
            </p>
            <div className="text-xs text-muted-foreground space-y-1 p-4 rounded-lg ring-1 ring-border bg-secondary/40">
              <p className="font-semibold text-foreground">Prototype accounts</p>
              <p>Admin — <code>admin@firm.com</code> / <code>admin123</code></p>
              <p>User — <code>sarah@firm.com</code> / <code>sarah123</code></p>
            </div>
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

            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-lg ring-1 ring-border bg-background text-sm focus:outline-none focus:ring-ring"
                    placeholder="Jane Doe"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg ring-1 ring-border bg-background text-sm focus:outline-none focus:ring-ring"
                  placeholder="name@firm.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg ring-1 ring-border bg-background text-sm focus:outline-none focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg hover:brightness-105 transition disabled:opacity-60"
              >
                {submitting ? "…" : mode === "signin" ? "Access documents" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
