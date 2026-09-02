import { appContext } from "../context/AppContext";
export function useAppContext() {
  return appContext.useContext();
}
