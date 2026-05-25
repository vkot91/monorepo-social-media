"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from "@social/contracts";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Logo } from "#/shared/ui";
import { Button } from "#/shared/ui/button";
import { Field, FormCard, Input } from "#/shared/ui/form";

import { login, register as registerAccount } from "../api/mutations";

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

export const AuthForm = ({ mode }: AuthFormProps) => {
  if (mode === "login") {
    return <LoginAuthForm />;
  }

  return <RegisterAuthForm />;
};

const AuthHeader = ({ mode }: AuthFormProps) => {
  const copy = authCopy[mode];

  return (
    <div>
      <Logo className="mb-5" />
      <h1 className="m-0 text-4xl font-extrabold tracking-normal">{copy.heading}</h1>
      <p className="text-muted-text">{copy.subheading}</p>
    </div>
  );
};

const LoginAuthForm = () => {
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: login,
    meta: {
      toastErrorTitle: "Sign in failed",
    },
    onSuccess: () => {
      router.replace("/feed");
    },
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = (values: LoginInput) => {
    loginMutation.mutate(values);
  };

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

      <Button loading={isSubmitting || loginMutation.isPending} type="submit">
        {isSubmitting ? "Please wait..." : authCopy.login.button}
      </Button>
    </FormCard>
  );
};

const RegisterAuthForm = () => {
  const router = useRouter();

  const registerMutation = useMutation({
    mutationFn: registerAccount,
    meta: {
      toastErrorTitle: "Account creation failed",
    },
    onSuccess: () => {
      router.replace("/feed");
      router.refresh();
    },
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const onSubmit = (values: RegisterInput) => {
    registerMutation.mutate(values);
  };

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

      <Button loading={isSubmitting || registerMutation.isPending} type="submit">
        {isSubmitting ? "Please wait..." : authCopy.register.button}
      </Button>
    </FormCard>
  );
};
