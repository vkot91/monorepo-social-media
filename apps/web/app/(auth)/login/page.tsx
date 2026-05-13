import { AuthForm } from "#/components/auth/auth-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" />
      <p className="m-0 text-slate-500">
        New here?{" "}
        <Link className="font-extrabold text-blue-700" href="/register">
          Create an account
        </Link>
      </p>
    </>
  );
}
