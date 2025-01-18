import { MenuDetailsModals } from "@/components/MenuDetails";
import Avatar from "@/components/shared/Avatar";
import MenuItems from "@/components/shared/MenuItems";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth.context";
import useShowSidebar from "@/hooks/useShowSidebar";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { ArrowLeftToLine } from "lucide-react";
import { useState } from "react";
import { Menu } from "react-feather";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";

export default function KitchenMenu() {
  const [menuToShow, setmenuToShow] = useState(undefined);

  const params = useParams();

  const getKitchen = () => {
    return pocketbase.collection("order_stations").getOne(params.kitchen);
  };

  const { data } = useQuery(["order_stations", params.kitchen], getKitchen);

  const menuItemsQuery = useQuery({
    queryKey: ["kitchen", params.kitchen, "menuItems"],
    retry: false,
    queryFn: () => {
      return pocketbase.collection("menu_items").getFullList(
        cleanObject({
          filter: `category.destination="${data?.id}"`,
        })
      );
    },
    enabled: Boolean(data?.id),
  });

  const navigate = useNavigate();

  const { showSideBar } = useShowSidebar();

  const { user }: any = useAuth();

  return (
    <>
      <div className="h-dvh flex flex-col">
        <div className="bg-slate-900 border-b-slate-800 py-[8px] border-b flex items-center justify-between px-3">
          <div className="font-semibold gap-3 flex items-center text-sm">
            <a
              onClick={() =>
                navigate({
                  search: showSideBar ? "" : "?show_sidebar=yes",
                })
              }
              className="h-8 w-8 cursor-pointer bg-slate-700 flex items-center gap-2 justify-center rounded-[4px]"
            >
              {!showSideBar ? (
                <Menu size={16} className="text-slate-100" />
              ) : (
                <ArrowLeftToLine size={16} className="text-slate-100" />
              )}
            </a>

            <span className="ml-2 text-white capitalize">Kitchen Menu.</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white my-4- sm:my-2- -ml-[5px] p-[2px]- border-primary border-2 ">
              <Avatar
                className="h-7 w-7 !text-sm"
                name={user?.names || ""}
                path={user?.photo}
              />
            </div>
          </div>
        </div>
        <ScrollArea className="w-full h-full- whitespace-nowrap overflow-auto">
          <div className="@container py-1 px-1">
            <MenuItems
              setmenuToShow={setmenuToShow}
              menuItemsQuery={menuItemsQuery}
            />
          </div>
        </ScrollArea>
      </div>
      <MenuDetailsModals
        isKitchen={true}
        open={Boolean(menuToShow)}
        showAddingOptions={false}
        menu={menuToShow}
        setOpen={(e) => {
          if (e === false) {
            setmenuToShow(undefined);
          }
        }}
      />
    </>
  );
}
