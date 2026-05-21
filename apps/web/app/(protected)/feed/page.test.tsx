import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FeedPage from "./page";

vi.mock("#/features/posts/components/create-post-form", () => ({
  CreatePostForm: () => <form aria-label="Create post form" />,
}));

vi.mock("#/features/posts/components/posts-list", () => ({
  PostsList: ({ feedType }: { feedType: string }) => <section aria-label={`${feedType} posts`} />,
}));

describe("FeedPage", () => {
  it("renders the feed page shell", () => {
    render(<FeedPage />);

    expect(screen.getByRole("heading", { name: /your feed/i })).toBeInTheDocument();
    expect(screen.getByText(/protected feed/i)).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /create post form/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /all posts/i })).toBeInTheDocument();
  });
});
