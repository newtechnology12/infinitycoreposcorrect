import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import { cn } from "@/utils";
import { Minus, Plus } from "react-feather";
import { useMutation, useQueryClient } from "react-query";
import { Checkbox } from "./ui/checkbox";
import formatOrder from "@/utils/formatOrder";
import { useRoles } from "@/context/roles.context";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import recordActivtyLog from "@/utils/recordActivtyLog";
import { useAuth } from "@/context/auth.context";
import useSettings from "@/hooks/useSettings";

export default function UpdateOrderItemModal({
  open,
  setOpen,
  item,
  readOnly,
  order,
  ticket: currentTicket,
}: any) {
  const [notes, setnotes] = useState("");
  const [quantity, setquantity] = useState(item?.quantity);

  const [ticket, setTicket] = useState<any>(undefined);

  useEffect(() => {
    if (item?.notes) {
      setnotes(item?.notes);
    } else {
      setnotes("");
    }
  }, [item]);

  const handleUpdate = async () => {
    const newTicket = ticket || item?.order_ticket;

    await pocketbase.collection("order_items").update(item.id, {
      notes,
      quantity,
      order_ticket: newTicket,
      modifiers,
      amount: total_price,
      variant: menu?.variants?.find((e) => e.id === variant),
    });

    if (item?.order_ticket !== newTicket) {
      await pocketbase.collection("oreder_tickets").update(newTicket, {
        "order_items+": item?.id,
      });
    }
    setTicket(undefined);
  };

  const handleDelete = async () => {
    await pocketbase.collection("order_items").delete(item.id);
  };

  const queryClient = useQueryClient();

  const key = ["pos", "orders", item?.order];

  const updateMutation = useMutation({
    mutationFn: handleUpdate,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });

      const prevOrder: any =
        queryClient.getQueryData(key) || formatOrder(order);

      const newOrderItems = prevOrder.items.map((e) => {
        if (e.id === item.id) {
          return {
            ...e,
            notes,
            quantity,
            order_ticket: ticket || item.order_ticket,
            modifiers,
            amount: total_price,
          };
        }
        return e;
      });

      console.log(prevOrder);

      const newTickets = (
        prevOrder?.expand?.tickets ||
        prevOrder?.original?.expand?.tickets ||
        []
      ).map((e) => {
        if (e.id === item.order_ticket) {
          return {
            ...e,
            order_items: e.order_items.filter((e) => e !== item.id),
          };
        }
        if (e.id === ticket) {
          return {
            ...e,
            order_items: [...e.order_items, item.id],
          };
        }
        return e;
      });

      const newOrder = {
        ...prevOrder,
        items: newOrderItems,
        expand: {
          ...prevOrder.expand,
          items: newOrderItems,
          tickets: newTickets,
        },
      };

      queryClient.setQueryData(key, () => formatOrder(newOrder));

      return { prevOrder };
    },
    onError: (__, _, context) => {
      queryClient.setQueryData(key, context.prevOrder);
      toast.error("Failed to add item to order");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.refetchQueries({ queryKey: ["orders", item?.order] });
    },
  });

  const { user } = useAuth();

  const deleteItemMutation = useMutation({
    mutationFn: handleDelete,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });

      const prevOrder: any =
        queryClient.getQueryData(key) || formatOrder(order);

      const newOrderItems = prevOrder.items.filter((e) => e.id !== item.id);

      const newTickets = prevOrder.expand.tickets.map((e) => {
        if (e.id === item.order_ticket) {
          return {
            ...e,
            order_items: e.order_items.filter((e) => e !== item.id),
          };
        }
        return e;
      });

      const newOrder = {
        ...prevOrder,
        items: newOrderItems,
        expand: {
          ...prevOrder.expand,
          items: newOrderItems,
          tickets: newTickets,
        },
      };

      queryClient.setQueryData(key, () => formatOrder(newOrder));

      return { prevOrder };
    },
    onSuccess: () => {
      recordActivtyLog({
        title: "Order Item Deleted",
        event_type: "ORDER_ITEM_DELETED",
        details: `order item ${menu?.name} removed from order ${
          order?.code || ""
        }`,
        log_level: "WARNING",
        user: user?.id,
      });
    },
    onError: (__, _, context) => {
      queryClient.setQueryData(key, context.prevOrder);
      toast.error("Failed to delete item to order");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.refetchQueries({ queryKey: ["orders", item?.order] });
    },
  });

  const menu = item?.expand?.menu;

  useEffect(() => {
    setquantity(item?.quantity);
    // set modifiers existing on item and on menu
    setmodifiers(item?.modifiers || []);
  }, [item]);

  const price = menu?.price;

  const [variant, setVariant] = React.useState(item?.variant?.id);

  const [modifiers, setmodifiers] = React.useState<any>([]);

  const priceCalc =
    menu?.variants?.find((e) => e.id === variant)?.price || price;

  const total_price =
    (Number(priceCalc) +
      modifiers.reduce((a, b) => a + Number(b.additional_price), 0)) *
    quantity;
  const { canPerform } = useRoles();

  const varintsPrice = menu?.variants
    ?.map((e) => Number(e.price).toLocaleString() + " FRW")
    .join(" - ");

  const pricetToUse = menu?.variants?.length
    ? varintsPrice
    : Number(menu?.price).toLocaleString() + " FRW";

  const { settings } = useSettings();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[445px]">
        <div className="flex pt-4- sm:pt-0 items-center gap-3">
          <div className="flex h-20 w-20">
            <img
              className="object-cover w-full rounded-[4px] border border-slate-200"
              src={menu?.image || "/images/menu_placeholder.png"}
              alt=""
            />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[14.5px] capitalize font-semibold">
                {menu?.name}
              </h4>
            </div>
            <div className="flex items-end justify-between w-full">
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-slate-500">
                  {pricetToUse}
                </p>
                <p className="text-sm gap-2 font-medium">
                  <span className="text-[13px] text-slate-500">Quantity:</span>
                  <span className="font-semibold text-slate-700 ml-1 text-[13px]">
                    {quantity}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {menu?.modifiers?.length ? (
          <div className="mt-2">
            <div className="py-[5px]">
              <h4 className="text-xs text-slate-900 font-medium uppercase">
                Modifiers
              </h4>
            </div>
            {menu?.modifiers?.map((e, i) => {
              return (
                <div
                  key={i}
                  className="flex py-2 items-center justify-between-"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      onCheckedChange={(value) => {
                        if (value) {
                          setmodifiers([...modifiers, e]);
                        } else {
                          setmodifiers(
                            modifiers.filter((el) => el.name !== e.name)
                          );
                        }
                      }}
                      checked={Boolean(
                        modifiers.find((el) => el.name === e.name)
                      )}
                      id={`select-${i}`}
                    />
                    <label
                      htmlFor={`select-${i}`}
                      className="text-[13px] text-slate-500 truncate font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {e.name}
                    </label>
                  </div>

                  <div className="flex-1 mx-3 border-b border-dashed"></div>
                  <span className="truncate text-[13px] font-semibold text-primary">
                    {Number(e.additional_price).toLocaleString()} FRW
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {menu?.variants?.length ? (
          <div className="mt-2 mb-2">
            <div className="py-[5px]">
              <h4 className="text-xs text-slate-900 font-medium uppercase">
                Variants
              </h4>
            </div>
            <RadioGroup
              className="mt-2"
              value={variant}
              onValueChange={(e) => setVariant(e)}
              disabled={readOnly}
            >
              {menu?.variants?.map((e) => {
                return (
                  <div className="flex py-1 items-center space-x-2">
                    <RadioGroupItem value={e.id} id={e.id} />
                    <Label className="ml-1" htmlFor={e.id}>
                      {e.name} ({Number(e.price).toLocaleString()} FRW)
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          {!readOnly ||
          (canPerform("modify_ticket_items") &&
            order?.status !== "completed" &&
            currentTicket?.status !== "completed") ? (
            <div className="flex justify-center select-none flex-col">
              <div className="flex px-2- items-center gap-2">
                <a
                  className={cn(
                    "h-7 w-7  cursor-pointer flex items-center justify-center bg-slate-200 rounded-sm",
                    {
                      "pointer-events-none opacity-65": quantity === 1,
                    }
                  )}
                  onClick={() => quantity !== 1 && setquantity(quantity - 1)}
                >
                  <Minus size={13} />
                </a>
                <span className="text-[12px] px-2 text-slate-600 font-semibold">
                  {quantity}
                </span>
                <a
                  className="h-7 cursor-pointer w-7 flex items-center justify-center bg-primary text-white rounded-sm"
                  onClick={() => setquantity(quantity + 1)}
                >
                  <Plus size={13} />
                </a>
              </div>
            </div>
          ) : (
            <h4 className="text-sm">Total</h4>
          )}
          <p className="font-semibold select-none text-sm text-primary">
            {total_price?.toLocaleString()} FRW
          </p>
        </div>

        {!readOnly ||
        (canPerform("modify_ticket_items") &&
          order?.status !== "completed" &&
          currentTicket?.status !== "completed") ? (
          <div className="mt-1">
            <div className="px-2- mt-1 mb-2">
              <Textarea
                value={notes}
                onChange={(e) => setnotes(e.target.value)}
                placeholder="Add some notes here."
                rows={2}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 px-2- pb-1">
              {settings?.enable_delete_draft_items && (
                <Button
                  onClick={() => {
                    deleteItemMutation.mutate();
                    setOpen(false);
                  }}
                  className="w-full"
                  size="sm"
                  variant="destructive"
                >
                  Remove Order Item
                </Button>
              )}

              <Button
                onClick={() => {
                  updateMutation.mutate();
                  setOpen(false);
                }}
                className="w-full"
                size="sm"
              >
                Update Order Item
              </Button>
            </div>
          </div>
        ) : (
          <>
            {item && (
              <div className="ml-0">
                <p className="whitespace-normal text-[13px] capitalize text-slate-500 leading-7">
                  <span className="underline mr-1">Status: </span>
                  {item?.status}
                </p>
                <p className="whitespace-normal text-[13px] text-slate-500 leading-7">
                  <span className="underline mr-1">Sent at:</span>{" "}
                  {new Date(item?.created).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="whitespace-normal text-[13px] text-slate-500 leading-7">
                  <span className="underline mr-1">Destination:</span>{" "}
                  {item?.expand?.menu?.expand?.destination?.name}
                </p>
                {item?.notes && (
                  <p className="whitespace-normal text-[13px] text-slate-500 leading-7">
                    <span className="underline">Notes</span>: {item?.notes}
                  </p>
                )}
                {item.modifiers?.length ? (
                  <div>
                    <div>
                      <h4 className="text-xs uppercase font-medium text-slate-600 mt-2">
                        Modifiers
                      </h4>
                    </div>
                    {item.modifiers && (
                      <div className="text-[13px] pl-3 text-slate-500 font-medium- items-center justify-between">
                        {item.modifiers.map((e, i) => {
                          return (
                            <div
                              key={i}
                              className="flex items-center leading-7 gap-2"
                            >
                              +{" "}
                              <span className="capitalize underline">
                                {e.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
