import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "react-use";
import React, { useState } from "react";
import { useQuery } from "react-query";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import Loader from "../icons/Loader";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

export function StockItemsModal({ open, setOpen, onSelect, stock }: any) {
  const [selected, setselected] = useState([]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] !pb-0 !px-0">
        <StockItems
          stock={stock}
          setselected={setselected}
          selected={selected}
          setOpen={setOpen}
          onSelect={onSelect}
        />
      </DialogContent>
    </Dialog>
  );
}

function StockItems({ onSelect, selected, setselected, stock }: any) {
  const [search, setsearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    700,
    [search]
  );

  const stockItemsQuery = useQuery({
    queryKey: ["stock_items", { search: debouncedSearch, stock }],
    keepPreviousData: true,
    queryFn: async () => {
      const searchQ = `item.name~"${debouncedSearch}" || item.menu.name~"${debouncedSearch}"`;
      return pocketbase.collection("stock_items").getFullList(
        cleanObject({
          filter: [searchQ, `stock="${stock}"`].filter((e) => e).join(" && "),
          expand: "item,item.unit,item.menu,item.menu.subCategory",
        })
      );
    },
    enabled: true,
  });

  return (
    <div className="px-0">
      <div className="bg-white px-2 pt-3 sm:pt-0 pb-2 border-b">
        <div className="flex focus-within:border-green-600 relative py-[8px] rounded-[4px] border border-slate-200 px-4 text-slate-600 z-40 bg-slate-100 items-center gap-3 justify-between">
          <input
            placeholder="Search item here.."
            className="w-full text-[13px] outline-none bg-transparent"
            type="search"
            onChange={(e) => setsearch(e.target.value)}
            value={search}
          />
          {stockItemsQuery.isFetching && (
            <Loader className="mr-2 h-4 w-4 text-primary animate-spin" />
          )}
          <Search size={16} />
        </div>
      </div>

      {stockItemsQuery.status === "loading" && (
        <div className="h-[350px] flex items-center justify-center w-full ">
          <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
        </div>
      )}

      {stockItemsQuery.status === "success" && (
        <>
          {stockItemsQuery.data.length === 0 && (
            <>
              <div className="flex px-4 text-center items-center py-14 justify-center gap-2 flex-col">
                <img className="h-16 w-16" src="/images/packages.png" alt="" />
                <h4 className="font-semibold text-[14px] mt-4">
                  No Stock item found
                </h4>
                <p className="text-[14px] max-w-sm leading-8 text-slate-500">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Vitae temporibus.
                </p>
              </div>
            </>
          )}
          <div className="relative">
            {stockItemsQuery.data.length !== 0 && (
              <ScrollArea className="sm:h-[300px] h-[500px] w-full ">
                <div className="relative h-full">
                  {stockItemsQuery.data.map((e, i) => {
                    return (
                      <div
                        key={i}
                        className="px-3  border-b hover:bg-slate-50 cursor-pointer py-2 sm:py-1"
                      >
                        <div className="flex justify-between items-center gap-3">
                          <label
                            htmlFor={`item-${e.id}`}
                            className="space-y-1 cursor-pointer"
                          >
                            <h4 className="text-[12.5px] capitalize font-semibold">
                              {e?.expand?.item?.name ||
                                e.expand?.item?.expand?.menu?.name}
                            </h4>

                            <p className="text-[12px] text-slate-500">
                              Unit:
                              <span className="text-slate-500 capitalize font-medium ml-1">
                                {e.expand?.item?.expand?.unit?.name || "N.A"}
                              </span>
                            </p>
                          </label>
                          <div className="pr-2">
                            <Checkbox
                              id={`item-${e.id}`}
                              onCheckedChange={(n) =>
                                setselected((prev) => {
                                  if (n) {
                                    return [...(prev || []), e];
                                  } else {
                                    return prev.filter((s) => s.id !== e.id);
                                  }
                                })
                              }
                              // @ts-ignore
                              checked={Boolean(
                                selected?.find((s) => s.id === e.id)
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </>
      )}
      <DialogFooter className="border-t">
        <div className="mt-2 w-full flex items-center gap-2 px-2 pb-1">
          <Button
            type="submit"
            onClick={() => {
              onSelect(selected);
              setselected(undefined);
            }}
            disabled={!selected}
            className="w-full"
            size="sm"
          >
            Add items now.
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}
