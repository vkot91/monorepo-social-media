"use client";

import { Globe, Users } from "lucide-react";

import { DropdownMenu } from "#/shared/ui";

import { visibilityConfig } from "../helpers/constants";

export type PostVisibility = "PUBLIC" | "FRIENDS";

type PostVisibilityPickerProps = {
  onChange: (value: PostVisibility) => void;
  value: PostVisibility;
};

export const PostVisibilityPicker = ({ onChange, value }: PostVisibilityPickerProps) => {
  const { Icon, label } = visibilityConfig[value];

  return (
    <DropdownMenu
      align="start"
      items={[
        { icon: Globe, label: "Public", onSelect: () => onChange("PUBLIC") },
        { icon: Users, label: "Friends", onSelect: () => onChange("FRIENDS") },
      ]}
      label="Change post visibility"
      trigger={
        <>
          <Icon aria-hidden className="h-4 w-4" />
          <span>{label}</span>
        </>
      }
      triggerClassName="gap-2 text-sm font-bold"
    />
  );
};
