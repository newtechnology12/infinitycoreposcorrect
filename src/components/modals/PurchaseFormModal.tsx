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
import AppFormDatePicker from "../forms/AppFormDatepicker";
import AppFormTextArea from "../forms/AppFormTextArea";
import { useAuth } from "@/context/auth.context";
import { PlusCircle, Trash2 } from "react-feather";
import useModalState from "@/hooks/useModalState";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import { cn } from "@/utils";
import { RawItemsModal } from "./RawItemsModal";

const itemSchema = z.object({
  item: z.any(),
  quantity: z.any(),
  unit_price: z.any(),
  id: z.any(),
  isDeleted: z.any(),
  stock_item: z.any(),
  stock: z.any(),
});

const formSchema = z.object({
  supplier: z.string().min(1, { message: "Supplier is a required field" }),
  date: z.date(),
  stock: z.string().min(1, { message: "Stock is a required field" }),
  notes: z.string().min(1, { message: "Notes is a required field" }),
  items: z.array(itemSchema),
});

const getDefaultValues = (data?: any) => {
  return {
    supplier: data?.supplier || "",
    date: data?.date ? new Date(data?.date) : new Date(),
    stock: data?.stock || "",
    notes: data?.notes || "",
    items:
      data?.expand?.items?.map((e) => {
        return {
          id: e.id,
          unit_price: e.unit_price,
          quantity: e.quantity,
          stock_item: e.stock_item,
          stock: e.stock,
          item: {
            type: e.ingredient ? "ingredient" : e?.menu_item ? "menu_item" : "",
            id: e.ingredient || e?.menu_item,
            name: e.expand?.ingredient?.name || e.expand?.menu_item?.name,
            unit: e.expand?.ingredient?.unit,
          },
        };
      }) || [],
  };
};

