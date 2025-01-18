/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/utils";
import { IoNotifications } from "react-icons/io5";
import {
  AlertDialog,
  AlertDialogContent,
} from "../ui/alert-dialog";
import pocketbase from "@/lib/pocketbase";
import { useState } from "react";
import { toast } from "sonner";
import Loader from "../icons/Loader";

export default function AlertInKitchenWhichWasIn({
  isDesktop,
  notification,
  setOrder,
  notificationList,
  removeNotification,
  newNotificationItem,
}: {
  isDesktop: boolean;
  notificationList: any;
  setOrder: any;
  notification: number;
  removeNotification: any;
  newNotificationItem:any;
}) {
  if (notification >= 1)
    return (
      <>
        {notificationList.map((value) => {
          return (
            <ActionButton
              value={value}
              key={value.id}
              setOrder={setOrder}
              data={value}
              newNotificationItem={newNotificationItem}
            />
          );
        })}
      </>
    );
}

function ActionButton({ value, newNotificationItem,setOrder }) {
  const [isUpdatingOrdercanceled, setisUpdatingOrdercanceled] = useState(false);
  const [isOpne, setIsOpen] = useState(true);
  console.log("value-------------------:",newNotificationItem)
  console.log("-------------------:",value)

  return (
    <AlertDialog open={isOpne}>
      <AlertDialogContent className="flex flex-col gap-0 items-start justify-center py-10">
        <IoNotifications className="text-2xl text-yellow-500 leading-none" />
        <div className="flex flex-col gap-3 items-center">
          <h1 className="block ml-0 font-medium text-lg text-yellow-500 leading-none mt-3">
            New order is added on the table of <b>{value.expand?.table?.code}</b> 
          </h1>
          <h1 className="block mr-auto font-medium text-lg leading-none text-start">
            New things that was added on this order (v)
          </h1>
        </div>
        <div>

        </div>
        <div className="flex items-center gap-2 px-4 mt-3">
          <button
            disabled={isUpdatingOrdercanceled}
            onClick={() => {
              setisUpdatingOrdercanceled(true);
              pocketbase
                .collection("orders")
                .getOne(value.id)
                .then((e) => {
                  removeNotification(value.order_items_id);
                  setOrder((prev) => {
                    return prev.map((order) => order.id === value.id ? {...order }: order );
                  });
                setisUpdatingOrdercanceled(false);
                setIsOpen(false);
                  toast.success("Order updated succesfully");
                })
                .catch((e) => {
                  console.log(e);
                  setisUpdatingOrdercanceled(false);
                  toast.success(e.message);
                });
            }}
            className={cn(
              "my-2 inline-flex flex-1 items-center justify-center whitespace-nowrap bg-yellow-500 text-white hover:bg-opacity-80 rounded-sm text-[12px] font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300 px-4 py-2 w-full"
            )}
          >
            {isUpdatingOrdercanceled && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            Ok
          </button>

        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
