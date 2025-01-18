import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/utils";
import { useNavigate } from "react-router-dom";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import Loader from "./icons/Loader";
import { useQuery } from "react-query";
import AsyncSelectField from "./AsyncSelectField";

export default function EditOrderModal({
  open,
  setOpen,
  order,
  onCompleted,
}: any) {
  const [guests, setguests] = useState<any>();
  const [table, settable] = useState<any>();

  const tablesQuery = useQuery({
    queryKey: ["pos", "tables"],
    queryFn: () => {
      return pocketbase.collection("tables").getFullList({
        filter: `status="available"`,
      });
    },
    enabled: open,
  });

  const tables = tablesQuery.data;

  useEffect(() => {
    if (order?.table && tables) {
      settable(order?.table);
    }
  }, [order?.table, tables, open]);

  const navigate = useNavigate();

  const [isUpdatingOrder, setisUpdatingOrder] = useState(false);

  const handleUpdateOrder = () => {
    setisUpdatingOrder(true);
    return pocketbase
      .collection("orders")
      .update(order.id, {
        guests: guests,
        table: table,
      })
      .then(async (e) => {
        navigate(`/pos/orders/${e.id}`);
        setisUpdatingOrder(false);
        onCompleted();
      })
      .catch((e) => {
        setisUpdatingOrder(false);
        toast.success(e.message);
      });
  };

  function tablesLoader({ search }) {
    return pocketbase
      .collection("tables")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-sm block- !pt-[2px] px-2 font-semibold py-2">
              Update Order Info
            </span>
          </DialogTitle>
          <DialogDescription>
            <p className="px-2 py-0 leading-7">
              This action cannot be undone this will permanently.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="px-2 mb-5">
            <h4 className="font-medium text-[13px] text-slate-600 mb-[8px]">
              Tables
            </h4>
            <AsyncSelectField
              onChange={({ value }) => {
                settable(value);
              }}
              value={table}
              name={"tables"}
              loader={tablesLoader}
            />
          </div>
          {table && (
            <div className="px-2">
              <h4 className="font-medium text-[13px] text-slate-600 mb-[8px]">
                Guests
              </h4>
              <div className="flex flex-wrap items-center gap-[10px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
                  .filter(
                    (e) =>
                      e <= (tables?.find((e) => e.id === table)?.seats || 4)
                  )
                  .map((e, i) => {
                    return (
                      <a
                        onClick={() => setguests(e)}
                        key={i}
                        className={cn(
                          "h-10 w-10 border hover:bg-slate-50 cursor-pointer border-slate-200 text-slate-500 rounded-[3px] font-medium flex items-center justify-center text-[13px]",
                          {
                            "border-primary bg-primary text-primary bg-opacity-5":
                              e === guests,
                          }
                        )}
                      >
                        {e}
                      </a>
                    );
                  })}
              </div>
            </div>
          )}
          <div className="mt-4 px-2 pb-1">
            <Button
              onClick={handleUpdateOrder}
              disabled={!guests || isUpdatingOrder}
              className="w-full"
              size="sm"
            >
              {isUpdatingOrder && (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              )}
              Update Table Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
