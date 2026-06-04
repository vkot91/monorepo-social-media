"use client";

import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "#/shared/lib/utils";

import { isOptimizablePostImageUrl } from "./utils";

type PostImageProps = {
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  priority?: boolean;
  sizes: string;
  src: string;
};

export const PostImage = ({ alt, className, fit = "cover", priority = false, sizes, src }: PostImageProps) => {
  const isOptimizedImage = isOptimizablePostImageUrl(src);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(!isOptimizedImage);
  const imageClassName = cn(
    "h-full w-full transition-opacity duration-200",
    fit === "contain" ? "object-contain" : "object-cover",
    isLoaded ? "opacity-100" : "opacity-0",
    className,
  );

  const loader = !isLoaded ? (
    <div
      aria-label={`Loading ${alt.toLowerCase()}`}
      className="absolute inset-0 grid place-items-center bg-skeleton"
      role="status"
    >
      <LoaderCircle aria-hidden className="h-6 w-6 animate-spin text-primary" />
    </div>
  ) : null;

  if (isOptimizedImage) {
    return (
      <>
        {loader}
        <Image
          alt={alt}
          className={imageClassName}
          height={900}
          onLoad={() => setIsLoaded(true)}
          priority={priority}
          ref={imageRef}
          sizes={sizes}
          src={src}
          width={1200}
        />
      </>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} className={imageClassName} onLoad={() => setIsLoaded(true)} src={src} />;
};
