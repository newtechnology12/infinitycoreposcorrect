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
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import { Alert, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";

const formSchema = z.object({
  item: z.string().min(1, { message: "Item is a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    item: data?.item,
  };
};

export function StockItemFormModal({
  open,
  setOpen,
  record,
  onComplete,
  hardValues,
  stock,
}: any) {
  const values = useMemo(
    () => ({
      ...getDefaultValues(record),
      item: hardValues?.item?.id,
    }),
    [record]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  const [error, setError] = useState("");

  async function onSubmit({ ...values }: z.infer<typeof formSchema>) {
    setError("");
    const data = {
      ...values,
    };

    // check if stock item with the same stock and item exists
    const record = await pocketbase
      .collection("stock_items")
      .getList(0, 1, {
        filter: `stock="${stock}" && (item="${values.item}")`,
      })
      .then((e) => e.items[0]);

    if (record && !record) {
      return setError("Stock item with the same item and stock exists");
    }

    const q = !record
      ? pocketbase.collection("stock_items").create({ ...data, stock })
      : pocketbase.collection("stock_items").update(record.id, data);

    return q
      .then(async (e) => {
        onComplete();
        toast.error(
          q ? "Stocks updated succesfully" : "Stocks created succesfully"
        );
        form.reset();
        setError("");
      })
      .catch((e) => {
        toast.error(e.message);
        setError(e.message);
      });
  }

  function itemsLoader({ search }) {
    return pocketbase
      .collection("raw_items")
      .getFullList({
        filter: search ? `name~"${search}" || menu.name~"${search}"` : "",
        expand: "menu",
      })
      .then((e) =>
        e.map((e) => ({ label: e?.expand?.menu?.name || e.name, value: e.id }))
      );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {record ? "Update" : "Create a new"}stock Item.
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {record ? "Update" : "Create a new"}stock
                Item.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={() => form.handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-2 px-2">
                  <Alert
                    variant="destructive"
                    className="py-2 rounded-[4px] flex items-center"
                  >
                    <AlertCircleIcon className="h-4 -mt-[5px] mr-3 w-4" />
                    <AlertTitle className="text-[13.5px] font-medium fon !m-0">
                      {error}
                    </AlertTitle>
                  </Alert>
                </div>
              )}
              <div className="grid px-2 gap-2">
                <div className="grid gap-2 grid-cols-1">
                  <AppFormAsyncSelect
                    form={form}
                    name={"item"}
                    label={`Choose item`}
                    placeholder={`Choose item`}
                    loader={itemsLoader}
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
                    type="button"
                    onClick={() => {
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={
                      form.formState.disabled || form.formState.isSubmitting
                    }
                    className="w-full"
                    size="sm"
                  >
                    {form.formState.isSubmitting && (
                      <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                    )}
                    {record ? "Update item." : " Create new item"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
