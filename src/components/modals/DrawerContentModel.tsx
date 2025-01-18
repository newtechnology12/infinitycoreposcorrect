/* eslint-disable @typescript-eslint/no-explicit-any */
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
import { DialogContent } from "../ui/dialog";
import { DrawerContent } from "../ui/drawer";
import { LuPrinter } from "react-icons/lu";

import { Button } from "../ui/button";
import { InvoiceModal } from "../InvoiceModal";
import { useState } from "react";
import { AlertDialog, AlertDialogTrigger } from "../ui/alert-dialog";
import AreSure from "../shared/AreSure";
import dayjs from "dayjs";
import { cn } from "@/utils";

export default function DrawerContentModel({
  isDesktop = true,
  data,
  setOpen,
  setOrder,
}: {
  isDesktop: boolean;
  data: any;
  setOpen: any;
  setOrder: any;
}) {
  if (isDesktop) {
    return (
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={() => {
          setOpen(false);
        }}
        onPointerDownOutside={() => {
          setOpen(false);
        }}
        className="flex flex-col items-center p-0 m-0 bg-white w-full max-w-lg"
      >
        <ContentModel setOrder={setOrder} data={data} setOpen={setOpen} />
      </DialogContent>
    );
  }
  return (
    <DrawerContent
      onCloseAutoFocus={(e) => {
        e.preventDefault();
      }}
      className="flex flex-col items-center justify-center p-0 m-0 bg-white"
    >
      <ContentModel setOrder={setOrder} data={data} setOpen={setOpen} />
    </DrawerContent>
  );
}

