import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
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

export function IngredientsModal({ open, setOpen, onSelect }: any) {
  const isDesktop = useMediaQuery("(min-width: 620px)");

  const [selected, setselected] = useState();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] !pb-0 !px-0">
          <Ingredients
            setselected={setselected}
            selected={selected}
            setOpen={setOpen}
            onSelect={onSelect}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="!px-0">
        <Ingredients
          setselected={setselected}
          selected={selected}
          setOpen={setOpen}
          onSelect={onSelect}
        />
      </DrawerContent>
    </Drawer>
  );
}

function Ingredients({ onSelect, selected, setselected }: any) {
  const [search, setsearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    700,
    [search]
  );

  const ingredientsItemsQuery = useQuery({
    queryKey: ["pos", "ingredients", { search: debouncedSearch }],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = `name~"${debouncedSearch}"`;
      return pocketbase.collection("raw_items").getFullList(
        cleanObject({
          filter: [searchQ].filter((e) => e).join(" && "),
          expand: "unit",
        })
      );
    },
    enabled: true,
  });

  return (
    <div className="px-0">
      <div className="bg-white px-2 pt-3 sm:pt-0 pb-2 border-b">
        <div className="flex relative py-[8px] rounded-[4px] border border-slate-200 px-4 text-slate-600 z-40 bg-slate-100 items-center gap-3 justify-between">
          <input
            placeholder="Search item here.."
            className="w-full text-sm outline-none bg-transparent"
            type="search"
            onChange={(e) => setsearch(e.target.value)}
            value={search}
          />
          {ingredientsItemsQuery.isFetching && (
            <Loader className="mr-2 h-4 w-4 text-primary animate-spin" />
          )}

          <Search size={16} />
        </div>
      </div>

      {ingredientsItemsQuery.status === "loading" && (
        <div className="h-[350px] flex items-center justify-center w-full ">
          <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
        </div>
      )}
      {ingredientsItemsQuery.status === "success" && (
        <>
          {ingredientsItemsQuery.data.length === 0 && (
            <>
              <div className="flex px-4 text-center items-center py-14 justify-center gap-2 flex-col">
                <img className="h-16 w-16" src="/images/packages.png" alt="" />
                <h4 className="font-semibold text-[15px] mt-4">
                  No Ingredients item found
                </h4>
                <p className="text-[15px] max-w-sm leading-8 text-slate-500">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Vitae temporibus.
                </p>
              </div>
            </>
          )}
          {ingredientsItemsQuery.data.length !== 0 && (
            <ScrollArea className="sm:h-[300px] h-[500px] w-full rounded-md">
              {ingredientsItemsQuery.data.map((e, i) => {
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
                        <h4 className="text-[12.5px] capitalize font-medium">
                          {e.name}
                        </h4>
                        <p className="text-[13px] text-slate-500">
                          Lorem Ipsum
                        </p>
                      </label>
                      <div className="pr-2">
                        <Checkbox
                          id={`item-${e.id}`}
                          onCheckedChange={(n) =>
                            n ? setselected(e) : setselected(undefined)
                          }
                          // @ts-ignore
                          checked={selected?.id === e.id}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          )}
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
