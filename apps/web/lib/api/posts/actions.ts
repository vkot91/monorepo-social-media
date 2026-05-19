"use server";

import { type CreatePostInput, createPostSchema, type PostDto } from "@social/contracts";
import { revalidatePath } from "next/cache";

import { createErrorActionResult, createSuccessActionResult } from "../requests/responses";
import { serverRequest } from "../requests/server-request";
import { ActionResult } from "../types";
import { createCommonActionError } from "../utils/errors";

type CreatePostField = Extract<keyof CreatePostInput, string>;

export type CreatePostState = ActionResult<CreatePostField, PostDto>;

// Example of server action with form data and useActionState hook
const getStringValue = (formData: FormData, name: string) => {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
};

export async function createPost(_prevState: CreatePostState, formData: FormData): Promise<CreatePostState> {
  const imageUrl = getStringValue(formData, "imageUrl").trim();
  const visibility = getStringValue(formData, "visibility");

  const input = createPostSchema.safeParse({
    content: getStringValue(formData, "content"),
    imageUrl: imageUrl.length > 0 ? imageUrl : null,
    visibility: visibility.length > 0 ? visibility : undefined,
  });

  if (!input.success) {
    return createErrorActionResult("Please check your post and try again.", input.error.flatten().fieldErrors);
  }

  try {
    const post = await serverRequest("/posts", "POST", {
      body: input.data,
    });
    revalidatePath("/feed");

    return createSuccessActionResult("Post created.", post);
  } catch (error) {
    return createCommonActionError(error, "Post creation is unavailable right now.");
  }
}
