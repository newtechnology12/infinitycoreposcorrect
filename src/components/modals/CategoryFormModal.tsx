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
import AppFormField from "../forms/AppFormField";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormTextArea from "../forms/AppFormTextArea";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";

const formSchema = z.object({
  name: z.string().min(1, { message: "Names is a required field" }),
  description: z.string(),
  parent: z.string(),
  destinations: z.array(z.string()),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    description: data?.description || "",
    parent: data?.parent || "",
    destinations: data?.destinations || [],
  };
};

export function CategoryFormModal({
  open,
  setOpen,
  category,
  onComplete,
}: any) {
  const values = useMemo(() => getDefaultValues(category), [category]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [category]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      name: values?.name,
      description: values?.description,
      parent: values?.parent,
      destinations: values?.destinations,
    };

    const q = !category
      ? pocketbase.collection("categories").create(data)
      : pocketbase.collection("categories").update(category.id, data);

    return q
      .then(() => {
        onComplete();
        toast.error(
          q ? "Category updated succesfully" : "Category created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {category ? "Update" : "Create a new"} category
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {category ? "Update" : "Create a new"}
              category.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-1">
                <AppFormField
                  form={form}
                  label={"Category name"}
                  placeholder={"Enter category name"}
                  name={"name"}
                />
              </div>
              <div className="grid gap-1">
                <AppFormTextArea
                  form={form}
                  label={"Enter description"}
                  placeholder={"Enter description"}
                  name={"description"}
                />
              </div>
              <div className="grid gap-2 grid-cols-1">
                <AppFormAsyncSelect
                  form={form}
                  label={"Choose Parent"}
                  placeholder={"Choose Parent"}
                  name={"parent"}
                  loader={({ search }) => {
                    return pocketbase
                      .collection("categories")
                      .getList(0, 5, {
                        filter: search ? `name~"${search}"` : "",
                        perPage: 5,
                      })
                      .then((e) =>
                        e.items.map((e) => ({
                          label: e.names || e.name,
                          value: e.id,
                        }))
                      );
                  }}
                />
              </div>
              <div className="grid gap-2 grid-cols-1">
                <AppFormAsyncSelect
                  form={form}
                  label={"Choose Destinations"}
                  placeholder={"Choose Destinations"}
                  name={"destinations"}
                  isMulti
                  loader={({ search }) => {
                    return pocketbase
                      .collection("order_stations")
                      .getList(0, 5, {
                        filter: search ? `name~"${search}"` : "",
                        perPage: 5,
                      })
                      .then((e) =>
                        e.items.map((e) => ({
                          label: e.names || e.name,
                          value: e.id,
                        }))
                      );
                  }}
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
                  {category ? "Update category." : " Create new category"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
