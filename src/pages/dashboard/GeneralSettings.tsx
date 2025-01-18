import BreadCrumb from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/utils";

import { Link, Outlet, useLocation } from "react-router-dom";

export default function GeneralSettings() {
  const pathname = useLocation().pathname;

  return (
    <div className="px-3">
      <div className="flex items-start justify-between space-y-2 mb-3">
        <div className="flex items-start gap-2 flex-col">
          <h2 className="text-base font-semibold tracking-tight">
            General Settings
          </h2>
          <BreadCrumb
            items={[{ title: "Employee Portal", link: "/dashboard" }]}
          />
        </div>
      </div>

      <div className="mt-3-">
        <Card className="rounded-[4px] scroller">
          <div className="px-2 gap-2 w-full border-b">
            <ScrollArea className="w-full  whitespace-nowrap">
              <div className="flex  items-center justify-start">
                {" "}
                {[
                  {
                    title: "general Settings",
                    link: "/dashboard/settings/general-settings",
                  },
                  {
                    title: "leave settings",
                    link: "/dashboard/settings/general-settings/leaves",
                  },
                  {
                    title: "payroll settings",
                    link: "/dashboard/settings/general-settings/payroll",
                  },
                  {
                    title: "Fields settings",
                    link: "/dashboard/settings/general-settings/fields",
                  },
                  {
                    title: "attendance settings",
                    link: "/dashboard/settings/general-settings/attendance",
                  },

                  {
                    title: "roles & permitions",
                    link: "/dashboard/settings/general-settings/roles-permissions",
                  },
                ].map((e, i) => {
                  const base = pathname.split("/").slice(0, 5).join("/");

                  const isActive = base === e.link;
                  return (
                    <Link
                      to={e.link}
                      key={i}
                      className={cn(
                        "cursor-pointer px-4 capitalize text-center relative w-full- text-slate-700 text-[13px] sm:text-sm py-3  font-medium",
                        {
                          "text-primary ": isActive,
                        }
                      )}
                    >
                      {isActive && (
                        <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                      )}
                      <span className="truncate">{e.title}</span>
                    </Link>
                  );
                })}
              </div>

              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <div>
            <Outlet />
          </div>
        </Card>
      </div>
    </div>
  );
}
