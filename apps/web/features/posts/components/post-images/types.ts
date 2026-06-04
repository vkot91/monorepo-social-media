export type ExistingManagedPostImage = {
  id: string;
  imageId?: string;
  imageUrl: string;
  kind: "existing";
};

export type LocalManagedPostImage = {
  file: File;
  id: string;
  kind: "local";
  previewUrl: string;
};

export type ManagedPostImage = ExistingManagedPostImage | LocalManagedPostImage;
