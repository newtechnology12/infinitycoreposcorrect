/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/utils";
import dayjs from "dayjs";
import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { forwardRef, useState } from "react";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import Loader from "../icons/Loader";
import { IoMdNotifications } from "react-icons/io";
import { useAuth } from "@/context/auth.context";
import ConfirmModal from "../modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";

const OrderCard = forwardRef(
  (
    {
      order: ticket,
      ticktesQuery,
      className,
      handleNotifictionIcon,
      ...props
    }: any,
    ref: any
  ) => {
    const [completingItem, setcompletingItem] = useState(undefined);
    const completeItem = async (item) => {
      setcompletingItem(item.id);
      return pocketbase
        .collection("order_items")
        .update(item.id, {
          status: "completed",
        })
        .then(() => {
          ticktesQuery.refetch();
          setcompletingItem(undefined);
          toast.success("Item completed successfully");
        });
    };

    const unCompleteItem = async (item) => {
      setcompletingItem(item.id);
      return pocketbase
        .collection("order_items")
        .update(item.id, {
          status: "pending",
        })
        .then(() => {
          setcompletingItem(undefined);
          toast.success("Item uncompleted successfully");
          ticktesQuery.refetch();
        });
    };

    const { user } = useAuth();

    const confirmModal = useConfirmModal();

    const completeTicket = async () => {
      confirmModal.setIsLoading(true);
      return pocketbase
        .send("/complete-ticket", {
          method: "POST",
          body: JSON.stringify({
            ticket: ticket.id,
            items: ticket?.expand?.order_items
              .filter((e) => e.status !== "cancelled")
              .filter((e) => e.status !== "draft")
              .map((item) => item.id),
            user: user.id,
          }),
        })
        .then(() => {
          confirmModal.setIsLoading(false);
          toast.success("Ticket completed successfully");
          ticktesQuery.refetch();
        })
        .catch(() => {
          confirmModal.setIsLoading(false);
          toast.error("Error completing ticket");
        });
    };

    const percent =
      (ticket?.expand?.order_items?.reduce((acc, item) => {
        return acc + (item.status === "completed" ? 1 : 0);
      }, 0) /
        ticket?.expand?.order_items?.length) *
      100;

    return (
      <>
        {" "}
        <div ref={ref} className={cn("relative", className)} {...props}>
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={cn(
              "bg-white item mb-3 w-full pt-2 pb-0.5 flex flex-col border rounded-[4px] border-slate-300 relative",
              "border-t-[3px] border-t-green-500-"
            )}
          >
            {ticket.isNew && (
              <div
                className={cn(
                  "absolute -top-2.5 animate-bounce right-0 bg-red rounded-full transform -translate-y-1/2 -translate-x-1/2",
                  "!text-green-500"
                )}
              >
                <IoMdNotifications className=" w-6 h-6" />
              </div>
            )}

            <div className="border-b-">
              <div className=" px-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-10 text-[12px] uppercase w-10 bg-slate-200 flex items-center justify-center text-slate-500 rounded-[4px]",
                        ticket.status === "completed"
                          ? "bg-slate-300 font-medium"
                          : "bg-green-500 text-white"
                      )}
                    >
                      {ticket?.expand.order?.expand?.table?.code || "N.A"}
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                      <h4 className="text-[14px] font-medium">
                        {ticket?.expand?.order?.expand?.waiter?.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <p className="text-[12.5px] font-medium text-slate-500 font-medium-">
                          #Order {ticket?.expand?.order?.code}
                        </p>
                        ,
                        <p className="text-[12.5px] font-medium text-slate-500 font-medium-">
                          #Ticket {ticket?.code}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex mt-0 items-center justify-between py-2">
                  <span className="text-[12.5px] text-slate-500 font-medium-">
                    {dayjs(ticket.fired_at).format("MMM D, YYYY")}
                  </span>
                  <span className="text-[12.5px] text-slate-500 font-medium-">
                    {dayjs(ticket.fired_at).format("h:mm:ss A")}
                  </span>
                </div>
              </div>
              {ticket.status !== "completed" && (
                <div className="pb-2 px-3 pt-2">
                  <Progress
                    className="h-[7px] !bg-slate-200 "
                    indicatorClass={cn("!bg-green-500 text-white")}
                    value={percent}
                  />
                </div>
              )}
            </div>
            <div className="w-full">
              {ticket?.expand?.order_items
                .filter((e) => e.status !== "draft")
                .filter((e) => e.status !== "cancelled")
                ?.map((item, idx) => {
                  return (
                    <OrderItem
                      status={ticket.status}
                      onCompleteItem={() => {
                        const unCompletedItems =
                          ticket?.expand?.order_items.filter(
                            (i) => i.status !== "completed"
                          );
                        if (unCompletedItems?.length === 1) {
                          console.log("complete ticket");
                          completeTicket();
                        } else {
                          console.log("complete item");
                          completeItem(item);
                        }
                      }}
                      onUnCompleteItem={() => unCompleteItem(item)}
                      disabled={
                        completingItem === item.id ||
                        ticket.status === "completed" ||
                        confirmModal.isLoading
                      }
                      key={idx}
                      item={item}
                    />
                  );
                })}
            </div>
            <div className="flex px-2 py-2 gap-2 border-t justify-between- h-full">
              <Button
                onClick={() => confirmModal.open({})}
                size="sm"
                // disabled={completing}
                className={cn("w-full !bg-green-500 !text-white")}
              >
                Complete All Items
                {/* {completing ? (
                  <Loader className="ml-2 h-3 w-3 !text-white animate-spin" />
                ) : ( */}
                <CheckCircle className="ml-2 " size={15} />
                {/* )} */}
              </Button>
            </div>
          </div>
        </div>
        <ConfirmModal
          title={"Are you sure you want to complete?"}
          description={`Once you complete this ticket, you won't be able to undo this action.`}
          meta={confirmModal.meta}
          onConfirm={completeTicket}
          isLoading={confirmModal.isLoading}
          open={confirmModal.isOpen}
          onClose={() => confirmModal.close()}
        />
      </>
    );
  }
);

