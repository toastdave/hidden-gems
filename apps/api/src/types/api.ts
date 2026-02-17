import type { User } from "@hidden-gems/shared";

export type ApiUser = Pick<User, "id" | "email" | "displayName">;

export type ApiEnv = {
  Variables: {
    correlationId: string;
    user: ApiUser | null;
  };
};
