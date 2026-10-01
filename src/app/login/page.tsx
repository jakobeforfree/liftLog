import { login, signup } from "@/app/actions";
import { Notice, param } from "@/components/Notice";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Lift<span className="text-accent">Log</span>
        </h1>
        <p className="mt-1 text-muted">Log your lifts. Watch the numbers go up.</p>
      </div>
      <Notice error={param(sp, "error")} message={param(sp, "message")} />
      <form className="card flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={6}
            required
            className="input"
          />
        </div>
        <button formAction={login} className="btn">Log in</button>
        <button formAction={signup} className="btn-ghost">Create account</button>
      </form>
    </main>
  );
}
