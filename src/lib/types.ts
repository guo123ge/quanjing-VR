import type {
  FloorplanFileType,
  ImageProvider,
  RoomType,
} from "@prisma/client";

export type UploadRequirement = {
  type: FloorplanFileType;
  title: string;
  accept: string;
  maxSizeMb: number;
  checks: string[];
  failureTips: string[];
};

export type DetectedRoomInput = {
  name: string;
  roomType: RoomType;
  confidence: number;
  adjacency: string[];
  order: number;
};

export type ProviderStatus = {
  provider: ImageProvider;
  label: string;
  configured: boolean;
  note: string;
};

export type GenerationResult = {
  imageUrl: string;
  prompt: string;
  provider: ImageProvider;
  model: string;
};
