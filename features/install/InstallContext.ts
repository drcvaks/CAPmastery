import { createContext, useContext } from "react";

export const InstallContext = createContext<{ open: () => void; installed: boolean } | null>(null);
export const useInstall = () => useContext(InstallContext);
