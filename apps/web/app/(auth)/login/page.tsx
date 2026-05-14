import Link from "next/link";

import { AuthForm } from "#/features/auth/components/auth-form";

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" />
      <p className="m-0 text-muted-text">
        New here?{" "}
        <Link className="font-extrabold text-primary" href="/register">
          Create an account
        </Link>
      </p>
    </>
  );
}
