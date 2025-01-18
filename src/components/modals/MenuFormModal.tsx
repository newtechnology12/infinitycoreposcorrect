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
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormTextArea from "../forms/AppFormTextArea";
import AppFormSelect from "../forms/AppFormSelect";
import { useQuery } from "react-query";
import { cn } from "@/utils";
import { PlusCircle, Trash2 } from "lucide-react";
import useModalState from "@/hooks/useModalState";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IngredientsModal } from "./IngredientsModal";
import { v4 as uuidv4 } from "uuid";

import { Checkbox } from "../ui/checkbox";
import Stocks from "../Stocks";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is a required field" }),
  category: z.string().min(1, { message: "Category is a required field" }),
  subCategory: z.string(),
  price: z.string().min(1, { message: "Price is a required field" }),
  availability: z
    .string()
    .min(1, { message: "Availability is a required field" }),
  description: z
    .string()
    .min(1, { message: "Description is a required field" }),
  ingredients: z.any(),
  supplier: z.string(),
  cost: z.string(),
  modifiers: z.any(),
  variants: z.any(),
  track_inventory: z.boolean(),
  stock_items: z.any(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    description: data?.description || "",
    subCategory: data?.subCategory || "",
    price: data?.price || "",
    cost: data?.cost || "",
    availability: data?.availability || "",
    category: data?.category || "",
    supplier: data?.supplier || "",
    track_inventory: data?.track_inventory || false,
    ingredients:
      data?.expand?.ingredients?.map((e) => ({
        id: e.id,
        ingredient: e.expand.ingredient,
        quantity: e.quantity,
      })) || [],
    modifiers: data?.modifiers || [],
    variants: data?.variants || [],
  };
};

