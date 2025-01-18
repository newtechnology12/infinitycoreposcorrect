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
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Stocks from "../Stocks";
import { Checkbox } from "../ui/checkbox";
import pocketbase from "@/lib/pocketbase";

const formSchema = z.object({
  name: z.string(),
  unit: z.string(),
  menu: z.string(),
  supplier: z.string(),
  track_inventory: z.boolean(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    unit: data?.unit || "",
    menu: data?.menu || "",
    supplier: data?.supplier || "",
    track_inventory: data?.track_inventory || false,
  };
};

export function IngredientFormModal({
  open,
  setOpen,
  ingredient,
  onComplete,
}: any) {
  const values = useMemo(() => getDefaultValues(ingredient), [ingredient]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  const track_inventory = useWatch({
    control: form.control,
    name: "track_inventory",
  });

  useEffect(() => {
    form.reset();
  }, [ingredient]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !ingredient
      ? pocketbase.collection("raw_items").create(data)
      : pocketbase.collection("raw_items").update(ingredient.id, data);

    return q
      .then(() => {
        onComplete();
        toast.error(
          q
            ? "ingredient updated succesfully"
            : "ingredient created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function supplierLoader({ search }) {
    return pocketbase
      .collection("suppliers")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function measurementsLoader({ search }) {
    return pocketbase
      .collection("measurements")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }
  function menusLoader({ search }) {
    return pocketbase
      .collection("menu_items")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {ingredient ? "Update" : "Create a new"} raw item
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {ingredient ? "Update" : "Create a new"}
              raw item.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="px-1" onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="information" className="w-full">
              <TabsList className="w-full justify-around">
                <TabsTrigger className="w-full" value="information">
                  Raw item Information
                </TabsTrigger>
                {/* <TabsTrigger className="w-full" value="stock">
                  Stock
                </TabsTrigger> */}
              </TabsList>
              <TabsContent value="information">
                <div>
                  <div className="grid px-2 gap-2">
                    <div className="grid gap-2 grid-cols-2">
                      <AppFormField
                        form={form}
                        label={"Item name"}
                        placeholder={"Enter Item name"}
                        name={"name"}
                      />
                      <AppFormAsyncSelect
                        form={form}
                        label={"Choose menu"}
                        placeholder={"Choose menu"}
                        name={"menu"}
                        loader={menusLoader}
                      />
                    </div>
                    <div className="grid gap-2 grid-cols-1">
                      <AppFormAsyncSelect
                        form={form}
                        label={"Choose unit"}
                        placeholder={"Choose unit"}
                        name={"unit"}
                        loader={measurementsLoader}
                      />
                    </div>
                    <AppFormAsyncSelect
                      form={form}
                      name={"supplier"}
                      label={"Choose supplier"}
                      placeholder={"Choose supplier"}
                      defaultOptions={[
                        {
                          label: ingredient?.expand?.supplier?.names,
                          value: ingredient?.expand?.ingredient?.id,
                        },
                      ]}
                      loader={supplierLoader}
                    />
                  </div>
                  <div>
                    <div className="flex px-2 py-2 mt-2 items-center space-x-2">
                      <Checkbox
                        onCheckedChange={(e: boolean) => {
                          form.setValue("track_inventory", e);
                        }}
                        checked={track_inventory}
                        id="track_inventory"
                      />

                      <label
                        htmlFor="track_inventory"
                        className="text-sm text-slate-500 font-medium- leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Track inventory stock for ingredient.
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="stock">
                <Stocks ingredient={ingredient} />
              </TabsContent>
            </Tabs>
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
                  {ingredient
                    ? "Update Ingredient."
                    : " Create new Ingredients"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
