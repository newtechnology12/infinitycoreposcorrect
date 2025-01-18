import { useAuth } from "@/context/auth.context";
import pocketbase from "@/lib/pocketbase";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import Loader from "./icons/Loader";
import { AlertCircle, ArrowRightIcon, CheckIcon } from "lucide-react";
import { cn } from "@/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertTitle } from "./ui/alert";

function ChooseDestination({
  open,
  setOpen,
  order,
  refetch,
  onCompleted,
  printTicket,
  ticket,
}) {
  const getStations = () => {
    return pocketbase.collection("order_stations").getFullList();
  };

  const [selectedStationId, setSelectedStationId] = useState("");

  const {
    isLoading,
    data: orderStations,
    status,
  } = useQuery("order_stations", getStations);

  useEffect(() => {
    setSelectedStationId("");
  }, []);

  const completeTicket = async () => {
    return Promise.all(
      ticket?.items?.map((item) =>
        pocketbase.collection("order_items").update(item.id, {
          status: "completed",
        })
      )
    ).then(() => {
      return pocketbase
        .collection("order_tickets")
        .update(ticket.id, {
          status: "completed",
        })
        .then(() => {
          refetch();
        });
    });
  };

  const [error, setError] = useState("");

  const [firing, setFiring] = useState(false);

  const fireTicket = async () => {
    setFiring(true);

    setError("");

    const order_bills = order?.expand?.bills;

    const bill_to_use = order_bills[0];

    return pocketbase
      .send("/fire-ticket", {
        method: "POST",
        body: JSON.stringify({
          ticket: ticket.id,
          items: ticket.items.map((item) => item.id),
          bill: bill_to_use.id,
          station: selectedStationId,
        }),
      })
      .then(() => {
        refetch();
        setTimeout(() => {
          printTicket();
          if (ticket?.order_station?.auto_complete_tickets) {
            return completeTicket();
          }
          onCompleted();
          setSelectedStationId("");
          setFiring(false);
        }, 500);
      })
      .catch((error) => {
        setError(error.message);
        setFiring(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] !p-0 gap-0 md:h-fit flex flex-col">
        <DialogHeader className="pb-2 px-2 pt-2">
          <DialogTitle className="text-[15px]">
            Choose order station
          </DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div>
          <ScrollArea className="w-full scroller border-t border-t-slate-200 h-[400px] flex-1 whitespace-nowrap">
            <div className="grid px-2 grid-cols-1 gap-2 pb-3 w-full mt-3">
              {error && (
                <Alert
                  variant="destructive"
                  className="rounded-[3px] text-wrap !mt-2- mb-2  h-fit p-2 my-3-"
                >
                  <AlertCircle className="h-4 -mt-[4px] w-4" />
                  <AlertTitle className=" ml-2 !leading-6 !text-left">
                    <span className="text-[13px] leading-5">{error}</span>
                  </AlertTitle>
                </Alert>
              )}

              {isLoading && (
                <div className="space-y-3">
                  {[1, 2].map((_, indx) => (
                    <div
                      key={indx}
                      className="rounded-[4px] cursor-pointer border flex justify-between items-center w-full px-4 py-4 dark:!bg-opacity-25 bg-white"
                    >
                      <div className="space-y-3 w-full">
                        <Skeleton className="h-4  w-[200px]" />
                        <Skeleton className="h-3 w-[300px]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {status === "success" &&
                orderStations.map((kitchen) => (
                  <StationItem
                    key={kitchen.id}
                    kitchen={kitchen}
                    selectedKitchenId={selectedStationId}
                    onSelect={setSelectedStationId}
                  />
                ))}
            </div>
          </ScrollArea>

          <div className="px-2 py-[6px] border-t">
            <Button
              disabled={!selectedStationId || firing}
              className="mt-4- mb-1 w-full"
              size="sm"
              onClick={() => {
                fireTicket();
              }}
            >
              {firing && (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              )}
              Fire Ticket Now.
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChooseDestination;

const StationItem = ({ kitchen, selectedKitchenId, onSelect }) => {
  return (
    <div className="dark">
      <div
        onClick={() => onSelect(kitchen.id)}
        className={cn({
          "rounded-[4px] cursor-pointer border border-slate-200 flex justify-between items-center w-full px-3 py-2":
            true,
          "border-primary bg-white bg-opacity-50":
            selectedKitchenId === kitchen.id,
          "bg-white bg-opacity-50": selectedKitchenId !== kitchen.id,
        })}
      >
        <div className="space-y-[6px]">
          <h4 className="font-semibold capitalize text-slate-700 text-[13px]">
            {kitchen.name}
          </h4>
          <p className="font-medium- text-[13px] text-slate-500">
            {kitchen.description ||
              "Lorem ipsum dolor sit amet consectetur adipisicing elit."}
          </p>
        </div>

        {selectedKitchenId === kitchen.id && (
          <div>
            <div className="h-5 w-5 flex items-center justify-center text-white bg-primary rounded-full">
              <CheckIcon size={16} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
