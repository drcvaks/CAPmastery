import type { Database } from "../../types/database";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type AccessContext = {
  profile: Profile;
  roles: AppRole[];
};
