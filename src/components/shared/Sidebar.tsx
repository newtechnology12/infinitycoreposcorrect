import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";
import Avatar from "./Avatar";
import { useAuth } from "@/context/auth.context";
import { useMediaQuery } from "react-responsive";
import pocketbase from "@/lib/pocketbase";
import useSettings from "@/hooks/useSettings";

export default function Sidebar({ root, links, className }) {
  const { user }: any = useAuth();

  const location = useLocation();

  const isMobile = useMediaQuery({ query: "(max-width: 650px)" });

  const { settings } = useSettings();

  return (
    <div
      className={cn(
        "flex h-dvh fixed z-40 bg-white items-center flex-col justify-between gap-10 border-r border-r-gray-200",
        className
      )}
    >
      <div className="flex gap-2 sm:4 flex-col items-center">
        <a href={"/pos/menu"} className="block px-1  border-b py-[8px] sm:py-3">
          {isMobile ? (
            <img
              src={pocketbase.files.getUrl(settings, settings?.logo)}
              className="w-14"
              alt=""
            />
          ) : (
            <img
              src={pocketbase.files.getUrl(settings, settings?.logo)}
              className="w-11"
              alt=""
            />
          )}
        </a>
        <div className="flex sm:px-1 px-[4px] flex-col gap-4">
          {links.map((val, indx) => {
            const isActive =
              location.pathname
                .split("/")
                .slice(0, root.split("/").length === 1 ? 3 : 3)
                .join("/") ===
              val.path
                .split("/")
                .slice(0, root.split("/").length === 1 ? 3 : 4)
                .join("/");

            return (
              <NavLink
                key={indx}
                to={val.path}
                end
                className={cn(
                  "flex flex-col items-center gap-[2px] sm:gap-[3px] py-[5px] sm:py-[7px] rounded-sm px-[5px] sm:px-[8px]",
                  {
                    "text-white bg-primary ": isActive,
                    "text-slate-600 hover:bg-slate-100": !isActive,
                  }
                )}
              >
                <span className="text-lg sm:text-base">{val.icon}</span>
                <span className="sm:text-[12px] text-[11px] font-medium">
                  {val.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
      <Link
        to={`/pos/settings`}
        className="rounded-full my-4 sm:my-2 -ml-[5px] p-[2px] border-primary border-2 "
      >
        <Avatar name={user?.names || ""} path={user?.photo} />
      </Link>
    </div>
  );
}
