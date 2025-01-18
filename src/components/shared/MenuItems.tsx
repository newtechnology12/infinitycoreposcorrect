import { AlertCircle } from "react-feather";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { cn } from "@/utils";
import { Skeleton } from "../ui/skeleton";

export default function MenuItems({
  menuItemsQuery,
  setmenuToShow,
  disabled,
}: any) {
  return (
    <>
      {menuItemsQuery.status === "success" &&
        menuItemsQuery?.data?.length === 0 && (
          <div className="flex px-4 text-center items-center py-24 justify-center gap-2 flex-col">
            <img className="h-20 w-20" src="/images/dish.png" alt="" />
            <h4 className="font-semibold dark:text-slate-100 mt-4">
              No Menu Items Found
            </h4>
            <div>
              <p className="text-[15px] whitespace-normal break-words max-w-sm leading-8 text-slate-500">
                The Food menu items you are looking are not available. Try again
                later or clear the filters.
              </p>
            </div>
          </div>
        )}
      {menuItemsQuery.status === "error" && (
        <div className="px-3 py-3">
          <Alert variant="destructive" className="bg-white dark:bg-slate-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="mt-2">
              {menuItemsQuery.error["message"] ||
                "Something went wront. Try again."}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {menuItemsQuery.status === "loading" && (
        <>
          <div
            className={cn(
              "px-[6px] py-[6px]- h-full @[1300px]:grid-cols-7 @[1100px]:grid-cols-6 @[800px]:grid-cols-5 @[650px]:grid-cols-4 @[450px]:grid-cols-3- gap-[8px] grid grid-cols-2"
            )}
          >
            {Array(25)
              .fill(null)
              .map((_, i) => {
                return (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-700 bg-opacity-50 p-[6px] rounded-[3px]"
                  >
                    <Skeleton className="w-full h-[120px] rounded-[3px]" />
                    <div className="mt-2 flex items-center justify-between">
                      <Skeleton className="w-[60%] h-[20px] rounded-[4px]" />
                      <Skeleton className="w-[35%] h-[18px] rounded-[4px]" />
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
      {menuItemsQuery.status === "success" && (
        <>
          {menuItemsQuery?.data?.length ? (
            <div
              className={cn(
                "px-1 py-[6px] h-full @[1300px]:grid-cols-7 @[1100px]:grid-cols-6 @[800px]:grid-cols-5 @[650px]:grid-cols-4 @[450px]:grid-cols-3 gap-[6px] grid grid-cols-2"
              )}
            >
              <>
                {menuItemsQuery?.data
                  ?.sort((a, b) => a.name + b.name)
                  .map((e: any, i) => {
                    const varintsPrice = e?.variants
                      ?.map((e) => Number(e.price).toLocaleString() + " FRW")
                      .join(" - ");

                    const price = e?.variants?.length
                      ? varintsPrice
                      : (Number(e?.price) || 0).toLocaleString() + " FRW";

                    console.log(disabled);

                    return (
                      <div
                        key={i}
                        onClick={() => !disabled && setmenuToShow(e)}
                        className={cn(
                          "flex p-1 group cursor-pointer h-full hover:bg-slate-50  flex-col py-1- border dark:border-slate-600 border-slate-200 rounded-[5px] px-1- w-full dark:bg-slate-800 bg-white gap-1",
                          {
                            "opacity-50 pointer-events-none": disabled,
                          }
                        )}
                      >
                        <div className="flex py-1 pb-[6px] px-2  justify-between items-center">
                          <div className="space-y-2 w-full">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[13px] text-wrap dark:text-slate-100 capitalize truncate font-semibold">
                                {e.name}
                              </h4>
                            </div>
                            <div className="flex items-center justify-between w-full">
                              <p className="text-primary flex-wrap text-wrap text-[12.5px] font-medium">
                                {price}
                              </p>
                              <span>
                                {e.availability === "unavailable" && (
                                  <span className="text-[12px] mb-[2px] block font-medium text-red-500">
                                    Unavailable
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