function ContentModel({
  data,
  setOpen,
  setOrder,
}: {
  data: any;
  setOpen: any;
  setOrder: any;
}) {
  const [showPrintIvoiceModal, setshowPrintIvoiceModal] = useState(false);
  return (
    <div className="relative w-full h-full">
      <div
        onClick={() => setOpen(false)}
        className="cursor-pointer absolute right-0 w-8 z-50  bg-transparent h-8"
      />
      <div className="py-3 flex flex-col items-start justify-start px-4 sm:overflow-hidden w-full mx-auto overflow-auto max-h-[80vh] sm:max-h-max mt-1">
        <div className="pb-12 sm:pb-0 w-full">
          <h1 className="block ml-0 font-semibold">Order Details</h1>
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between w-full">
                <h1 className="block ml-0 font-semibold text-sm mt-3">
                  Table (#{data?.expand?.table.code})
                </h1>
                <Button
                  variant="outline"
                  onClick={() => setshowPrintIvoiceModal(true)}
                  className="w-8 h-8 bg-slate-100"
                  size="icon"
                >
                  <LuPrinter className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-between items-center rounded-sm w-full mt-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn({
                      "rounded-sm flex justify-center items-center w-12 h-12 p-1":
                        true,
                      "bg-cyan-500 text-white": data.orderStatus === "Queue",
                      "bg-orange-500 text-white":
                        data.orderStatus === "Cooking",
                      "bg-blue-500 text-white": data.orderStatus === "Ready",
                      "bg-primary text-white": data.orderStatus === "Completed",
                      "bg-red-500 text-white": data.orderStatus === "Canceled",
                    })}
                  >
                    <IoCheckmarkDoneCircleOutline className="text-white text-3xl" />
                  </div>
                  <div className="flex flex-col items-start">
                    <h2 className="text-[15px] leading-none text-black">
                      {data?.itemCount}x Order #{data?.code}
                    </h2>
                    <div className="text-xs flex items-center gap-2 leading-none text-slate-600  mt-1 text-start">
                      <span>Progress</span>
                      <span
                        className={cn({
                          "text-white text-[10px] px-1 py-1.5 rounded-sm font-semibold":
                            true,
                          "bg-cyan-500": data.orderStatus === "Queue",
                          "bg-orange-500": data.orderStatus === "Cooking",
                          "bg-blue-500": data.orderStatus === "Ready",
                          "bg-primary": data.orderStatus === "Completed",
                          "bg-red-500": data.orderStatus === "Canceled",
                        })}
                      >
                        100%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs leading-none text-slate-600  mt-1 text-start">
                    Status:{" "}
                    <u
                      className={cn({
                        capitalize: true,
                        "text-cyan-500": data.orderStatus === "Queue",
                        "text-orange-500": data.orderStatus === "Cooking",
                        "text-blue-500": data.orderStatus === "Ready",
                        "text-primary": data.orderStatus === "Completed",
                        "text-red-500": data.orderStatus === "Canceled",
                      })}
                    >
                      {data.orderStatus}
                    </u>
                  </span>
                  <span className="text-xs leading-none text-slate-600  mt-1 text-start">
                    Due {dayjs(data?.created).format("h:mm:ss A")}
                  </span>
                </div>
              </div>
              <div className="bg-slate-100 mb-2 px-3 py-3 rounded-md sm:max-h-[420px] overflow-auto">
                <h2 className="text-[15px] leading-none text-black font-medium mt-1">
                  Order Details
                </h2>
                <div className="flex flex-col gap-4 mt-2 overflow-auto">
                  {data?.items?.map((item: any, idx) => {
                    return (
                      <div
                        className={cn({
                          "flex justify-between items-start border-b pb-4":
                            true,
                          "border-transparent": idx === data.items.length - 1,
                        })}
                        key={idx}
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <img
                              src={item?.expand.menu.image}
                              className="w-6 h-6 bg-red-400 rounded-full"
                            />
                            <span className="capitalize text-slate-600 text-[16px]">
                              {item?.expand.menu.name}
                            </span>
                          </div>
                          <p className="text-sm mt-2 leading-none text-slate-600 w-full text-wrap text-left">
                            {item?.expand.menu.description}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {item?.variant &&
                              Object.entries(item?.variant).map((v, i) => {
                                return (
                                  <div
                                    className="flex mt-2 items-center gap-2"
                                    key={i}
                                  >
                                    <span className="text-xs leading-none underline text-slate-600 text-left capitalize">
                                      {v[0]}:
                                    </span>
                                    <div className="flex items-center gap-2 flex-wrap flex-1">
                                      <div
                                        className={cn(
                                          "rounded-md text-xs px-2.5 pt-0.5 pb-1 capitalize text-slate-600",
                                          {
                                            "bg-cyan-500/20":
                                              data.orderStatus === "Queue",
                                            "bg-orange-500/20":
                                              data.orderStatus === "Cooking",
                                            "bg-blue-500/20":
                                              data.orderStatus === "Ready",
                                            "bg-primary/20":
                                              data.orderStatus === "Completed",
                                            "bg-red-500/20":
                                              data.orderStatus === "Canceled",
                                          }
                                        )}
                                      >
                                        {
                                          // @ts-ignore
                                          v[1]?.name
                                        }
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                        <span className="text-black text-sm">
                          x{item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="w-full"
                  disabled={
                    data.orderStatus === "Completed" ||
                    data.orderStatus === "Ready" ||
                    data.orderStatus === "Canceled"
                  }
                >
                  <Button
                    disabled={
                      data.orderStatus === "Completed" ||
                      data.orderStatus === "Ready" ||
                      data.orderStatus === "Canceled"
                    }
                    className={cn({
                      "w-full capitalize text-sm rounded-md hover:bg-opacity-70":
                        true,
                      "bg-cyan-500 hover:bg-cyan-500/80":
                        data.orderStatus === "Queue",
                      "bg-orange-500 hover:bg-orange-500/80":
                        data.orderStatus === "Cooking",
                      "bg-blue-500 hover:bg-blue-500/80":
                        data.orderStatus === "Ready",
                      "bg-primary hover:bg-primary/80 cursor-not-allowed":
                        data.orderStatus === "Completed",
                      "bg-red-500 hover:bg-red-500/80 ":
                        data.orderStatus === "Canceled",
                    })}
                  >
                    {data.orderStatus === "Queue" && "Start Cooking"}
                    {data.orderStatus === "Cooking" && "Now Food is Ready"}
                    {data.orderStatus === "Ready" && "Waiting to be Completed"}
                    {data.orderStatus === "Completed" && "Done"}
                    {data.orderStatus === "Canceled" && "Order is canceled"}
                  </Button>
                </AlertDialogTrigger>
                <AreSure
                  setOrder={setOrder}
                  status={data.orderStatus}
                  data={data}
                  onDone={() => setOpen(false)}
                />
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
      <InvoiceModal
        handlePay={() => {
          setshowPrintIvoiceModal(false);
        }}
        isKitchen={true}
        open={showPrintIvoiceModal}
        setOpen={setshowPrintIvoiceModal}
        isReciept={data?.status === "completed"}
        order={data}
      />
    </div>
  );
}
