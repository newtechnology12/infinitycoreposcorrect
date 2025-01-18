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

export default function AlertInKitchen({
  isDesktop,
  notification,
  setOrder,
  notificationList,
  removeNotification,
}: {
  isDesktop: boolean;
  notificationList: any;
  setOrder: any;
  notification: number;
  removeNotification: any;
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
              removeNotification={removeNotification}
            />
          );
        })}
      </>
    );
}

function ActionButton({ value, removeNotification,setOrder }) {
  const [isUpdatingOrder, setisUpdatingOrder] = useState(false);
  const [isUpdatingOrdercanceled, setisUpdatingOrdercanceled] = useState(false);
  const [isOpne, setIsOpen] = useState(true);

  return (
    <AlertDialog open={isOpne}>
      <AlertDialogContent className="flex flex-col gap-0 items-center justify-center py-10">
        <IoNotifications className="text-5xl text-cyan-500 leading-none" />
        <div className="flex flex-col gap-3 items-center">
          <h1 className="block ml-0 font-medium text-lg leading-none mt-3">
            You have a new order form
          </h1>
          <h1 className="block ml-0 font-medium text-lg leading-none">
            Table - {value.expand?.table?.code}
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 mt-3">
          <button
            disabled={isUpdatingOrdercanceled}
            onClick={() => {
              setIsOpen(false);
            }}
            className={cn(
              "my-2 inline-flex flex-1 items-center justify-center whitespace-nowrap bg-slate-100 text-black hover:bg-opacity-80 rounded-sm text-[12px] font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300 px-4 py-2 w-full"
            )}
          >
            {isUpdatingOrdercanceled && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            Hold
          </button>

          <button
            disabled={isUpdatingOrder}
            onClick={() => {
              setisUpdatingOrder(true);
              pocketbase
                .collection("orders")
                .update(value.id, {
                  kitchenStatus: "queue",
                })
                .then((e) => {
                  setisUpdatingOrder(false);
                  setIsOpen(false);
                  removeNotification(value.id);
                  setOrder((prev) => {
                    return prev.map((order) => order.id === value.id ? {...order, kitchenStatus:"queue" }: order );
                  });
                  toast.success("Order updated succesfully");
                })
                .catch((e) => {
                  console.log(e);
                  setisUpdatingOrder(false);
                  toast.success(e.message);
                });
            }}
            className={cn(
              "my-2 inline-flex flex-1 items-center justify-center whitespace-nowrap bg-cyan-500 hover:bg-opacity-80 rounded-sm text-[12px] font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300 text-slate-50 px-4 py-2 w-full"
            )}
          >
            {isUpdatingOrder && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            Accept
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
