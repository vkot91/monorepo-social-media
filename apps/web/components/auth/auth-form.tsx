"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@social/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "#/components/ui/button";
import { Field, FormCard, FormError } from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { authClientApi } from "#/lib/api/auth/client-actions";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const authCopy = {
  login: {
    button: "Sign in",
    heading: "Welcome back",
    subheading: "Sign in to catch up with your friends and conversations.",
  },
  register: {
    button: "Create account",
    heading: "Create your account",
    subheading: "Join the community and start building your social graph.",
  },
} satisfies Record<AuthMode, { button: string; heading: string; subheading: string }>;

const getFieldErrorMessage = (message: unknown) =>
  typeof message === "string" ? message : undefined;

export const AuthForm = ({ mode }: AuthFormProps) => {
  if (mode === "login") {
    return <LoginAuthForm />;
  }

  return <RegisterAuthForm />;
};

function AuthHeader({ mode }: AuthFormProps) {
  const copy = authCopy[mode];

  return (
    <div>
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
        Social Media
      </p>
      <h1 className="m-0 text-4xl font-extrabold tracking-normal">{copy.heading}</h1>
      <p className="text-slate-500">{copy.subheading}</p>
    </div>
  );
}

function LoginAuthForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginInput>({
    mode: "onBlur",
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    try {
      await authClientApi.login(values);
      router.replace("/feed");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  }

  return (
    <FormCard onSubmit={handleSubmit(onSubmit)}>
      <AuthHeader mode="login" />

      <Field error={getFieldErrorMessage(errors.email?.message)} label="Email">
        <Input autoComplete="email" type="email" {...register("email")} />
      </Field>

      <Field error={getFieldErrorMessage(errors.password?.message)} label="Password">
        <Input autoComplete="current-password" type="password" {...register("password")} />
      </Field>

      <FormError>{formError}</FormError>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait..." : authCopy.login.button}
      </Button>
    </FormCard>
  );
}

function RegisterAuthForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);

    try {
      await authClientApi.register(values);
      router.replace("/feed");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  }

  return (
    <FormCard onSubmit={handleSubmit(onSubmit)}>
      <AuthHeader mode="register" />

      <Field error={getFieldErrorMessage(errors.displayName?.message)} label="Display name">
        <Input autoComplete="name" type="text" {...register("displayName")} />
      </Field>

      <Field error={getFieldErrorMessage(errors.username?.message)} label="Username">
        <Input autoComplete="username" type="text" {...register("username")} />
      </Field>

      <Field error={getFieldErrorMessage(errors.email?.message)} label="Email">
        <Input autoComplete="email" type="email" {...register("email")} />
      </Field>

      <Field error={getFieldErrorMessage(errors.password?.message)} label="Password">
        <Input autoComplete="new-password" type="password" {...register("password")} />
      </Field>

      <FormError>{formError}</FormError>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Please wait..." : authCopy.register.button}
      </Button>
    </FormCard>
  );
}
