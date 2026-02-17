export interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  maxListings: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
