/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Minus, Plus } from "react-feather";
import { Button } from "./ui/button";
import { cn } from "@/utils";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { useMutation, useQueryClient } from "react-query";
import { Checkbox } from "./ui/checkbox";
import getFileUrl from "@/utils/getFileUrl";
import Loader from "./icons/Loader";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import recordActivtyLog from "@/utils/recordActivtyLog";
import { useAuth } from "@/context/auth.context";

export function MenuDetailsModals({ open, setOpen, ...props }: any) {
  const [isloading, setIsloading] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={!isloading && setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <MenuDetails setIsloading={setIsloading} {...props} setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}

function MenuDetails({
  menu,
  setOpen,
  showAddingOptions,
  order,
  setIsloading,
  isKitchen,
  isloading,
  activeCourse,
  refetch,
}: any) {
  const [count, setcount] = React.useState(1);

  const price = menu?.price;

  const [error, setError] = React.useState("");

  const { user } = useAuth();

  const [adding, setAdding] = React.useState(false);

  const handleAdd = async () => {
    try {
      setAdding(true);
      setError("");
      if (!total_price) throw new Error("Please select a valid quantity");

      if (!activeCourse)
        throw Error("Something Went wrong, no ticket selected");

      if (!menu) throw Error("Something Went wrong, no ticket selected");

      return pocketbase
        .send("/create-order-item", {
          method: "POST",
          body: JSON.stringify({
            order: order.id,
            menu: menu.id,
            quantity: count,
            modifiers: modifiers,
            variant: menu?.variants?.find((e) => e.id === variant),
            notes: "",
            amount: total_price,
            order_ticket: activeCourse,
          }),
        })
        .then(() => {
          setTimeout(() => {
            setAdding(false);
            toast.success("Item added to order");
            setOpen(false);
            refetch();
            recordActivtyLog({
              title: "Order item added",
              event_type: "ORDER_ITEM_ADDED",
              details: `order item ${menu?.name} added to order ${order?.code}`,
              log_level: "INFO",
              user: user?.id,
            });
          }, 200);
        });
    } catch (error) {
      toast.error("Failed to add item to order");
      setError(error.message);
      setAdding(false);
    }
  };

  const track_inventory = menu?.track_inventory;

  const stock_item = menu?.expand?.stock_items?.find(
    (i) => i.stock === menu?.expand?.destination?.stock
  );
  const availableQuantity = stock_item?.available_quantity;
  const quantity_alert = stock_item?.quantity_alert;
  const isOutOfStock = availableQuantity <= 0;
  const isLowStock = availableQuantity <= quantity_alert;

  const [variant, setVariant] = React.useState(menu?.variants?.[0]?.id);

  const [modifiers, setmodifiers] = React.useState<any>([]);

  const priceCalc =
    menu?.variants?.find((e) => e.id === variant)?.price || price;

  const total_price =
    (Number(priceCalc) +
      modifiers.reduce((a, b) => a + Number(b.additional_price), 0)) *
    count;

  const varintsPrice = menu?.variants
    ?.map((e) => Number(e.price).toLocaleString() + " FRW")
    .join(" - ");

  const pricetToUse = menu?.variants?.length
    ? varintsPrice
    : Number(menu?.price || 0).toLocaleString() + " FRW";

  return (
    <div className="px-3- sm:px-0">
      <div className="flex pt-4- sm:pt-0 items-center gap-3">
        <div>
          <img
            className="h-20 object-cover rounded-md border border-slate-200 w-20"
            src={
              menu?.image ||
              getFileUrl({
                file: menu?.image_file,
                collection: "menu_items",
                record: menu?.id,
              }) ||
              "/images/menu_placeholder.png"
            }
            alt=""
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-[14.5px] capitalize font-semibold">
              {menu?.name}
            </h4>
            <span>
              {menu?.availability === "unavailable" && (
                <span className="text-[12px] font-medium text-red-500">
                  - Unavailable
                </span>
              )}
            </span>
          </div>
          <p className="text-[13px] font-medium text-slate-500">
            {pricetToUse}
          </p>
          {track_inventory && (
            <p className="text-sm gap-2 font-medium">
              <span className="text-[13px] text-slate-500">Stock:</span>
              <span className="font-semibold ml-1 inline-block text-slate-700 text-[13px]">
                {isOutOfStock
                  ? "Out of stock"
                  : isLowStock
                  ? "Low stock"
                  : "Available"}
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2 mt-3 px-1 pb-[6px]">
        <div>
          <h4 className="text-[13px] font-semibold">Description</h4>
          <p className="text-[14.5px] text-slate-500 my-1 leading-7">
            {menu?.description}
          </p>
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
                          setmodifiers([...modifiers, { ...e }]);
                        } else {
                          setmodifiers(
                            modifiers.filter((el) => el.name !== e.name)
                          );
                        }
                      }}
                      checked={Boolean(
                        modifiers.find((el) => el.name === e.name)
                      )}
                      id={e.name}
                    />
                    <label
                      htmlFor={e.name}
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
          <div className="mt-2">
            <div className="py-[5px]">
              <h4 className="text-xs text-slate-900 font-medium uppercase">
                Variants
              </h4>
            </div>
            <RadioGroup
              className="mt-2"
              value={variant}
              onValueChange={(e) => setVariant(e)}
            >
              {menu?.variants?.map((e) => {
                return (
                  <div className="flex py-1 items-center space-x-2">
                    <RadioGroupItem value={e.id} id={e.id} />
                    <Label className="ml-1" htmlFor={e.id}>
                      {e.name} ({Number(e.price || 0).toLocaleString()} FRW)
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        ) : null}

        {showAddingOptions && (
          <>
            <div>
              <div className="flex items-center mt-3 mb-4  justify-between">
                <div className="flex px-0 items-center gap-3">
                  <a
                    onClick={() =>
                      count > 1 ? setcount((prev) => prev - 1) : {}
                    }
                    className="h-8 w-8 flex items-center cursor-pointer justify-center bg-slate-200 rounded-sm"
                  >
                    <Minus size={16} />
                  </a>

                  <span className="text-[15px] select-none px-1 text-slate-600 font-semibold">
                    {count}
                  </span>
                  <a
                    onClick={() => setcount((prev) => prev + 1)}
                    className="h-8 w-8 flex cursor-pointer items-center justify-center bg-primary text-white rounded-sm"
                  >
                    <Plus size={16} />
                  </a>
                </div>
                <p className="font-semibold select-none text-sm text-primary">
                  {total_price?.toLocaleString()} FRW
                </p>
              </div>
            </div>
            <div>
              {error && (
                <div className="px-3- py-2">
                  <Alert
                    variant="destructive"
                    className="py-2 -mt-2- rounded-[4px] flex items-center"
                  >
                    <AlertCircleIcon className="!h-8 -mt-[14px] mr-3 w-4" />
                    <AlertTitle className="text-[13px] font-medium fon !m-0">
                      {error}
                    </AlertTitle>
                  </Alert>
                </div>
              )}
            </div>
            <div className="w-full sm:pb-0 pb-2- mt-3">
              <Button
                onClick={() => {
                  handleAdd();
                }}
                disabled={
                  menu?.availability === "unavailable" ||
                  order.status === "canceled" ||
                  order.status === "completed" ||
                  !activeCourse ||
                  adding
                }
                className="w-full select-none"
              >
                {adding && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                Add To Cart
              </Button>
            </div>
          </>
        )}
      </div>
      {isKitchen && (
        <ChangeTheDisheStatus
          dbstatus={menu?.availability}
          id={menu?.id}
          setIsloading={setIsloading}
          isloading={isloading}
        />
      )}
    </div>
  );
}

function ChangeTheDisheStatus({
  dbstatus,
  id,
  setIsloading,
  isloading,
}: {
  dbstatus: any;
  id: any;
  setIsloading: any;
  isloading: any;
}) {
  const [status, setStatus] = React.useState(dbstatus === "available");
  const queryClient = useQueryClient();
  async function handleOnclick() {
    setIsloading(true);
    try {
      await pocketbase.collection("menu_items").update(id, {
        availability: status ? "unavailable" : "available",
      });
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsloading(false);
    }
  }

  return (
    <button
      disabled={isloading}
      className={cn({
        "flex w-full items-center px-1 pb-3 pt-1 justify-between cursor-pointer":
          true,
        "cursor-wait": isloading,
      })}
      onClick={() => {
        setStatus((prev) => !prev);
        handleOnclick();
      }}
    >
      <div className="flex flex-col gap-3 items-start">
        <div className="text-[13px] font-medium leading-none">
          You want to make this dish {status ? "unavailable" : "available"} ?
        </div>
        <p className="text-[12.5px] text-slate-500 leading-none">
          Change the menu status
        </p>
      </div>
      <div>
        <Switch
          className="focus:shadow-[0_0_0_2px] border border-primary data-[state=checked]:border-slate-300  focus:shadow-primary data-[state=checked]:bg-primary"
          checked={status}
        />
      </div>
    </button>
  );
}
