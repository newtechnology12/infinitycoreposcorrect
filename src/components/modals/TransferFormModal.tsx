import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import Loader from "../icons/Loader";
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormTextArea from "../forms/AppFormTextArea";
import { useAuth } from "@/context/auth.context";
import { cn } from "@/utils";
import { PlusCircle, Trash2 } from "lucide-react";
import useModalState from "@/hooks/useModalState";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import { processTransferItems } from "@/helpers/tranfers";
import { StockItemsModal } from "./StockItemsModal";

const formSchema = z.object({
  source: z.string().min(1, { message: "Source is a required field" }),
  notes: z.string(),
  destination: z
    .string()
    .min(1, { message: "Destination is a required field" }),
  items: z.any(),
});

const getDefaultValues = (data?: any) => {
  return {
    source: data?.source || "",
    notes: data?.notes || "",
    destination: data?.destination || "",
    items: data?.expand?.items || [],
  };
};

export function TranferFormModal({ open, setOpen, record, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  console.log(record);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  const { user } = useAuth();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const items = values.items.filter((e) => !e.isDeleted);

    const q = !record
      ? pocketbase
          .collection("transfers")
          .create({ created_by: user.id, ...data })
      : pocketbase.collection("transfers").update(record.id, data);

    return q
      .then(async (transfer) => {
        return await processTransferItems(items, transfer, values, user).then(
          () => {
            onComplete();
            toast.error(
              q
                ? "transfer updated succesfully"
                : "transfer created succesfully"
            );
            form.reset();
          }
        );
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function stocksLoader({ search }) {
    return pocketbase
      .collection("stocks")
      .getFullList({
        filter: [search ? `name~"${search}"` : ""].filter((e) => e).join("&&"),
      })
      .then((e) => e.map((e) => ({ label: e.name || e.name, value: e.id })));
  }

  const items = form.watch("items", []);

  const source = useWatch({
    control: form.control,
    name: "source",
  });

  const stockItemsModal = useModalState();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {record ? "Update" : "Create a new"} transfer
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {record ? "Update" : "Create a new"}
                transfer.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid px-2 gap-2">
                <div className="grid-cols-2 grid gap-3">
                  <AppFormAsyncSelect
                    form={form}
                    name={"source"}
                    label={"Choose source"}
                    placeholder={"Choose source"}
                    isDisabled={record}
                    defaultOptions={[
                      {
                        label: record?.expand["source"]?.name,
                        value: record?.expand["source"]?.id,
                      },
                    ]}
                    loader={stocksLoader}
                  />
                  <AppFormAsyncSelect
                    form={form}
                    name={"destination"}
                    label={"Choose destination"}
                    placeholder={"Choose destination"}
                    isDisabled={record}
                    defaultOptions={[
                      {
                        label: record?.expand["destination"]?.name,
                        value: record?.expand["destination"]?.id,
                      },
                    ]}
                    loader={stocksLoader}
                  />
                </div>
                <div>
                  <AppFormTextArea
                    form={form}
                    label={"Transfer Notes"}
                    placeholder={"Enter Transfer notes"}
                    name={"notes"}
                  />
                </div>
              </div>
              <div>
                {items.filter((e) => !e.isDeleted).length ? (
                  <div
                    className={cn("px-2", {
                      "opacity-60 pointer-events-none": record,
                    })}
                  >
                    <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-[13px] px-3 py-2 border-b text-left font-medium">
                              Name
                            </th>

                            <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                              Quantity Remaining
                            </th>

                            <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                              Quantity
                            </th>

                            <th className="text-[13px] py-2  px-3 border-b  text-right font-medium">
                              Action
                            </th>
                          </tr>
                        </thead>
                        {items
                          .filter((e) => !e.isDeleted)
                          .map((e, index) => {
                            console.log(e);
                            return (
                              <tr className="text-[13px] text-slate-600">
                                <td className="py-2 px-3 ">
                                  {e?.item?.expand?.item?.name ||
                                    e?.expand?.item?.name ||
                                    e?.item?.expand?.item?.expand?.menu?.name}
                                </td>

                                {!record ? (
                                  <td className="py-2 px-3 ">
                                    {Number(
                                      e?.source_quantity || 0
                                    ).toLocaleString()}{" "}
                                    {e?.item?.expand?.item?.expand?.unit?.name}
                                  </td>
                                ) : null}

                                <td className="py-2  px-3 ">
                                  <div className="w-fit relative">
                                    <input
                                      type="type"
                                      className="px-3 py-1 border rounded-md"
                                      placeholder="Quantity"
                                      value={e?.quantity}
                                      onChange={(event) => {
                                        // check if the quantity is greater than the available quantity
                                        if (
                                          Number(event.target.value) >
                                          e?.item?.available_quantity
                                        ) {
                                          return;
                                        }

                                        form.setValue(
                                          "items",
                                          items.map((e, i) =>
                                            i === index
                                              ? {
                                                  ...e,
                                                  quantity: event.target.value,
                                                  source_quantity:
                                                    e?.item
                                                      ?.available_quantity -
                                                    Number(event.target.value),
                                                }
                                              : e
                                          )
                                        );
                                      }}
                                    />
                                    <span className="absolute capitalize right-3 top-1">
                                      {
                                        e?.item?.expand?.item?.expand?.unit
                                          ?.name
                                      }
                                    </span>
                                  </div>
                                </td>

                                <td className="flex px-3 py-2 items-center justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      form.setValue(
                                        "items",
                                        items.map((e, i) =>
                                          i === index
                                            ? {
                                                ...e,
                                                isDeleted: true,
                                              }
                                            : e
                                        )
                                      );
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </table>
                    </div>
                  </div>
                ) : null}
                <div
                  className={cn("px-2  mt-4", {
                    "opacity-60 pointer-events-none": record,
                  })}
                >
                  <a
                    onClick={() => stockItemsModal.open()}
                    className={cn(
                      "border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3",
                      {
                        "opacity-60 pointer-events-none": !source,
                      }
                    )}
                  >
                    <PlusCircle size={16} />
                    <span>Add Item from stock</span>
                  </a>
                </div>
              </div>
              <DialogFooter>
                <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                  <Button
                    type="button"
                    onClick={() => form.reset()}
                    disabled={items.length === 0}
                    className="w-full text-slate-600"
                    size="sm"
                    variant="outline"
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => form.handleSubmit(onSubmit)}
                    disabled={
                      form.formState.disabled || form.formState.isSubmitting
                    }
                    className="w-full"
                    size="sm"
                  >
                    {form.formState.isSubmitting && (
                      <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                    )}
                    {record ? "Update transfer." : " Create new transfer"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <StockItemsModal
        stock={source}
        open={stockItemsModal.isOpen}
        setOpen={stockItemsModal.setisOpen}
        onSelect={(e) => {
          stockItemsModal.setisOpen(false);
          form.setValue("items", [
            ...items,
            ...e.map((item) => {
              return {
                quantity: 1,
                source_quantity: item?.available_quantity,
                item: item,
              };
            }),
          ]);
        }}
      />
    </>
  );
}