export function MenuFormModal({ open, setOpen, menu, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(menu), [menu]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [menu]);

  console.log(menu);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      modifiers: values.modifiers
        .filter((e) => {
          return !e.isDeleted;
        })
        .map((e) => ({
          id: e.id,
          name: e.name,
          additional_price: Number(e.additional_price || 0),
        })),
      variants: values?.variants?.filter((e) => {
        return !e.isDeleted;
      }),
    };

    const q = !menu
      ? pocketbase.collection("menu_items").create(data)
      : pocketbase.collection("menu_items").update(menu.id, data);

    return q
      .then(async (menu) => {
        // create or update ingredients and if isdeleted is true delete it
        const ingredients = values.ingredients.filter((e) => !e.isDeleted);
        const promises = ingredients.map((e) => {
          const data = {
            quantity: e.quantity,
            menu_item: menu.id,
            stock_item: e.stock_item,
            ingredient: e.ingredient.id,
          };
          if (e.id && !e.isNew) {
            // if deleted delete it
            if (e.isDeleted) {
              return pocketbase
                .autoCancellation(false)
                .collection("menu_ingredients")
                .delete(e.id as string);
            } else {
              return pocketbase
                .autoCancellation(false)
                .collection("menu_ingredients")
                .update(e.id as string, data);
            }
          } else {
            return pocketbase
              .autoCancellation(false)
              .collection("menu_ingredients")
              .create(data);
          }
        });

        const items = await Promise.all(promises);

        // update menu ingredients_items
        const menuData = {
          ingredients: items.filter((e) => e?.id).map((e) => e?.id),
        };

        return pocketbase
          .autoCancellation(false)
          .collection("menu_items")
          .update(menu.id, menuData)
          .then(() => {
            onComplete();
            toast.error(
              q ? "Menu updated succesfully" : "Menu created succesfully"
            );
            form.reset();
          });
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    keepPreviousData: true,
    queryFn: () => {
      return pocketbase
        .collection("categories")
        .getFullList({ filter: `parent=''` })
        .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
    },
    enabled: Boolean(open),
  });

  const category = useWatch({
    control: form.control,
    name: "category",
  });

  const subCategoriesQuery = useQuery({
    queryKey: ["categories", category, "subCategories"],
    keepPreviousData: true,
    queryFn: () => {
      return pocketbase
        .collection("categories")
        .getFullList({ filter: `parent="${category}"` })
        .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
    },
    enabled: Boolean(open) && Boolean(category),
  });

  const ingredientsModal = useModalState();

  const ingredients = useWatch({
    control: form.control,
    name: "ingredients",
  });

  const modifiers = useWatch({
    control: form.control,
    name: "modifiers",
  });

  const track_inventory = useWatch({
    control: form.control,
    name: "track_inventory",
  });

  function supplierLoader({ search }) {
    return pocketbase
      .collection("suppliers")
      .getList(0, 5, {
        filter: search ? `name~"${search}"` : "",
        perPage: 5,
      })
      .then((e) =>
        e.items.map((e) => ({ label: e.names || e.name, value: e.id }))
      );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {menu ? "Update" : "Create a new"} Menu item
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {menu ? "Update" : "Create a new"}menu
                item.
              </span>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="px-1" onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="information" className="w-full">
                <TabsList className="w-full justify-around">
                  <TabsTrigger className="w-full" value="information">
                    Information
                  </TabsTrigger>
                  <TabsTrigger className="w-full" value="modifiers">
                    Modifiers
                  </TabsTrigger>

                  <TabsTrigger className="w-full" value="ingredients">
                    Ingredients
                  </TabsTrigger>
                  <TabsTrigger className="w-full" value="variants">
                    Variants
                  </TabsTrigger>
                  {menu && !ingredients?.length && (
                    <TabsTrigger className="w-full" value="stock">
                      Stock
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="information">
                  <div>
                    <div className="grid px-2 gap-2">
                      <div className="grid gap-2 grid-cols-3">
                        <AppFormField
                          form={form}
                          label={"Menu name"}
                          placeholder={"Enter menu name"}
                          name={"name"}
                        />
                        <AppFormField
                          form={form}
                          label={"Menu price"}
                          placeholder={"Enter menu price"}
                          name={"price"}
                          type="number"
                        />{" "}
                        <AppFormField
                          form={form}
                          label={"Menu cost"}
                          placeholder={"Enter menu cost"}
                          name={"cost"}
                          type="number"
                        />
                      </div>
                      <div className="grid gap-1">
                        <AppFormTextArea
                          form={form}
                          rows={3}
                          label={"Enter description"}
                          placeholder={"Enter description"}
                          name={"description"}
                        />
                      </div>
                      <div className="grid gap-2 grid-cols-2">
                        <AppFormSelect
                          form={form}
                          label={"Menu category"}
                          placeholder={"Enter menu category"}
                          name={"category"}
                          options={categoriesQuery?.data || []}
                        />
                        <AppFormSelect
                          form={form}
                          label={"Menu sub category"}
                          placeholder={"Enter menu sub category"}
                          name={"subCategory"}
                          disabled={!form.getValues().category}
                          options={subCategoriesQuery?.data || []}
                        />
                      </div>
                      <div>
                        <AppFormAsyncSelect
                          form={form}
                          name={"supplier"}
                          label={"Choose supplier"}
                          placeholder={"Choose supplier"}
                          defaultOptions={[
                            {
                              label: menu?.expand?.supplier?.names,
                              value: menu?.expand?.ingredient?.id,
                            },
                          ]}
                          loader={supplierLoader}
                        />
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <AppFormSelect
                          form={form}
                          label={"Menu availabilty"}
                          placeholder={"Enter menu availabilty"}
                          name={"availability"}
                          options={[
                            { label: "Available", value: "available" },
                            { label: "Unavailable", value: "unavailable" },
                          ]}
                        />
                        <div className="flex mt-2 items-center space-x-2">
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
                            Track inventory stock for this menu item.
                          </label>
                        </div>
                      </div>
                      <div></div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="ingredients">
                  <div>
                    <div>
                      {ingredients.length === 0 && (
                        <div>
                          <div className="flex py-6 items-center justify-center gap- flex-col text-center">
                            <img
                              className="w-16"
                              src="/images/grocery.png"
                              alt=""
                            />
                            <div className="space-y-3 max-w-xs mt-3">
                              <h4 className="text-[14px] font-semibold">
                                No Ingredients added yet.
                              </h4>
                              <p className="text-slate-500  leading-7 text-sm">
                                Add ingredients to the menu item, to keep track
                                of the cost and quantity.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {ingredients.filter((e) => !e.isDeleted).length ? (
                        <div className={cn("px-2")}>
                          <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
                            <table className="w-full h-[300px] overflow-auto">
                              <thead>
                                <tr>
                                  <th className="text-[13px] px-3 py-2 border-b text-left font-medium">
                                    Name
                                  </th>

                                  <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                                    Consuption Quantity
                                  </th>

                                  <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                                    Unit
                                  </th>

                                  <th className="text-[13px] py-2  px-3 border-b  text-right font-medium">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              {ingredients
                                .filter((e) => !e.isDeleted)
                                .map((e) => {
                                  return (
                                    <tr className="text-[13px] text-slate-600">
                                      <td className="py-2 px-3 ">
                                        {e?.ingredient.name}
                                      </td>

                                      <td className="py-2  px-3 ">
                                        <div className="w-fit relative">
                                          <input
                                            type="type"
                                            className="px-3 py-1"
                                            placeholder="Quantity"
                                            value={e?.quantity}
                                            onChange={(event) => {
                                              const newIngs = ingredients.map(
                                                (i) =>
                                                  i.id === e.id
                                                    ? {
                                                        ...i,
                                                        quantity:
                                                          event.target.value,
                                                      }
                                                    : i
                                              );

                                              form.setValue(
                                                "ingredients",
                                                newIngs
                                              );
                                            }}
                                          />
                                        </div>
                                      </td>

                                      <td className="py-2 capitalize px-3 ">
                                        {e?.ingredient?.expand?.unit?.name ||
                                          "-"}
                                      </td>

                                      <td className="flex px-3 py-2 items-center justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          type="button"
                                          onClick={() => {
                                            const newIngs = e.isNew
                                              ? ingredients.filter(
                                                  (i) => i.id !== e.id
                                                )
                                              : ingredients.map((i) =>
                                                  i.id === e.id
                                                    ? {
                                                        ...e,
                                                        isDeleted: true,
                                                      }
                                                    : e
                                                );
                                            form.setValue(
                                              "ingredients",
                                              newIngs
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
                    </div>
                    <div>
                      <div className={cn("px-2  mt-4")}>
                        <a
                          onClick={() => ingredientsModal.open()}
                          className={`border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3 ${0}`}
                        >
                          {/* !stock ? "!pointer-events-none !opacity-65" : "" */}
                          <PlusCircle size={16} />
                          <span>Add Ingredients</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="modifiers">
                  <Modifiers form={form} modifiers={modifiers} />
                </TabsContent>

                <TabsContent value="stock">
                  <Stocks menu={menu} />
                </TabsContent>

                <TabsContent value="variants">
                  <Variants form={form} variants={form.watch("variants")} />
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
                    {menu ? "Update menu." : " Create new menu"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <IngredientsModal
        open={ingredientsModal.isOpen}
        setOpen={ingredientsModal.setisOpen}
        onSelect={(e) => {
          ingredientsModal.setisOpen(false);
          form.setValue("ingredients", [
            ...(ingredients || []),
            {
              id: uuidv4(),
              ingredient: e,
              quantity: 1,
              isNew: true,
            },
          ]);
        }}
      />
    </>
  );
}

function Modifiers({ modifiers, form }) {
  return (
    <div>
      {modifiers.length === 0 && (
        <div className="flex py-6 items-center justify-center gap- flex-col text-center">
          <img className="w-20" src="/images/balanced-diet.png" alt="" />
          <div className="space-y-3 max-w-xs mt-3">
            <h4 className="text-[14px] font-semibold">
              No modifiers added yet.
            </h4>
            <p className="text-slate-500  leading-7 text-sm">
              Add modifiers to menu item, to allow customers to customize their
              orders.
            </p>
          </div>
        </div>
      )}
      {modifiers.length !== 0 && (
        <div className={cn("px-2-")}>
          <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[13px] bg-slate-50 px-3 py-2 border-b text-left font-medium">
                    Name
                  </th>

                  <th className="text-[13px] bg-slate-50  px-3 py-2 border-b   text-left font-medium">
                    Additional Price
                  </th>

                  <th className="text-[13px] bg-slate-50 py-2  px-3 border-b  text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              {modifiers.map((e, index) => {
                return (
                  <tr key={index} className="text-[13px] text-slate-600">
                    <td className="py-2 border-b px-3- ">
                      <input
                        type="text"
                        className="px-3 py-1"
                        placeholder="Modifier name"
                        value={e?.name}
                        onChange={(event) => {
                          const newIngs = modifiers.map((i) =>
                            i.id === e.id
                              ? {
                                  ...i,
                                  name: event.target.value,
                                }
                              : i
                          );
                          form.setValue("modifiers", newIngs);
                        }}
                      />
                    </td>

                    <td className="py-2 border-b px-3- ">
                      <input
                        type="number"
                        className="px-3 py-1"
                        placeholder="Additional price"
                        value={e?.additional_price}
                        onChange={(event) => {
                          const newIngs = modifiers.map((i) =>
                            i.id === e.id
                              ? {
                                  ...i,
                                  additional_price: event.target.value,
                                }
                              : i
                          );
                          form.setValue("modifiers", newIngs);
                        }}
                      />
                    </td>

                    <td className="flex border-b px-3 py-2 items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const newIngs = modifiers.filter(
                            (i) => i.id !== e.id
                          );
                          form.setValue("modifiers", newIngs);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <th className="text-[13px] px-3 py-2 text-left font-medium">
                  Total
                </th>
                <td className="text-[13px] px-3 py-2 text-left font-medium">
                  {modifiers
                    .filter((e) => !e.isDeleted)
                    .reduce((a, b) => {
                      return a + Number(b.additional_price);
                    }, 0)
                    .toLocaleString() + " FRW"}
                </td>
                <td></td>
              </tr>
            </table>
          </div>
        </div>
      )}

      <div>
        <div className={cn("px-2  mt-4")}>
          <a
            onClick={() => {
              form.setValue("modifiers", [
                ...(modifiers || []),
                {
                  id: uuidv4(),
                  name: "",
                  additional_price: 0,
                  isNew: true,
                },
              ]);
            }}
            className={`border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3 ${0}`}
          >
            <PlusCircle size={16} />
            <span>Add new Modifier</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function Variants({ variants, form }) {
  return (
    <div>
      {variants.length === 0 && (
        <div className="flex py-6 items-center justify-center gap- flex-col text-center">
          <img className="w-20" src="/images/variant.png" alt="" />
          <div className="space-y-3 max-w-xs mt-3">
            <h4 className="text-[14px] font-semibold">
              No variants added yet.
            </h4>
            <p className="text-slate-500  leading-7 text-sm">
              Add variants to menu item, to allow customers to customize their
              orders.
            </p>
          </div>
        </div>
      )}
      {variants.length !== 0 && (
        <div className={cn("px-2-")}>
          <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[13px] bg-slate-50 px-3 py-2 border-b text-left font-medium">
                    Name
                  </th>

                  <th className="text-[13px] bg-slate-50  px-3 py-2 border-b   text-left font-medium">
                    Price
                  </th>

                  <th className="text-[13px] bg-slate-50 py-2  px-3 border-b  text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              {variants.map((e, index) => {
                return (
                  <tr key={index} className="text-[13px] text-slate-600">
                    <td className="py-2 border-b px-3- ">
                      <input
                        type="text"
                        className="px-3 py-1"
                        placeholder="Modifier name"
                        value={e?.name}
                        onChange={(event) => {
                          const newIngs = variants.map((i) =>
                            i.id === e.id
                              ? {
                                  ...i,
                                  name: event.target.value,
                                }
                              : i
                          );
                          form.setValue("variants", newIngs);
                        }}
                      />
                    </td>

                    <td className="py-2 border-b px-3- ">
                      <input
                        type="number"
                        className="px-3 py-1"
                        placeholder="Price"
                        value={e?.price}
                        onChange={(event) => {
                          const newIngs = variants.map((i) =>
                            i.id === e.id
                              ? {
                                  ...i,
                                  price: event.target.value,
                                }
                              : i
                          );
                          form.setValue("variants", newIngs);
                        }}
                      />
                    </td>

                    <td className="flex border-b px-3 py-2 items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const newIngs = variants.filter((i) => i.id !== e.id);
                          form.setValue("variants", newIngs);
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
      )}

      <div>
        <div className={cn("px-2  mt-4")}>
          <a
            onClick={() => {
              form.setValue("variants", [
                ...(variants || []),
                {
                  id: uuidv4(),
                  name: "",
                  price: 0,
                  isNew: true,
                },
              ]);
            }}
            className={`border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3 ${0}`}
          >
            <PlusCircle size={16} />
            <span>Add new Variant</span>
          </a>
        </div>
      </div>
    </div>
  );
}
