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
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import AppFormSelect from "../forms/AppFormSelect";
import AppFormField from "../forms/AppFormField";
import { useQuery } from "react-query";

const formSchema = z.object({
  stock: z.string().min(1, { message: "Stock is a required field" }),
  reason: z.string().min(1, { message: "Reason is a required field" }),
  stock_item: z.string().min(1, { message: "Stock item is a required field" }),
  notes: z.string(),
  quantity_after: z
    .string()
    .min(1, { message: "Quantity left item is a required field" }),
  quantity_adjusted: z
    .string()
    .min(1, { message: "Quantity adjusted is a required field" }),
  type: z.string().min(1, { message: "type is a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    stock: data?.stock || "",
    reason: data?.reason || "",
    stock_item: data?.stock_item || "",
    notes: data?.notes || "",
    quantity_adjusted: data?.quantity_adjusted?.toString() || "",
    quantity_after: data?.quantity_after?.toString() || "",
    type: data?.type || "",
  };
};

export function AdjustmentFormModal({
  open,
  setOpen,
  record,
  onComplete,
}: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

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
      quantity_before: selectedItemQuery?.data?.available_quantity,
    };

    const q = !record
      ? pocketbase
          .collection("adjustments")
          .create({ created_by: user.id, ...data })
      : pocketbase.collection("adjustments").update(record.id, data);

    return q
      .then(async () => {
        return await pocketbase
          .collection("stock_items")
          .update(values.stock_item, {
            available_quantity: values.quantity_after,
          })
          .then((e) => {
            onComplete();
            toast.error(
              q
                ? "adjustment updated succesfully"
                : "adjustment created succesfully"
            );
            form.reset();
          });
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function stocksLoader({ search }) {
    return pocketbase
      .collection("stocks")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.name || e.name, value: e.id })));
  }

  function stockItemsLoader({ search }) {
    return pocketbase
      .collection("stock_items")
      .getFullList({
        filter: [
          search
            ? `menu_item.name~"${search}" || ingredient.name~"${search}"`
            : null,
          `stock="${form.getValues("stock")}"`,
        ]
          .filter((e) => e)
          .join(" && "),
        expand: "menu_item,ingredient",
      })
      .then((e) =>
        e.map((e) => ({
          label: e.expand.menu_item?.name || e.expand.ingredient?.name,
          value: e.id,
        }))
      );
  }

  const data = useWatch({
    control: form.control,
    name: ["stock_item", "quantity_adjusted", "type"],
  });

  const fetchItem = async (e) => {
    const stock_item = e.queryKey[1];
    const item = await pocketbase.collection("stock_items").getOne(stock_item);
    return item;
  };

  const selectedItemQuery = useQuery({
    queryKey: ["stock-item", data[0]],
    queryFn: fetchItem,
    enabled: Boolean(data[0]),
  });

  const available_quantity = selectedItemQuery?.data?.available_quantity || 0;
  useEffect(() => {
    // if (available_quantity) {
    const new_quantity =
      data[2] === "addition"
        ? available_quantity + Number(data[1])
        : available_quantity - Number(data[1]);
    form.setValue("quantity_after", new_quantity.toString());
    // } else {
    //   form.setValue("quantity_after", "");
    // }
  }, [available_quantity, data[1]]);

  console.log(record);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"}Adjustment
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}
              Adjustment.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid-cols-2 grid gap-3">
                <AppFormAsyncSelect
                  form={form}
                  name={"stock"}
                  label={"Choose stock"}
                  placeholder={"Choose stock"}
                  isDisabled={record}
                  defaultOptions={[
                    {
                      label: record?.expand["stock"]?.name,
                      value: record?.expand["stock"]?.id,
                    },
                  ]}
                  loader={stocksLoader}
                />
                <AppFormSelect
                  form={form}
                  label={"Reason"}
                  placeholder={"Choose reason"}
                  name={"reason"}
                  options={[
                    { label: "Count", value: "count" },
                    { label: "Recieved", value: "recieved" },
                    { label: "Transfer", value: "transfer" },
                    { label: "Return stock", value: "return stock" },
                    { label: "Damaged", value: "damaged" },
                    { label: "Theft or loss", value: "theft or loss" },
                    {
                      label: "Promotion or donation",
                      value: "promotion or donation",
                    },
                  ]}
                />
              </div>

              <div>
                <AppFormAsyncSelect
                  isDisabled={record || !form.getValues("stock")}
                  form={form}
                  name={"stock_item"}
                  label={"Choose stock item"}
                  placeholder={"Choose stock item"}
                  defaultOptions={[
                    {
                      label: record?.expand["stock_item"]?.name,
                      value: record?.expand["stock_item"]?.id,
                    },
                  ]}
                  loader={stockItemsLoader}
                />
              </div>
              <div>
                <AppFormSelect
                  form={form}
                  label={"Adjustment Type"}
                  placeholder={"Choose adjustment type"}
                  disabled={record}
                  name={"type"}
                  options={[
                    { label: "Addition", value: "addition" },
                    { label: "Reduction", value: "reduction" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <AppFormField
                  form={form}
                  name={"quantity_adjusted"}
                  label={"Enter quantity adjusted"}
                  placeholder={"Quantity adjusted"}
                  disabled={record}
                  type="number"
                />
                <AppFormField
                  form={form}
                  disabled={true}
                  name={"quantity_after"}
                  label={"Quantity after adjustment"}
                  placeholder={"Quantity after"}
                  type="number"
                />
              </div>

              <div>
                <AppFormTextArea
                  form={form}
                  label={"Adjustment Notes"}
                  placeholder={"Enter adjustment notes"}
                  name={"notes"}
                />
              </div>
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
                  {record ? "Update adjustment." : " Create new adjustment"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