function OrderItem({
  item,
  disabled,
  onCompleteItem,
  onUnCompleteItem,
  status,
}) {
  return (
    <div className="flex px-3 py-2 hover:bg-slate-50 cursor-pointer w-full items-start gap-3">
      <Checkbox
        onCheckedChange={(e) => {
          if (e) {
            onCompleteItem();
          } else {
            onUnCompleteItem();
          }
        }}
        className={cn(
          status === "completed"
            ? "focus-visible:ring-slate-500 data-[state=checked]:bg-slate-500 data-[state=checked]:border-slate-500"
            : "data-[state=checked]:bg-green-500  data-[state=checked]:border-green-500 focus-visible:ring-green-500"
        )}
        disabled={disabled || item.status === "cancelled"}
        checked={item.status === "completed"}
        id={`item-${item.id}`}
      />
      <label
        htmlFor={`item-${item.id}`}
        className={cn("w-full text-slate-600 ", {
          "opacity-50 pointer-events-none": disabled,
          "line-through text-red-500": item.status === "cancelled",
        })}
      >
        <div className="flex flex-1 mb-1 text-[13px] font-medium items-center justify-between">
          <div className="capitalize">
            {item?.expand?.menu?.name} ({item?.amount} Frw)
          </div>
          <div>x {item?.quantity}</div>
        </div>

        {item.notes && (
          <p className="whitespace-normal text-sm leading-7">
            <span className="underline">Notes</span>: {item.notes}
          </p>
        )}
        {item.variant && (
          <div className="text-[13px] font-medium items-center justify-between">
            <div className="flex items-center leading-7 gap-2">
              <span className="underline capitalize">Variant:</span>
              <span className="capitalize">{item?.variant?.name}</span>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}

export default OrderCard;
