import Link from "next/link";

import { AuthForm } from "#/features/auth/components/auth-form";

export default function RegisterPage() {
  return (
    <>
      <AuthForm mode="register" />
      <p className="m-0 text-muted-text">
        Already have an account?{" "}
        <Link className="font-extrabold text-primary" href="/login">
          Sign in
        </Link>
      </p>
    </>
  );
}
