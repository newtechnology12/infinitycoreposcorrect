import TicketToPrint from "@/components/TicketToPrint";
import pocketbase from "@/lib/pocketbase";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";

export default function TicketPage() {
  const ticketCode = useParams().ticketId;

  const getTicket = async () => {
    const ticket = await pocketbase.collection("order_tickets").getFullList({
      filter: `code="${ticketCode}"`,
      expand: "order_items,order_items.menu,order_station,order.waiter",
    });
    return ticket[0];
  };

  const ticketQuery = useQuery(["tickets", ticketCode], getTicket, {
    enabled: Boolean(ticketCode),
  });

  return (
    <div>
      {ticketQuery.status === "error" && (
        <div>Error: Something went wrong.</div>
      )}

      {ticketQuery.status === "success" && (
        <div className="relative">
          <div className="absolute z-50 bg-red-200- flex items-center justify-center w-full h-full font-semibold">
            {ticketQuery.data ? (
              <h4 className="text-[90px] text-green-500 -mt-44 opacity-70 font-cour -rotate-45">
                APPROVED
              </h4>
            ) : (
              <h4 className="text-[90px] text-red-500 -mt-44 opacity-70 font-cour -rotate-45">
                DECLINED
              </h4>
            )}
          </div>
          <TicketToPrint
            order={ticketQuery?.data?.code}
            waiter={ticketQuery?.data?.expand?.order?.expand?.waiter}
            number={ticketQuery?.data?.code || "N.A"}
            className="!block"
            created={ticketQuery?.data?.created}
            items={
              ticketQuery?.data?.expand?.order_items
                ?.filter((e) => e.status !== "draft")
                ?.filter((e) => e.status !== "cancelled")
                .map((e) => {
                  return {
                    name: e?.expand?.menu?.name,
                    subTotal: e?.amount || 0,
                    quantity: e?.quantity,
                    notes: e?.notes,
                    status: e?.status,
                    modifiers: e?.modifiers,
                    variant: e?.variant,
                  };
                }) || []
            }
            title={`${
              ticketQuery?.data?.expand?.order_station?.name || ""
            } Ticket`}
          />
        </div>
      )}

      {ticketQuery.status === "loading" && <div>Loading...</div>}
    </div>
  );
}
