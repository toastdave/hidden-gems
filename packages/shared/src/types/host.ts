export interface Host {
  id: string;
  ownerUserId: string;
  type: "individual" | "organization";
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}