export function PurchaseFormModal({ open, setOpen, record, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record, open]);

  const { user } = useAuth();

  async function onSubmit({ items, ...values }: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !record
      ? pocketbase.collection("purchases").create({
          created_by: user.id,
          payment_status: "unpaid",
          status: "pending",
          ...data,
        })
      : pocketbase.collection("purchases").update(record.id, data);

    return q
      .then(async (purchase) => {
        const newItems = await Promise.all(
          record?.status === "recieved"
            ? []
            : items.map((e) => {
                const q = e.id
                  ? e.isDeleted
                    ? pocketbase
                        .autoCancellation(false)
                        .collection("purchase_items")
                        .delete(e.id)
                    : pocketbase
                        .autoCancellation(false)
                        .collection("purchase_items")
                        .update(e.id, {
                          ...e,
                          purchase: purchase.id,
                          ingredient:
                            e.item.type === "ingredient" ? e.item.id : "",
                          menu_item:
                            e.item.type === "menu_item" ? e.item.id : "",
                          sub_total: e.unit_price * e.quantity,
                        })
                  : pocketbase
                      .autoCancellation(false)
                      .collection("purchase_items")
                      .create({
                        ...e,
                        purchase: purchase.id,
                        stock_item: e?.stock_item,
                        stock: e?.stock,
                        ingredient:
                          e.item.type === "ingredient" ? e.item.id : "",
                        menu_item: e.item.type === "menu_item" ? e.item.id : "",
                        sub_total: e.unit_price * e.quantity,
                      });

                return q;
              })
        );

        return pocketbase
          .collection("purchases")
          .update(
            purchase.id,
            record?.status === "recieved"
              ? {}
              : {
                  items: newItems.map((e: any) => e.id).filter((e) => e),
                  total: items
                    .filter((e) => !e.isDeleted)
                    .reduce((a, b) => a + Number(b.quantity * b.unit_price), 0),
                }
          )
          .then(() => {
            onComplete();
            toast.error(
              q
                ? "purchase updated succesfully"
                : "purchase created succesfully"
            );
            form.reset();
          });
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function supplierLoader() {
    return pocketbase
      .collection("suppliers")
      .getFullList({
        // filter: `name~"${inputValue}"`,
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function stocksLoader() {
    return pocketbase
      .collection("stocks")
      .getFullList({
        // filter: `name~"${inputValue}"`,
      })
      .then((e) => e.map((e) => ({ label: e.name || e.name, value: e.id })));
  }

  const stockItemsModal = useModalState();

  const items = useWatch({
    control: form.control,
    name: "items",
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {record ? "Update" : "Create a new"}purchase
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {record ? "Update" : "Create a new"}
                purchase.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid px-2 gap-2">
                <div className="grid gap-2 grid-cols-2">
                  <AppFormAsyncSelect
                    form={form}
                    name={"supplier"}
                    label={"Choose supplier"}
                    isDisabled={record?.status === "recieved"}
                    placeholder={"Choose supplier"}
                    defaultOptions={[
                      {
                        label: record?.expand[record.supplier]?.names,
                        value: record?.expand[record.supplier]?.id,
                      },
                    ]}
                    loader={supplierLoader}
                  />
                  <AppFormDatePicker
                    form={form}
                    label={"Purchase Date"}
                    placeholder={"Enter Purchase Date"}
                    name={"date"}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <AppFormAsyncSelect
                    form={form}
                    name={"stock"}
                    label={"Choose stock"}
                    placeholder={"Choose stock"}
                    isDisabled={record?.status === "recieved"}
                    defaultOptions={[
                      {
                        label: record?.expand[record.stock]?.name,
                        value: record?.expand[record.stock]?.id,
                      },
                    ]}
                    loader={stocksLoader}
                  />
                </div>
                <div>
                  <AppFormTextArea
                    form={form}
                    label={"Purchase Notes"}
                    placeholder={"Enter Purchase notes"}
                    name={"notes"}
                  />
                </div>
              </div>
              {items.filter((e) => !e.isDeleted).length ? (
                <div
                  className={cn("px-2", {
                    "opacity-60 pointer-events-none":
                      record?.status === "recieved",
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
                            Unit price
                          </th>
                          <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                            Quantity
                          </th>
                          <th className="text-[13px] py-2  px-3 border-b  text-left font-medium">
                            Subtotal
                          </th>
                          <th className="text-[13px] py-2  px-3 border-b  text-right font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>
                      {items
                        .filter((e) => !e.isDeleted)
                        .map((e, index) => {
                          return (
                            <tr className="text-[13px] text-slate-600">
                              <td className="py-2 px-3 ">{e.item.name}</td>
                              <td className="py-2 px-3 ">
                                {Number(e.unit_price).toLocaleString()} FRW
                              </td>
                              <td className="py-2  px-3 ">
                                <div className="w-fit relative">
                                  <input
                                    type="type"
                                    className="px-3 py-1"
                                    placeholder="Quantity"
                                    value={e?.quantity}
                                    onChange={(event) =>
                                      form.setValue(
                                        "items",
                                        items.map((e, i) =>
                                          i === index
                                            ? {
                                                ...e,
                                                quantity: event.target.value,
                                              }
                                            : e
                                        )
                                      )
                                    }
                                  />
                                  <span className="absolute capitalize right-3 top-1">
                                    {e.item.unit}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-3 ">
                                <div>
                                  {Number(
                                    e.quantity * e.unit_price
                                  ).toLocaleString()}{" "}
                                  FRW
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
                    <div className="border-t">
                      <div className="max-w-[250px] pt-2 ml-auto px-3">
                        <div className="flex pb-3 pt-0 sm:pt-1 items-center justify-between">
                          <h4 className="font-semibold text-slate-800 text-[12.5px]">
                            Total
                          </h4>
                          <span className="font-semibold text-slate-800 text-[12.5px]">
                            {items
                              .filter((e) => !e.isDeleted)
                              .reduce(
                                (a, b) =>
                                  a + Number(b.unit_price) * Number(b.quantity),
                                0
                              )
                              .toLocaleString()}
                            FRW
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div
                className={cn("px-2  mt-4", {
                  "opacity-60 pointer-events-none":
                    record?.status === "recieved",
                })}
              >
                <a
                  onClick={() => stockItemsModal.open()}
                  className="border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3"
                >
                  <PlusCircle size={16} />
                  <span>Add Item from stock</span>
                </a>
              </div>
              <DialogFooter>
                <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                  <Button
                    type="button"
                    onClick={() => form.reset()}
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
                    {record ? "Update purchase." : " Create new purchase"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <RawItemsModal
        open={stockItemsModal.isOpen}
        setOpen={stockItemsModal.setisOpen}
        stock={form.watch("stock")}
        onSelect={(e) => {
          stockItemsModal.setisOpen(false);
          form.setValue("items", [
            ...items,
            {
              unit_price:
                e.expand?.ingredient?.cost || e.expand?.ingredient?.price,
              quantity: 1,
              stock_item: e.id,
              stock: e.stock,
              item: {
                type: e.ingredient
                  ? "ingredient"
                  : e?.menu_item
                  ? "menu_item"
                  : "",
                id: e.ingredient || e?.menu_item,
                stock: e.stock,
                name: e.expand?.ingredient?.name || e.expand?.menu_item?.name,
                unit: e.expand?.ingredient?.unit,
              },
            },
          ]);
        }}
      />
    </>
  );
}
