import useEditRow from "@/hooks/use-edit-row";
import useConfirmModal from "@/hooks/useConfirmModal";
import useModalState from "@/hooks/useModalState";
import pocketbase from "@/lib/pocketbase";
import { useQuery } from "react-query";
import { toast } from "sonner";
import Loader from "./icons/Loader";
import { Button } from "./ui/button";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/utils";
import { StockItemFormModal } from "./modals/StockItemFormModal";
import ConfirmModal from "./modals/ConfirmModal";

function Stocks({ menu, ingredient }: any) {
  const { isLoading, data, status, refetch } = useQuery({
    queryKey: ["stock_items", menu?.id],
    keepPreviousData: true,
    queryFn: () => {
      return pocketbase.collection("stock_items").getFullList({
        filter: `menu_item="${menu?.id}" || ingredient="${ingredient?.id}"`,
        expand: "stock,ingredient.unit",
      });
    },
    enabled: Boolean(menu) || Boolean(ingredient),
  });

  const newRecordModal = useModalState();
  const editRow = useEditRow();

  const confirmModal = useConfirmModal();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("stock_items")
      .delete(e.id)
      .then(() => {
        refetch();
        confirmModal.close();
        toast.success("stock item deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  return (
    <>
      {" "}
      <div>
        {isLoading && (
          <div className="h-[250px] flex items-center justify-center w-full ">
            <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
          </div>
        )}
        {data?.length === 0 && status === "success" && (
          <div className="flex py-6 items-center justify-center gap- flex-col text-center">
            <img className="w-20" src="/images/packages.png" alt="" />
            <div className="space-y-3 max-w-xs mt-3">
              <h4 className="text-[14px] font-semibold">
                No Stock linked yet.
              </h4>
              <p className="text-slate-500  leading-7 text-sm">
                Link stock items to the item, to keep track of the quantity.
              </p>
            </div>
          </div>
        )}
        {data?.length ? (
          <div className={cn("px-2-")}>
            <div className="border border-b-0 px-3- rounded-[3px] mt-3 border-slate-200">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-[13px] bg-slate-50 px-3 py-2 border-b text-left font-medium">
                      Stock
                    </th>
                    <th className="text-[13px] bg-slate-50  px-3 py-2 border-b   text-left font-medium">
                      Available Quantity
                    </th>
                    <th className="text-[13px] bg-slate-50 py-2  px-3 border-b  text-left font-medium">
                      Quantity Alert
                    </th>
                    <th className="text-[13px] bg-slate-50 py-2  px-3 border-b  text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                {data?.map((e, index) => {
                  return (
                    <tr key={index} className="text-[13px] text-slate-600">
                      <td className="py-2 px-3 border-b px-3- ">
                        {e?.expand?.stock?.name}
                      </td>
                      <td className="py-2 px-3 border-b px-3- ">
                        {e?.available_quantity} {ingredient?.expand?.unit?.name}
                      </td>
                      <td className="py-2 px-3 border-b px-3- ">
                        {e?.quantity_alert} {ingredient?.expand?.unit?.name}
                      </td>
                      <td className="flex border-b px-3 py-2 items-center justify-end">
                        <Button
                          onClick={() => {
                            editRow.edit(e);
                          }}
                          variant="ghost"
                          size="sm"
                          type="button"
                        >
                          <Edit className="text-blue-500" size={16} />
                        </Button>
                        <Button
                          onClick={() => {
                            confirmModal.open({ meta: e });
                          }}
                          variant="ghost"
                          size="sm"
                          type="button"
                        >
                          <Trash2 className="text-red-500" size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </table>
            </div>
          </div>
        ) : null}

        <div>
          <div className={cn("px-2-  mt-4")}>
            <a
              onClick={() => newRecordModal.open()}
              className={`border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3 ${0}`}
            >
              <PlusCircle size={16} />
              <span>Link new stock</span>
            </a>
          </div>
        </div>
      </div>
      <StockItemFormModal
        hardValues={{
          item: menu ? menu : ingredient,
          type: menu?.id ? "menu" : "ingredient",
        }}
        onComplete={() => {
          refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        meta={confirmModal.meta}
        onConfirm={handleDelete}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />
    </>
  );
}

export default Stocks;
