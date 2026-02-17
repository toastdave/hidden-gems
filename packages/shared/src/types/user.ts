export interface User {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  displayName: string | null;
  avatarUrl: string | null;
  homeLat: number | null;
  homeLng: number | null;
  createdAt: Date;
  updatedAt: Date;
}
