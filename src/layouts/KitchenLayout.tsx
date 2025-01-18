import { Outlet, useParams } from "react-router-dom";
import { CgMenuBoxed } from "react-icons/cg";
import { FiHome } from "react-icons/fi";
import { MdOutlineSettings } from "react-icons/md";
import useShowSidebar from "@/hooks/useShowSidebar";
import { cn } from "@/utils";
import KitchenSidebar from "@/components/shared/KitchenSidebar";
import { ChefHat } from "lucide-react";

export default function KitchenLayout() {
  const params = useParams();

  const MENU_LINK = [
    {
      name: "Home",
      path: `/kitchen-display/${params.kitchen}`,
      icon: <FiHome />,
    },
    // {
    //   name: "Menu",
    //   path: `/kitchen-display/${params.kitchen}/menu`,
    //   icon: <CgMenuBoxed />,
    // },
    {
      name: "Kitchens",
      path: `/kitchen-display`,
      icon: <ChefHat size={18} />,
    },
    {
      name: "Settings",
      path: `/kitchen-display/${params.kitchen}/settings`,
      icon: <MdOutlineSettings />,
    },
  ];

  const { showSideBar } = useShowSidebar();

  return (
    <>
      <KitchenSidebar
        className={cn("transition-all", {
          "-left-[70px]": !showSideBar,
          "left-0": showSideBar,
        })}
        links={MENU_LINK}
        root={`/kitchen-display/${params.kitchen}`}
      />
      <div
        className={cn("transition-all dark h-dvh bg-slate-900 ", {
          "sm:pl-[67px] pl-[55px]": showSideBar,
        })}
      >
        <Outlet />
      </div>
    </>
  );
}
