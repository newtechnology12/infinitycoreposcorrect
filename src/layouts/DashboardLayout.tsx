import DashboardSidebar from "@/components/DashboardSidebar";
import Avatar from "@/components/shared/Avatar";
import { useAuth } from "@/context/auth.context";
import { cn } from "@/utils";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
  const [mobileShowMenu, setmobileShowMenu] = useState(false);

  const { pathname } = useLocation();

  useEffect(() => {
    if (mobileShowMenu) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [mobileShowMenu]);

  useEffect(() => {
    setmobileShowMenu(false);
  }, [pathname]);

  const { user } = useAuth();

  const navigate = useNavigate();

  return (
    <>
      <div className="bg-primary md:hidden flex items-center justify-between py-3 px-3 ">
        <a
          onClick={() => setmobileShowMenu(true)}
          className="w-8 flex cursor-pointer items-center justify-center h-8 bg-white rounded-md"
        >
          <Menu className="w-5 text-primary h-6" />
        </a>
        <a
          onClick={() => navigate("/dashboard/account")}
          className="cursor-pointer"
        >
          <Avatar name={user?.names || ""} path={user?.photo} />
        </a>
      </div>
      <div
        className={cn("-left-[280px] transition-all md:!left-0 top-0 fixed", {
          "left-0": mobileShowMenu === true,
          "z-[100]": mobileShowMenu === true,
        })}
      >
        <DashboardSidebar />
      </div>
      <div
        onClick={() => setmobileShowMenu(false)}
        className={cn(
          "fixed w-full md:hidden transition-all hidden h-full bg-black top-0 z-40 bg-opacity-45",
          {
            flex: mobileShowMenu === true,
          }
        )}
      ></div>

      <div className="md:pl-[280px] pl-0 overflow-x-auto min-w-[1200px]-">
        <div className="max-w-7xl- mx-auto py-3">
          <Outlet />
        </div>
      </div>
    </>
  );
}
