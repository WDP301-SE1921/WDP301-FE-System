export interface SignedAccessUrl {
  url: string;
  expiresIn: number;
}

export interface AvatarUrlResponse {
  url: string | null;
  expiresIn: number | null;
}

export interface AvatarAccess {
  url: string | null;
  expiresAt: number | null;
}

export interface FileAccess {
  url: string;
  expiresAt: number;
}
