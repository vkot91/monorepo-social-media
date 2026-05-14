"use client";

import { useActionState } from "react";

import { Button } from "#/components/ui/button";
import { FieldError, FormCard, TextArea } from "#/components/ui/form";
import { createPost } from "#/lib/api/posts/actions";
import { createIdleResponse } from "#/lib/api/requests/responses";

const createPostInitialState = createIdleResponse();

// Example of server action with form data and useActionState hook
export const CreatePostForm = () => {
  const [state, formAction, pending] = useActionState(createPost, createPostInitialState);
  const contentError = state.errors.content?.[0];

  return (
    <FormCard action={formAction} className="max-w-full">
      <TextArea invalid={!!contentError} minRows={4} name="content" aria-label="Create post" placeholder="What are you building today?" />
      <FieldError message={contentError} />
      <div className="text-right">
        <Button size="sm" disabled={pending} type="submit">
          Post
        </Button>
      </div>
    </FormCard>
  );
};
