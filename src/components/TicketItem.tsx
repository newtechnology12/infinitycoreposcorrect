import useModalState from "@/hooks/useModalState";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import formatOrder from "@/utils/formatOrder";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";
import Loader from "./icons/Loader";
import { Printer, Trash, XCircle } from "react-feather";
import TicketToPrint from "./TicketToPrint";
import { AlarmClock, CheckCircle2, CircleDotDashedIcon } from "lucide-react";
import UpdateOrderItemModal from "./UpdateOrderItemModal";
import { useRoles } from "@/context/roles.context";
import ChooseDestination from "./ChooseDestination";
import recordActivtyLog from "@/utils/recordActivtyLog";
import { useAuth } from "@/context/auth.context";

function TicketItem({
  activeCourse,
  ticket,
  setactiveCourse,
  orderQuery,
  order,
}: any) {
  const queryClient = useQueryClient();

  const deleteTicket = () => {
    return pocketbase.collection("order_tickets").delete(ticket.id);
  };

  const deleteTicketMutation = useMutation({
    mutationFn: deleteTicket,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });

      const prevOrder: any =
        queryClient.getQueryData(key) || orderQuery?.data?.original;

      const newOrder = {
        ...prevOrder,
        expand: {
          ...prevOrder.expand,
          tickets: prevOrder.expand.tickets.filter((e) => e.id !== ticket.id),
        },
      };

      queryClient.setQueryData(key, () => formatOrder(newOrder));

      return { prevOrder };
    },
    onError: (__, _, context) => {
      queryClient.setQueryData(key, context.prevOrder);
      toast.error("Failed to delete ticket");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.refetchQueries({
        queryKey: ["orders", orderQuery?.data?.order || order],
      });
    },
  });

  const key = ["pos", "orders", orderQuery?.data?.id];

  const showTicketDestinationModal = useModalState();

  const printTicket = async () => {
    setTimeout(() => {
      printRef.current?.print();
    }, 500);
  };

  const printRef = useRef(null);

  const markAsCompleted = async () => {
    await pocketbase.collection("order_tickets").update(ticket.id, {
      status: "completed",
      completed_at: new Date(),
      completed_by: user.id,
    });

    await Promise.all(
      ticket.items
        .filter((e) => e.status === "pending")
        .filter((e) => e.status !== "cancelled")
        .map((e) =>
          pocketbase.collection("order_items").update(e.id, {
            status: "completed",
          })
        )
    );
  };

  const markAsCompletedMutation = useMutation({
    mutationFn: markAsCompleted,
    onError: () => {
      toast.error("Failed to mark as completed");
    },
    onSuccess: async () => {
      orderQuery.refetch();
    },
  });

  const { canPerform } = useRoles();

  const handleAfterPrint = async () => {
    await pocketbase
      .collection("order_tickets")
      .update(ticket.id, {
        printed: true,
      })
      .then(() => {
        orderQuery.refetch();
        toast.success("Ticket printed successfully");
      })
      .catch((e) => {
        toast.error(e.message);
      });
  };

  const { user } = useAuth();
  return (
    <>
      <ChooseDestination
        ticket={ticket}
        refetch={orderQuery?.refetch}
        open={showTicketDestinationModal.isOpen}
        setOpen={showTicketDestinationModal.close}
        printTicket={printTicket}
        order={orderQuery?.data}
        onCompleted={() => {
          printTicket();
          orderQuery.refetch();
          showTicketDestinationModal.close();
          return pocketbase.send("/adjust-stock-after-sale", {
            method: "POST",
            body: {
              items: ticket.items.map((e) => e.id),
              order_id: order.id,
            },
          });
        }}
      />
      <div
        className={cn("border-b mt-2 rounded-[3px]", {
          "border-primary border": ticket.id === activeCourse,
          "border-slate-200 border": ticket.id !== activeCourse,
        })}
      >
        <div
          onClick={() => {
            if (ticket.status === "draft") {
              setactiveCourse(ticket.id);
            }
          }}
          className={cn(
            "flex bg-slate-50 cursor-pointer border-b justify-between items-center px-[6px] py-[5px]",
            {
              "border-primary text-white bg-primary border":
                ticket.id === activeCourse,
            }
          )}
        >
          <h4
            className={cn("text-[13px]  font-medium", {
              "text-white": ticket.id === activeCourse,
              "text-slate-500": ticket.id !== activeCourse,
            })}
          >
            {ticket.code} -- (
            <span
              className={cn("text-[12.5px] text-slate-500 font-medium", {
                "text-white": ticket.id === activeCourse,
                "!text-slate-500": ticket.id !== activeCourse,
              })}
            >
              {ticket.count || 0} Item{ticket.count > 1 && "s"}
            </span>
            )
          </h4>
          <div className="flex items-center gap-2">
            {(ticket.id === activeCourse ||
              canPerform("modify_ticket_items")) && (
              <>
                {((ticket.status === "draft" && !ticket?.items?.length) ||
                  (ticket.status === "open" &&
                    !ticket?.items?.length &&
                    canPerform("modify_ticket_items"))) && (
                  <a
                    onClick={() => {
                      deleteTicketMutation.mutate();
                    }}
                    className={cn(
                      "h-6 w-7 bg-red-500 rounded-[3px] flex items-center justify-center"
                    )}
                  >
                    {deleteTicketMutation.isLoading ? (
                      <>
                        <Loader className="h-[14px] w-[14px] text-white animate-spin" />
                      </>
                    ) : (
                      <Trash size={14} className="text-white" />
                    )}
                  </a>
                )}
              </>
            )}

            {ticket.status !== "draft" && (
              <>
                {canPerform("reprint_ticket") && (
                  <a
                    onClick={() => {
                      printTicket();
                      recordActivtyLog({
                        title: "Order ticket is re-printed.",
                        event_type: "ORDER_ITEM_REPRINTED",
                        details: `order ticket ${ticket?.code} re-printed by ${user?.names}`,
                        log_level: "INFO",
                        user: user?.id,
                      });
                    }}
                    className={cn(
                      "h-6 w-7 bg-green-500 rounded-[3px] flex items-center justify-center"
                    )}
                  >
                    <Printer size={14} className="text-white" />
                  </a>
                )}
              </>
            )}
            {ticket.status === "draft" ? (
              <a
                onClick={() => showTicketDestinationModal.open()}
                className={cn(
                  "text-[11.5px] flex items-center gap-1 rounded-[2px] font-medium px-2 py-1",
                  {
                    "bg-white text-primary": ticket.id === activeCourse,
                    "text-white bg-primary": ticket.id !== activeCourse,
                    "opacity-80 pointer-events-none": !ticket?.items?.length,
                  }
                )}
              >
                <span>Fire Ticket</span>
              </a>
            ) : (
              <></>
            )}
            {ticket.status === "open" && canPerform("complete_ticket") && (
              <a
                onClick={() => markAsCompletedMutation.mutate()}
                className={cn(
                  "text-[11.5px] flex items-center gap-1 rounded-[2px] font-medium px-2 py-1",
                  {
                    "text-white bg-primary": true,
                    "opacity-80 pointer-events-none":
                      !ticket?.items?.length ||
                      markAsCompletedMutation.isLoading,
                  }
                )}
              >
                {markAsCompletedMutation.isLoading && (
                  <Loader className="h-[13px] w-[13px] mr-1 text-primary animate-spin" />
                )}
                <span>Mark as Completed</span>
              </a>
            )}

            {ticket?.order_station?.name && (
              <span
                className={cn(
                  "text-[12.4px] capitalize font-medium text-primary text-slate-500-",
                  { "text-white": ticket.id === activeCourse }
                )}
              >
                {ticket?.order_station?.name}
              </span>
            )}
          </div>
        </div>
        <div>
          {!ticket?.items?.length ? (
            <div className="py-8 text-center text-slate-500 items-center justify-center flex text-[13px]">
              <span>No Items in this ticket.</span>
            </div>
          ) : (
            <div className="pb-2- px-1 py-1">
              {ticket.items?.map((e, i) => {
                return (
                  <Item
                    onUpdated={() => {
                      orderQuery.refetch();
                    }}
                    ticket={ticket}
                    disabled={ticket.status !== "draft"}
                    id={e.id}
                    item={e}
                    key={i}
                    order={order}
                    tickets={
                      orderQuery?.data?.expand?.tickets ||
                      orderQuery?.data?.original?.expand?.tickets
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TicketToPrint
        ref={printRef}
        onAfterPrint={handleAfterPrint}
        isReprint={ticket?.printed}
        number={ticket?.code || "N.A"}
        waiter={order?.expand?.waiter}
        created={ticket?.created}
        order={order?.code}
        items={ticket.items
          .flat()
          .filter((e) => e.status !== "draft" && e.status !== "cancelled")
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
          })}
        title={`${ticket?.order_station?.name || "N.A"} Ticket`}
      />
    </>
  );
}

export default TicketItem;

function Item({
  item,
  onUpdated,
  className,
  isDragging,
  tickets,
  ticket,
  order,
}: any) {
  const [showUpdateOrderItem, setshowUpdateOrderItem] = useState(false);

  return (
    <>
      <UpdateOrderItemModal
        readOnly={item?.status !== "draft"}
        item={item}
        open={showUpdateOrderItem}
        onCompleted={() => {
          onUpdated();
        }}
        tickets={tickets}
        setOpen={setshowUpdateOrderItem}
        ticket={ticket}
        order={order}
      />

      <div
        onClick={() => {
          setshowUpdateOrderItem(true);
        }}
        className={cn(
          "flex items-start relative border-[1.5px] border-transparent select-none py-[9px] hover:bg-slate-100 cursor-pointer px-1 justify-between",
          className
        )}
      >
        {isDragging && (
          <div className="absolute text-[13px] top-0 text-slate-500 h-full w-full flex items-center justify-center text-center">
            <span>Drag item here</span>
          </div>
        )}
        <div className={isDragging ? "opacity-0" : ""}>
          <div className="flex items-center text-sm font-medium text-slate-600">
            <div className="flex items-start  gap-1">
              <a href="" className="mr-[6px] mt-1">
                {item.status === "draft" && <CircleDotDashedIcon size={14} />}
                {item.status === "pending" && (
                  <AlarmClock className="text-orange-500" size={14} />
                )}
                {item.status === "cancelled" && (
                  <XCircle className="text-red-500" size={14} />
                )}
                {item.status === "completed" && (
                  <CheckCircle2 size={15} className="text-green-500" />
                )}
              </a>
              <span>x{item.quantity}</span>
              <span>-</span>
              <span className="text-[13px] text-wrap">
                {item?.expand?.menu?.name}
              </span>
            </div>
          </div>
          <div className="ml-7">
            {item.notes && (
              <p className="whitespace-normal text-[13px] text-slate-500 leading-7">
                <span className="underline">Notes</span>: {item.notes}
              </p>
            )}
            {item.modifiers && (
              <div className="text-[13px] text-slate-500 font-medium- items-center justify-between">
                {item.modifiers.map((e, i) => {
                  return (
                    <div key={i} className="flex items-center leading-7 gap-2">
                      + <span className="capitalize underline">{e.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {item.variant ? (
              <div className="text-[13px] text-slate-500 font-medium- items-center justify-between">
                <div className="flex items-center leading-7 gap-2">
                  Variant:{" "}
                  <span className="capitalize underline">
                    {item?.variant?.name}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "text-[12.5px] font-medium text-slate-500",
            isDragging ? "opacity-0" : ""
          )}
        >
          {item.amount.toLocaleString()} FRW
        </div>
      </div>
    </>
  );
}
