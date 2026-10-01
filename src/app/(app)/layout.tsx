import Link from "next/link";
import { logout } from "@/app/actions";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="mx-auto flex max-w-lg items-center justify-between px-4 pt-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Lift<span className="text-accent">Log</span>
        </Link>
        <form action={logout}>
          <button className="text-sm text-muted underline-offset-4 hover:underline">Log out</button>
        </form>
      </header>
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
