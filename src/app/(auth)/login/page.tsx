import { redirect } from "next/navigation";
import { isAuthed, setSessionCookie } from "@/lib/auth/session";
import { Wallet, LockKeyhole, ArrowRight } from "lucide-react";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.APP_PASSWORD) {
    redirect("/login?error=1");
  }
  await setSessionCookie();
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.18),transparent_60%)]" />
        <div className="absolute bottom-[-20%] right-[-10%] size-[500px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.12),transparent_60%)]" />
      </div>

      <form
        action={login}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="size-11 rounded-xl bg-foreground/5 grid place-items-center border border-border">
            <Wallet className="size-5 text-foreground" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Munim</div>
            <div className="text-xs text-muted-fg">Your money, organised.</div>
          </div>
        </div>

        <label htmlFor="password" className="text-[10px] uppercase tracking-wider text-muted-fg font-medium flex items-center gap-1.5">
          <LockKeyhole className="size-3" /> Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-border bg-background text-foreground px-3 py-2.5 outline-none placeholder:text-muted-fg focus:border-foreground/40 transition"
          placeholder="••••••••••••"
        />
        {error && (
          <p className="mt-2 text-xs text-negative">Wrong password. Try again.</p>
        )}
        <button
          type="submit"
          style={{ background: "#f4f4f5", color: "#09090b" }}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg font-medium py-2.5 hover:opacity-90 transition active:scale-[0.99]"
        >
          <span>Unlock</span>
          <ArrowRight className="size-4" />
        </button>

        <p className="mt-6 text-center text-[11px] text-muted-fg">
          Single-user · password-gated · zero analytics
        </p>
      </form>
    </main>
  );
}
