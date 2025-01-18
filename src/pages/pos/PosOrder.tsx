import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { useEffect, useState } from "react";

import { useMediaQuery } from "react-responsive";

import PosCart from "@/components/PosCart";
import PosMenu from "@/components/PosMenu";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import pocketbase from "@/lib/pocketbase";
import formatOrder from "@/utils/formatOrder";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function PosOrder() {
  const isMobile = useMediaQuery({ query: "(max-width: 550px)" });
  const [showDraer, setshowDraer] = useState(false);
  const isBigTablet = useMediaQuery({ query: "(max-width: 1100px)" });
  const isSmallTablet = useMediaQuery({ query: "(max-width: 820px)" });

  const { orderId } = useParams();

  const orderQuery = useQuery({
    queryKey: ["pos", "orders", orderId],
    retry: false,
    queryFn: () => {
      return pocketbase
        .collection("orders")
        .getOne(orderId, {
          expand:
            "bills,bills.discount,bills.discount.discount,bills.items,bills.items.menu,bills.transactions,bills.credits,table,customer,items.menu,items.menu.destination,waiter,tickets,bills.transactions.payment_method,tickets.order_station,items.menu.subCategory,items.menu.category",
        })
        .then((e) => formatOrder({ ...e, items: e.expand?.items }));
    },
    enabled: Boolean(orderId),
  });

  useEffect(() => {
    let unsubscribe;

    pocketbase
      .collection("order_items")
      .subscribe("*", function () {
        orderQuery.refetch();
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

  useEffect(() => {
    let unsubscribe;

    pocketbase
      .collection("orders")
      .subscribe(orderId, function () {
        orderQuery.refetch();
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

  useEffect(() => {
    let unsubscribe;

    pocketbase
      .collection("order_bills")
      .subscribe("*", function () {
        orderQuery.refetch();
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

  useEffect(() => {
    let unsubscribe;

    pocketbase
      .collection("order_tickets")
      .subscribe("*", function () {
        orderQuery.refetch();
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

  const [activeCourse, setactiveCourse] = useState(null);

  useEffect(() => {
    const tickets = orderQuery?.data?.expand?.tickets;
    if (tickets) {
      if (tickets[tickets?.length - 1]?.status === "draft") {
        setactiveCourse(tickets[tickets?.length - 1]?.id);
      } else {
        setactiveCourse(null);
      }
    }
  }, [orderQuery?.data?.expand?.tickets]);

  const discountsToUseQuery = useQuery({
    queryKey: [
      "pos",
      "orders",
      "discounts",
      {
        customer: orderQuery?.data?.customer,
      },
    ],
    retry: false,
    enabled: Boolean(orderQuery.data),
    queryFn: async () => {
      const discounts = await pocketbase.collection("discounts").getFullList({
        filter: `status="active" && (start_date<="${new Date().toISOString()}" && end_date>="${new Date().toISOString()}")`,
      });

      const discountsToUse = discounts.filter((e) => {
        // check if target_audience is specified customers and check if order customer is included
        if (
          e.target_audience === "selected customers" &&
          e.customers.includes(orderQuery?.data?.expand?.customer?.id)
        ) {
          return true;
        }
        // also check if the discount is for all customers
        if (e.target_audience === "all customers") {
          return true;
        }
      });
      return discountsToUse;
    },
  });

  return (
    <>
      <div className="flex w-full h-dvh relative">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={isSmallTablet ? 50 : isBigTablet ? 60 : 70}
            className="@container relative"
            minSize={25}
          >
            <PosMenu
              refetch={() => orderQuery.refetch()}
              order={orderQuery.data}
              orderQuery={orderQuery}
              setshowDraer={setshowDraer}
              activeCourse={activeCourse}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          {!isMobile && orderId && (
            <ResizablePanel
              defaultSize={isSmallTablet ? 50 : isBigTablet ? 40 : 30}
              minSize={25}
            >
              <PosCart
                orderQuery={orderQuery}
                refechOrder={() => orderQuery.refetch()}
                order={orderQuery.data}
                activeCourse={activeCourse}
                discounts={discountsToUseQuery.data}
                setactiveCourse={setactiveCourse}
              />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>

      {orderId && (
        <Dialog open={showDraer} onOpenChange={setshowDraer}>
          <DialogContent className="sm:max-w-[750px] h-dvh !p-0 md:h-fit  flex flex-col">
            <PosCart
              orderQuery={orderQuery}
              refechOrder={() => orderQuery.refetch()}
              order={orderQuery.data}
              activeCourse={activeCourse}
              setactiveCourse={setactiveCourse}
              discounts={discountsToUseQuery.data}
              setshowDraer={setshowDraer}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
