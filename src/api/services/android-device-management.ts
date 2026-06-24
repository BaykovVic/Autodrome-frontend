import type { paths } from "@/contracts/types/android-device-management";
import { createAutodromeClient } from "../client";

export const androidDeviceApi = createAutodromeClient<paths>({
  baseUrl: "/api/android-device-management/v1",
});

export type AndroidDevicePaths = paths;
