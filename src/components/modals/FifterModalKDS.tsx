import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import FilterModateFaceted from "../FilterModateFaceted";
import { useState } from "react";
import { useQueryClient } from "react-query";
import pocketbase from "@/lib/pocketbase";
import Loader from "../Loader";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";


export default function FifterModalKDS({ open, setOpen, onComplete,queryKey,queryFilterDirection,handleFilter }: any) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading,setLoading] = useState(false)
  const [filter, setFilter] = useState({
    waiter: searchParams.get("waiter")?.split(",") || null,
    table: searchParams.get("table")?.split(",") || null,
  });

  const queryClient = useQueryClient()

  const handleOpenChange = (open) => {
    if (!open) handleFilter(filter)
    setOpen(open)
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange} >
    <DialogContent className="sm:max-w-[350px]">
      <DialogHeader className="mt-2">
        <DialogTitle>
          <span className="text-base px-2 font-semibold py-2">
            Filter Based on Waiter and Table
          </span>
        </DialogTitle>
        <DialogDescription>
          <span className="px-2 inline-block py-0 text-[13px] text-slate-500">
             Feel free to choose the waiter and table to filter all tickets.
          </span>
        </DialogDescription>
      </DialogHeader>
          <div className="px-2 flex flex-col gap-2">
            <FilterModateFaceted filter={filter} type="waiter" setFilter={setFilter} />
            <FilterModateFaceted filter={filter} type="table" setFilter={setFilter} />
          </div>
          <DialogFooter>
            <div className="mt-3 flex items-center gap-2 px-2 pb-1">
              <Button
                type="submit"
                onClick={async () => {
                  const filterWaiter = filter["waiter"].length !== 0 ? `&&${filter["waiter"].map((v)=>`order.waiter.name = "${v}"`).join("&&")}` : ""
                  const filterTable = filter["table"].length !== 0 ? `&&${filter["table"].map((v)=>`order.table.name = "${v}"`).join("&&")}` : ""
                  setLoading(true)
                  try {
                    const getKichenDisplayTicketsWithFilter = await pocketbase.collection("order_tickets").getFullList(
                      {
                        filter: `${queryFilterDirection}${filterWaiter}${filterTable}`,
                        expand:
                        "order,order_items,order_items.menu,order.table,kitchen_display,order.waiter",
                      sort: "+arrangCounter",
                      }
                    )
                    queryClient.setQueriesData(queryKey,getKichenDisplayTicketsWithFilter)

                    const table = filter["table"] && filter["table"].join(",")
                    const waiter = filter["waiter"] && filter["waiter"].join(",")
                    const paramsValues = table && waiter ? {table,waiter} : table ? {table} : waiter ? {waiter} : {}
                    setSearchParams({
                      ...searchParams,
                      ...paramsValues
                    });
                    handleFilter(filter)
                    onComplete()
                  } catch (error) {
                    toast.error(error.message)
                  }finally{
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full"
                size="sm"
              >
                {loading && (
                  <Loader />
                )}
                Apply Filter
              </Button>
            </div>
          </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}
