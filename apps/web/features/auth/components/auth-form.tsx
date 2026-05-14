"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from "@social/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type FieldValues, type Path, useForm, type UseFormSetError } from "react-hook-form";

import { AppLogo } from "#/components/layout/app-logo";
import { Button } from "#/components/ui/button";
import { Field, FormCard, FormError, Input } from "#/components/ui/form";
import { login, signup } from "#/lib/api/auth/actions";
import { ApiFieldErrors } from "#/lib/api/types";

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
};

const getFieldErrorMessage = (message: unknown) => (typeof message === "string" ? message : undefined);

const setServerErrors = <TValues extends FieldValues>(
  setError: UseFormSetError<TValues>,
  errors: ApiFieldErrors<Extract<keyof TValues, string>>,
) => {
  for (const [name, messages] of Object.entries(errors)) {
    const message = messages?.[0];

    if (message) {
      setError(name as Path<TValues>, {
        message,
        type: "server",
      });
    }
  }
};

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
      <AppLogo className="mb-5" />
      <h1 className="m-0 text-4xl font-extrabold tracking-normal">{copy.heading}</h1>
      <p className="text-muted-text">{copy.subheading}</p>
    </div>
  );
}

function LoginAuthForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    clearErrors,
    handleSubmit,
    register,
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  async function onSubmit(values: LoginInput) {
    clearErrors();
    setFormError(null);

    try {
      const result = await login(values);

      if (result.status === "success") {
        router.replace("/feed");
        router.refresh();
        return;
      }

      setFormError(result.message);
      setServerErrors(setError, result.errors);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  }

  const emailError = getFieldErrorMessage(errors.email?.message);
  const passwordError = getFieldErrorMessage(errors.password?.message);

  return (
    <FormCard onSubmit={handleSubmit(onSubmit)}>
      <AuthHeader mode="login" />

      <Field error={emailError} label="Email">
        <Input autoComplete="email" invalid={Boolean(emailError)} type="email" {...register("email")} />
      </Field>

      <Field error={passwordError} label="Password">
        <Input
          autoComplete="current-password"
          invalid={Boolean(passwordError)}
          type="password"
          {...register("password")}
        />
      </Field>

      <FormError>{formError}</FormError>

      <Button loading={isSubmitting} type="submit">
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
    clearErrors,
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  async function onSubmit(values: RegisterInput) {
    clearErrors();
    setFormError(null);

    try {
      const result = await signup(values);

      if (result.status === "success") {
        router.replace("/feed");
        router.refresh();
        return;
      }

      setFormError(result.message);
      setServerErrors(setError, result.errors);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    }
  }

  const displayNameError = getFieldErrorMessage(errors.displayName?.message);
  const usernameError = getFieldErrorMessage(errors.username?.message);
  const emailError = getFieldErrorMessage(errors.email?.message);
  const passwordError = getFieldErrorMessage(errors.password?.message);

  return (
    <FormCard onSubmit={handleSubmit(onSubmit)}>
      <AuthHeader mode="register" />

      <Field error={displayNameError} label="Display name">
        <Input autoComplete="name" invalid={Boolean(displayNameError)} type="text" {...register("displayName")} />
      </Field>

      <Field error={usernameError} label="Username">
        <Input autoComplete="username" invalid={Boolean(usernameError)} type="text" {...register("username")} />
      </Field>

      <Field error={emailError} label="Email">
        <Input autoComplete="email" invalid={Boolean(emailError)} type="email" {...register("email")} />
      </Field>

      <Field error={passwordError} label="Password">
        <Input autoComplete="new-password" invalid={Boolean(passwordError)} type="password" {...register("password")} />
      </Field>

      <FormError>{formError}</FormError>

      <Button loading={isSubmitting} type="submit">
        {isSubmitting ? "Please wait..." : authCopy.register.button}
      </Button>
    </FormCard>
  );
}
