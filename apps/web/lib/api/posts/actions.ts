"use server";

import { type CreatePostInput, createPostSchema, type PostDto } from "@social/contracts";
import { revalidatePath } from "next/cache";

import { createErrorResponse, createSuccessResponse } from "../requests/responses";
import { serverRequest } from "../requests/server-request";
import { ApiErrorResponse } from "../types";
import { generateCommonError } from "../utils/errors";

type CreatePostField = Extract<keyof CreatePostInput, string>;

export type CreatePostState = ApiErrorResponse<CreatePostField, PostDto>;

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
    return createErrorResponse("Please check your post and try again.", input.error.flatten().fieldErrors);
  }

  try {
    const post = await serverRequest("/posts", "POST", {
      body: input.data,
    });
    revalidatePath("/feed");

    return createSuccessResponse("Post created.", post);
  } catch (error) {
    return generateCommonError(error, "Post creation is unavailable right now.");
  }
}
