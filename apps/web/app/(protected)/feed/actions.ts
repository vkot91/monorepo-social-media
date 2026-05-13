"use server";

import { createPostSchema, type CreatePostInput } from "@social/contracts";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiRequestError, AuthRequiredError } from "#/lib/api/errors";
import { postsApi } from "#/lib/api/posts/actions";

type CreatePostFieldErrors = Partial<Record<keyof CreatePostInput, string[]>>;

export type CreatePostState = {
  errors: CreatePostFieldErrors;
  message: string | null;
  status: "error" | "idle" | "success";
};

export const createPostInitialState: CreatePostState = {
  errors: {},
  message: null,
  status: "idle",
};

const getStringValue = (formData: FormData, name: string) => {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
};

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const imageUrl = getStringValue(formData, "imageUrl").trim();
  const visibility = getStringValue(formData, "visibility");
  const input = createPostSchema.safeParse({
    content: getStringValue(formData, "content"),
    imageUrl: imageUrl.length > 0 ? imageUrl : null,
    visibility: visibility.length > 0 ? visibility : undefined,
  });

  if (!input.success) {
    return {
      errors: input.error.flatten().fieldErrors,
      message: "Please check your post and try again.",
      status: "error",
    };
  }

  try {
    await postsApi.create(input.data);
    revalidatePath("/feed");

    return {
      errors: {},
      message: "Post created.",
      status: "success",
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    return {
      errors: {},
      message:
        error instanceof ApiRequestError
          ? error.message
          : "Post creation is unavailable right now.",
      status: "error",
    };
  }
}
