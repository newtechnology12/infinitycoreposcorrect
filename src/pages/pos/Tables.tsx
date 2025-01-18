import { Button } from "@/components/ui/button";

import { cn } from "@/utils";
import {
  Sliders,
  Search,
  ChevronDown,
  X,
  Check,
  PlusCircle,
  MoreVertical,
} from "react-feather";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { FiShoppingBag } from "react-icons/fi";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeftToLine, CheckCircle, Menu, Trash2Icon } from "lucide-react";
import NewOrderModal from "@/components/NewOrderModal";
import { useQuery } from "react-query";
import pocketbase from "@/lib/pocketbase";
import { Skeleton } from "@/components/ui/skeleton";
import cleanObject from "@/utils/cleanObject";
import { useDebounce } from "react-use";
import Loader from "@/components/icons/Loader";
import { toast } from "sonner";
import TableFormModal from "@/components/TableFormModal";
import useModalState from "@/hooks/useModalState";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useShowSidebar from "@/hooks/useShowSidebar";
import { useworkShift } from "@/context/workShift.context";

export default function Tables() {
  const statuses = [
    { name: "available" },
    { name: "occupied" },
    { name: "reserved" },
    { name: "unavailable" },
  ];
  const [search, setsearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    700,
    [search]
  );

  const tablesQuery = useQuery({
    queryKey: ["pos", "tables", { search: debouncedSearch }],
    queryFn: () => {
      const searchQ = `name~"${debouncedSearch}"`;
      return pocketbase.collection("tables").getFullList(
        cleanObject({
          filter: [searchQ].filter((e) => e).join("&&"),
        })
      );
    },
    enabled: true,
  });

  const [showNewOrderModal, setshowNewOrderModal] = useState(false);

  const [selected, setselected] = useState<any>();

  const handleSelect = (table) => {
    setselected(table);
  };

  const navigate = useNavigate();

  const [editMode, seteditMode] = useState(false);

  const [updatingTables, setupdatingTables] = useState(false);

  const updateTables = (tables) => {
    setupdatingTables(true);
    return Promise.all(
      tables.map((e) => pocketbase.collection("tables").update(e.id, e))
    )
      .then(() => {
        tablesQuery.refetch();
        setTimeout(() => {
          toast.success("Tables updated succesfully");
          setupdatingTables(false);
          seteditMode(false);
        }, 1500);
      })
      .catch((e) => {
        toast.error("Tables failed to update");
        setupdatingTables(false);
        console.log(e);
      });
  };

  const [tableEditState, settableEditState] = useState([]);

  const newTableModal = useModalState();
  const [tableToDelete, settableToDelete] = useState(null);
  const [tableToUpdate, settableToUpdate] = useState(null);

  const { showSideBar } = useShowSidebar();

  return (
    <>
      <NewOrderModal
        table={selected}
        open={showNewOrderModal}
        setOpen={setshowNewOrderModal}
        tables={tablesQuery.data || []}
      />
      <DeleteTableAlert
        open={tableToDelete}
        setOpen={(e) => (e === false ? settableToDelete(false) : {})}
        table={tableToDelete}
        onDeleteFinish={() => {
          tablesQuery.refetch();
          settableToDelete(undefined);
          seteditMode(false);
        }}
      />
      <TableFormModal
        mode="minimal"
        open={newTableModal.isOpen || tableToUpdate}
        setOpen={
          tableToUpdate
            ? (e) => (e === false ? settableToUpdate(null) : {})
            : newTableModal.setisOpen
        }
        table={tableToUpdate}
        onCompleted={() => {
          tablesQuery.refetch();
          settableToUpdate(undefined);
          newTableModal.close();
          seteditMode(false);
        }}
      />

      <div className="h-dvh relative flex flex-col">
        <div>
          <div className="bg-white lg:hidden  py-2 border-b flex items-center justify-between px-3">
            <div className="font-semibold gap-3 flex items-center text-sm">
              <a
                onClick={() =>
                  navigate({
                    search: showSideBar ? "" : "?show_sidebar=yes",
                  })
                }
                className="h-8 w-8 cursor-pointer bg-slate-100 flex text-slate-600 items-center gap-2 justify-center rounded-[4px]"
              >
                {!showSideBar ? (
                  <Menu size={16} className="text-slate-700" />
                ) : (
                  <ArrowLeftToLine size={16} className="text-slate-700" />
                )}
              </a>

              <span>Choose a table</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <a className="h-8 w-8 bg-slate-100 flex text-slate-600 items-center gap-2 justify-center rounded-[4px]">
                  <Sliders size={16} className="text-slate-800" />
                </a>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-3">
                <DropdownMenuItem
                  onClick={() => {
                    newTableModal.open();
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span> Create new table</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="py-[6px] border-b sm:py-2 px-2">
            <div className="flex border py-1 px-1 min-w-[300px] focus-within:border-green-500  bg-white border-slate-200 overflow-hidden rounded-[4px] items-center gap-3-">
              <input
                className="text-sm bg-transparent w-full h-full px-2 outline-none"
                placeholder="Search a table here."
                type="search"
                onChange={(e) => setsearch(e.target.value)}
                value={search}
              />
              {tablesQuery.isFetching && (
                <Loader className="mr-2 h-4 w-4 text-primary animate-spin" />
              )}
              <div>
                <a className="bg-primary text-white h-8 w-8 rounded-[2px] flex items-center justify-center">
                  <Search size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <ScrollArea className="w-full h-full bg-slate-50 whitespace-nowrap">
          <div className="h-full pb-20 space-y-2 pb-32- py-3">
            {statuses.map((e, i) => {
              const tablesToShow =
                tablesQuery.status === "success"
                  ? tablesQuery?.data?.filter((p) => p.status === e.name)
                  : [];
              return (
                <TableStatusList
                  key={i}
                  status={e}
                  isLoading={tablesQuery.isLoading}
                  tablesToShow={tablesToShow}
                  selected={selected}
                  onselect={handleSelect}
                  settableToUpdate={settableToUpdate}
                />
              );
            })}
          </div>
        </ScrollArea>
        <ActionBar
          selected={selected}
          setselected={setselected}
          editMode={editMode}
          tableEditState={tableEditState}
          updatingTables={updatingTables}
          setshowNewOrderModal={setshowNewOrderModal}
          updateTables={updateTables}
        />
      </div>
    </>
  );
}

function TableStatusList({
  tablesToShow,
  status,
  selected,
  onselect,
  isLoading,
  settableToUpdate,
}) {
  const [callapsed, setcallapsed] = useState(true);
  return (
    <div className="border-b last-of-type:border-b-0 pb-2 px-[10px]">
      <div
        onClick={() => setcallapsed(!callapsed)}
        className="text-[13px] py-1 cursor-pointer flex items-center justify-between mb-2 font-medium capitalize"
      >
        <div className="flex items-center gap-2">
          <div
            className={cn("h-4 w-4 row-span-full border-[3px] rounded-full", {
              "bg-blue-500 border-blue-200": status.name === "available",
              "bg-slate-500 border-slate-200": status.name === "unavailable",
              "bg-red-500 border-red-200": status.name === "reserved",
              "bg-orange-500 border-orange-200": status.name === "occupied",
            })}
          ></div>
          <span className="font-semibold text-slate-600">
            {status.name} tables ({tablesToShow.length})
          </span>
        </div>
        <a>
          <ChevronDown size={16} className="text-slate-500" />
        </a>
      </div>
      {isLoading && (
        <>
          {[1, 2, 3].map((_, i) => {
            return (
              <div>
                <div
                  key={i}
                  className={cn(
                    "flex mb-2 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-[3px] px-2 py-2 border border-slate-200 items-center justify-between"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-[8px]">
                        <Skeleton className="h-3 w-32 rounded-full" />
                        <Skeleton className="h-3 w-36 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
      {callapsed ? (
        <div className="my-2 space-y-2">
          {tablesToShow.map((e, i) => {
            const isSelected = selected?.id === e.id;
            return (
              <div
                key={i}
                className={cn(
                  "flex mb-2 bg-white relative hover:bg-slate-50 hover:border-slate-300 rounded-[3px] px-2 py-2 border border-slate-200 items-center justify-between",
                  {
                    "pointer-events-none opacity-80": e.status !== "available",
                    "cursor-pointer ": e.status === "available",
                    "border-blue-500 border-[1.5px]": isSelected,
                    "hover:border-blue-500": isSelected,
                  }
                )}
              >
                <div
                  onClick={() => {
                    if (e.status === "available") {
                      onselect(e);
                    }
                  }}
                  className="flex flex-1 items-center gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 text-[12px] uppercase w-8 bg-slate-200 flex items-center justify-center text-slate-500 rounded-full",
                        {
                          "bg-blue-500 text-white": e.status === "available",
                          "bg-slate-500 text-white": e.status === "unavailable",
                          "bg-red-500 text-white": e.status === "reserved",
                          "bg-orange-500 text-white": e.status === "occupied",
                        }
                      )}
                    >
                      {e.code}
                    </div>
                    <div className="space-y-[2px]">
                      <h4 className="text-[12.5px] text-slate-600 font-medium">
                        {e.name}
                      </h4>
                      <div className="text-[12px] flex items-center gap-3 font-medium text-slate-500">
                        <span>{e.seats} People seats</span>
                      </div>
                    </div>
                  </div>
                </div>
                {isSelected ? (
                  <div>
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        disabled
                        onClick={() => e.stopPropagation()}
                        size="sm"
                        className="px-1"
                        variant="ghost"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {/* <DropdownMenuItem onClick={() => settableToDelete(e)}>
                        <PencilRuler size={16} className="mr-2" />
                        <span>Delete Table</span>
                      </DropdownMenuItem> */}
                      {/* <DropdownMenuItem onClick={() => settableToUpdate(e)}>
                        <Trash2Icon size={16} className="mr-2" />
                        <span>Update Table</span>
                      </DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function DeleteTableAlert({ open, setOpen, table, onDeleteFinish }: any) {
  const [deleting, setdeleting] = useState(false);

  const handleDelete = () => {
    setdeleting(true);
    return pocketbase
      .collection("tables")
      .delete(table.id)
      .then(() => {
        toast.success("Tables updated succesfully");
        setdeleting(false);
        onDeleteFinish(false);
      })
      .catch(() => {
        toast.error("Tables failed to delete");
        setdeleting(false);
      });
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your the
            table and remove it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            disabled={deleting}
            size="sm"
            variant="destructive"
            onClick={handleDelete}
          >
            {deleting && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            Yes, Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActionBar({
  selected,
  setselected,
  editMode,
  tableEditState,
  updatingTables,
  setshowNewOrderModal,
  updateTables,
}) {
  const { current, setShowClockinModal } = useworkShift();

  return (
    <div className="absolute z-30 px-3 bottom-0  sm:px-3 w-full py-0 sm:py-3">
      <div className="flex shadow-xl justify-between py-3  px-3 rounded-[3px] border border-slate-200 items-center bg-white w-full ">
        <div className="flex items-center gap-5">
          <div className="flex items-center">
            <div>
              <div className="h-10 w-10 border border-slate-300 bg-slate-200 flex items-center justify-center text-slate-500 rounded-full">
                <MdOutlineTableRestaurant size={20} />
              </div>
            </div>

            <div className="space-y-[1px] ml-3 ">
              <h4 className="text-[13.5px] font-semibold">Tables</h4>
              <p className="text-[13px] text-slate-500 font-medium">
                {selected ? selected?.code : "Choose a table."}
              </p>
            </div>
          </div>
          {selected ? (
            <div className="h-[30px] hidden sm:flex w-[1px] bg-slate-300"></div>
          ) : null}
          {selected && (
            <div className=" hidden @[540px]:flex items-center gap-2">
              <div className="border text-blue-500 hover:bg-slate-50 cursor-pointer relative font-medium text-sm border-slate-200 rounded-[4px] flex justify-center items-center h-10 w-10">
                {selected?.code}
                <a
                  onClick={() => setselected(undefined)}
                  className="bg-black absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white h-4 w-4"
                >
                  <X size={12} />
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="ml-2">
          {!editMode ? (
            <Button
              onClick={() => {
                if (current) {
                  setshowNewOrderModal(true);
                } else {
                  setShowClockinModal(true);
                }
              }}
              disabled={!selected}
              size="sm"
            >
              <FiShoppingBag className="mr-3" />
              <span>Place Order</span>
            </Button>
          ) : (
            <Button onClick={() => updateTables(tableEditState)} size="sm">
              {updatingTables ? (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              ) : (
                <CheckCircle size={16} className="mr-3" />
              )}
              <span>Save Layout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
