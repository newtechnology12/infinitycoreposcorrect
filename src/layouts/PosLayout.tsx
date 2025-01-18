import { ClockinModal } from "@/components/modals/ClockinModal";
import Sidebar from "@/components/shared/Sidebar";
import { useworkShift } from "@/context/workShift.context";
import useShowSidebar from "@/hooks/useShowSidebar";
import { cn } from "@/utils";
import { CircleUserRound } from "lucide-react";
import { useEffect } from "react";
import { BiDish } from "react-icons/bi";
import { MdOutlineRestaurantMenu, MdOutlineTableBar } from "react-icons/md";
import { Outlet, useLocation } from "react-router-dom";

const MENU_LINK = [
  { name: "Menu", path: "/pos/menu", icon: <BiDish /> },
  { name: "Orders", path: "/pos/orders", icon: <MdOutlineRestaurantMenu /> },
  { name: "Tables", path: "/pos/tables", icon: <MdOutlineTableBar /> },
  {
    name: "Account",
    path: "/pos/settings",
    icon: <CircleUserRound size={16} />,
  },
];

export default function PosLayout() {
  return <Hb />;
}

function Hb() {
  const { showSideBar } = useShowSidebar();

  const { current, isLoading, showClockinModal, setShowClockinModal } =
    useworkShift();

  const pathname = useLocation().pathname;

  useEffect(() => {
    if (!current && !isLoading && pathname !== "/pos/settings") {
      setShowClockinModal(true);
    }
  }, [current, isLoading]);

  return (
    <>
      <ClockinModal open={showClockinModal} setOpen={setShowClockinModal} />
      <Sidebar
        className={cn("transition-all", {
          "-left-[70px]": !showSideBar,
          "left-0": showSideBar,
        })}
        links={MENU_LINK}
        root={"/pos"}
      />
      <div
        className={cn("transition-all", {
          "pl-[55px] sm:pl-[67px]": showSideBar,
        })}
      >
        <Outlet />
      </div>
    </>
  );
}
