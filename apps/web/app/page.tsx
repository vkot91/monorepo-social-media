import Link from "next/link";
import { buttonVariants } from "#/components/ui/button";
import { cn } from "#/lib/utils";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center p-5 sm:p-8">
      <section className="grid w-full max-w-6xl items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] md:gap-12">
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">Social Media</p>
          <h1 className="max-w-3xl text-[44px] font-extrabold leading-[0.95] tracking-normal sm:text-6xl lg:text-[86px]">
            Share the day with people who matter.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-500">
            A focused social feed for posts, friendships, and everyday updates. Create an account to start building your
            circle.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className={buttonVariants()} href="/register">
              Create account
            </Link>
            <Link className={buttonVariants({ variant: "secondary" })} href="/login">
              Sign in
            </Link>
          </div>
        </div>
        <div
          className={cn(
            "grid gap-4 rounded-[28px] border border-stone-300 bg-stone-50 p-6 shadow-2xl shadow-slate-900/10",
          )}
          aria-label="Feed preview"
        >
          <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4">
            <div className="h-11 w-11 shrink-0 rounded-full bg-orange-300" />
            <div>
              <strong>Maya Johnson</strong>
              <p className="mt-1 text-slate-500">Planning a weekend photo walk downtown.</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 md:ml-11">
            <div className="h-11 w-11 shrink-0 rounded-full bg-emerald-500" />
            <div>
              <strong>Alex Chen</strong>
              <p className="mt-1 text-slate-500">Shared a new playlist with friends.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
