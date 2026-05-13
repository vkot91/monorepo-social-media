import Link from "next/link";
import { AuthForm } from "#/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <>
      <AuthForm mode="register" />
      <p className="m-0 text-slate-500">
        Already have an account?{" "}
        <Link className="font-extrabold text-blue-700" href="/login">
          Sign in
        </Link>
      </p>
    </>
  );
}
