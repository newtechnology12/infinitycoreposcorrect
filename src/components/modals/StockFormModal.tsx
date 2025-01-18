import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import Loader from "../icons/Loader";
import AppFormField from "../forms/AppFormField";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";

const formSchema = z.object({
  name: z.string().min(1, { message: "Names is a required field" }),
  location: z.string(),
  is_main: z.boolean(),
  users: z.array(z.string()).optional(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    location: data?.location || "",
    is_main: data?.is_main || false,
    users: data?.original?.users || [],
  };
};

export function StockFormModal({ open, setOpen, record, onComplete }: any) {
  console.log(record);

  const values = useMemo(() => getDefaultValues(record), [record]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !record
      ? pocketbase.collection("stocks").create(data)
      : pocketbase.collection("stocks").update(record.id, data);

    return q
      .then(async () => {
        onComplete();
        toast.error(
          q ? "Stocks updated succesfully" : "Stocks created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function usersLoader({ search }) {
    return pocketbase
      .collection("users")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"}stock
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}stock.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-1">
                <AppFormField
                  form={form}
                  label={"Stock name"}
                  placeholder={"Enter stock name"}
                  name={"name"}
                />
                <div>
                  <AppFormAsyncSelect
                    form={form}
                    label={"Choose users"}
                    name={"users"}
                    isMulti
                    placeholder={"Choose users"}
                    loader={usersLoader}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="is_main"
                  render={({ field }) => (
                    <FormItem className="flex flex-row mt-3 items-center justify-between rounded-[3px] border px-3 py-2">
                      <div className="space-y-[6px]">
                        <FormLabel className="text-[14px]">
                          Main stock
                        </FormLabel>
                        <FormDescription>
                          This is the main stock of the restorant.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
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
                  {record ? "Update stock." : " Create new stock"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
