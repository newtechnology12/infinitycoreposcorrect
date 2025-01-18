import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth.context";
import { useLocation } from "react-router-dom";
import { useRoles } from "@/context/roles.context";
import useSettings from "@/hooks/useSettings";
import pocketbase from "@/lib/pocketbase";

export default function RootLayout() {
  const { user, loading } = useAuth();
  const { isLoading, roles, permitions = [] } = useRoles();

  const { isLoading: isLoadingSettings } = useSettings();

  const location = useLocation();

  const { settings } = useSettings();

  if (loading || isLoading || !roles || isLoadingSettings) {
    return (
      <div className=" w-screen h-dvh bg-white flex items-center justify-center flex-col gap-8">
        <img
          src={pocketbase.files.getUrl(settings, settings?.logo)}
          className="w-16"
          alt=""
        />

        <div className="w-[150px]">
          <div className="w-full m-auto">
            <div className="progress-bar h-1 rounded-md bg-primary bg-opacity-25 w-full overflow-hidden">
              <div className="progress-bar-value w-full h-full bg-primary " />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && !loading) {
    if (location.pathname === "/") {
      if (permitions[0]?.name === "access_pos" && permitions.length === 1)
        return <Navigate to="/pos" />;
      if (
        permitions[0]?.name === "access_kitchen_display" &&
        permitions.length === 1
      )
        return <Navigate to="/kitchen-display" />;
      if (permitions[0]?.name === "view_dashboard")
        return <Navigate to="/dashboard" />;
      return <Navigate to={"/dashboard/account"} />;
    }
    return <Outlet />;
  }

  if (!user && !loading) {
    if (
      location.pathname === "/" ||
      location.pathname.startsWith("/tickets") ||
      location.pathname.startsWith("/bills") ||
      location.pathname.startsWith("/backups")
    )
      return <Outlet />;
    return <Navigate to={`/?redirect=${location.pathname}`} />;
  }
}
