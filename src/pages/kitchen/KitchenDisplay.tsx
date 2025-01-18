/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import pocketbase from "@/lib/pocketbase";
import { useQuery } from "react-query";
import ErrorCard from "@/components/shared/ErrorCard";
import { cn } from "@/utils";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "@/components/icons/Loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { ArrowLeftToLine, Menu } from "lucide-react";
import { RefreshCcw } from "react-feather";
import useShowSidebar from "@/hooks/useShowSidebar";
import OrderCard from "@/components/shared/OrderCard";
import AllTickets from "@/components/AllTickets";
import ConfirmModal from "@/components/modals/ConfirmModal";

export default function KitchenDisplay() {
  const [selectedStatus, setselectedStatus] = useState("open");
  const params = useParams();

  const getStation = () => {
    return pocketbase.collection("order_stations").getOne(params.kitchen);
  };

  const { data } = useQuery(["order-stations", params.kitchen], getStation);

  const queryFilterDirection = `status="open" && order_station="${data?.id}"`;

  const ticktesQueryKey = [
    "kitchen-displays-tickets",
    params.kitchen,
    selectedStatus,
  ];

  const ticktesQuery: any = useQuery({
    queryKey: ticktesQueryKey,
    queryFn: async () => {
      const all = await pocketbase
        .autoCancellation(false)
        .collection("order_tickets")
        .getFullList({
          filter: `${queryFilterDirection}`,
          expand:
            "order,order_items,order_items.menu,order.table,kitchen_display,order.waiter,order_station",
          sort: "+created",
        });

      return all;
    },
    enabled: Boolean(data),
  });

  const { showSideBar } = useShowSidebar();

  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;

    pocketbase
      .collection("order_tickets")
      .subscribe("*", function () {
        ticktesQuery.refetch();
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <>
      <div className="h-dvh flex flex-col">
        <div>
          <div className="bg-slate-900 py-[8px] border-b- flex items-center justify-between px-3">
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

              <span className="ml-2 text-white truncate capitalize">
                Order station
                <span className={"hidden sm:inline-block"}>
                  - {data?.name || "Loading..."}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                onClick={() => ticktesQuery.refetch()}
                className="h-8 w-8 cursor-pointer rounded-full bg-slate-700 flex items-center gap-2 justify-center rounded-[4px]-"
              >
                <RefreshCcw
                  size={15}
                  className={cn("text-white", {
                    "animate-spin": ticktesQuery.isFetching,
                  })}
                />
              </a>
            </div>
          </div>

          <Tabs
            value={selectedStatus}
            onValueChange={setselectedStatus}
            className="w-full"
          >
            <TabsList className="w-full h-fit px-3 bg-slate-700 rounded-none py-[7px] border-t border-b border-slate-600">
              <TabsTrigger
                className="capitalize flex items-center gap-1 py-2 text-white w-full"
                value={"open"}
              >
                Open Tickets
              </TabsTrigger>
              <TabsTrigger
                className="capitalize flex items-center gap-1 py-2 text-white w-full"
                value={"all"}
              >
                All Tickets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              <ScrollArea className="w-full h-full- whitespace-nowrap overflow-auto">
                <div className="h-full bg-slate-900 flex-1 pt-1 pb-4">
                  <>
                    {ticktesQuery.isLoading && (
                      <div className="w-full h-[500px] flex items-center justify-center">
                        <Loader
                          strokeWidth={8}
                          className="mr-2 h-6 w-5 text-primary animate-spin"
                        />
                      </div>
                    )}
                    {ticktesQuery.isError && <ErrorCard />}

                    {ticktesQuery.status === "success" &&
                    ticktesQuery.data?.length === 0 ? (
                      <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                        <div className="flex px-2 text-center items-center py-24 justify-center gap-2 flex-col mx-auto">
                          <img
                            className="h-20 w-20"
                            src="/images/cooking-pot.png"
                            alt=""
                          />
                          <h4 className="font-semibold text-white mt-4">
                            {selectedStatus === "open" &&
                              "No Open Tickets Found"}
                            {selectedStatus === "all" && "No  Tickets Found"}
                          </h4>
                          <p className="text-[15px] max-w-sm leading-8 text-slate-400 w-full text-wrap">
                            The Food menu items you are looking are not
                            available. Try again later or clear the filters.
                          </p>
                        </div>
                      </div>
                    ) : (
                      ticktesQuery.data && (
                        <div className="px-3 py-2 gap-x-3 columns-1  xs:columns-2 md:columns-3 lg:columns-4 col">
                          {ticktesQuery?.data?.map((itm) => (
                            <OrderCard
                              key={itm.id}
                              ticktesQuery={ticktesQuery}
                              order={itm}
                            />
                          ))}
                        </div>
                      )
                    )}
                  </>
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="all">
              <div className="sm:px-4 px-2">
                <AllTickets />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
