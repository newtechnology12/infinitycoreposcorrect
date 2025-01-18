import { useEffect, useMemo, useState } from "react";
import AppFormField from "@/components/forms/AppFormField";
import { Button } from "@/components/ui/button";
import Loader from "@/components/icons/Loader";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import useSettings from "@/hooks/useSettings";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useModalState from "@/hooks/useModalState";
import { PlusCircle, Trash, Upload } from "react-feather";
import { useQuery } from "react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth.context";
import AppFormTextArea from "@/components/forms/AppFormTextArea";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import useEditRow from "@/hooks/use-edit-row";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkImport } from "@/components/modals/BulkImport";
import AppFormAsyncSelect from "@/components/forms/AppFormAsyncSelect";
import AppFormSelect from "@/components/forms/AppFormSelect";
function FieldsSettings() {
  return (
    <div className="py-3 px-4 max-w-2xl-">
      <div className="dark:border-slate-700 grid grid-cols-2 gap-6 border-slate-300">
        <Activities />
        <BillsMetadata />
        <Measurements />
      </div>
    </div>
  );
}
export default FieldsSettings;

function Activities() {
  const recordsQuery = useQuery({
    queryKey: ["activities"],
    queryFn: () => {
      return pocketbase.collection("activities").getFullList();
    },
    enabled: true,
  });
  const newRecordModal = useModalState();

  const confirmModal = useConfirmModal();

  const editRow = useEditRow();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("activities")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("activity deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  return (
    <>
      {" "}
      <div className="dark:border-slate-700 mt-6- mb-2 border-slate-300">
        <div className="border-b- flex items-center justify-between dark:border-b-slate-700 border-slate-300 mb-0 pb-3 ">
          <div className="">
            <h4 className="font-semibold dark:text-slate-200 text-sm">
              Other Activities.
            </h4>
            <p className="text-[14px] leading-7 dark:text-slate-400 mt-1 text-slate-500">
              List of all other activities, that makes money to the company.
            </p>
          </div>
          <Button
            onClick={() => newRecordModal.open()}
            variant="outline"
            size="sm"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="text-[13px]">Add Activity</span>
          </Button>
        </div>
        <div className="mb-0 border">
          <Table className="table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] !h-10">Name</TableHead>
                <TableHead className="!h-10 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsQuery?.data?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium truncate">
                    {record.name}
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          editRow.edit(record);
                        }}
                        size="sm"
                        variant="default"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          confirmModal.open({ meta: record });
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {recordsQuery.status === "loading" && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <div className="flex items-center h-40 justify-center">
                      <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {recordsQuery.status === "error" && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <div className="flex items-center h-40 justify-center">
                      <span className="text-sm text-slate-500">
                        Failed to load Activities
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {recordsQuery.status === "success" &&
                recordsQuery?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="flex items-center h-40 justify-center">
                        <span className="text-sm text-slate-500 font-normal">
                          No Activities found
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </div>
      <ActivityFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />{" "}
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

function Measurements() {
  const recordsQuery = useQuery({
    queryKey: ["measurements"],
    queryFn: () => {
      return pocketbase.collection("measurements").getFullList({
        expand: "base_unit",
      });
    },
    enabled: true,
  });
  const newRecordModal = useModalState();

  const confirmModal = useConfirmModal();

  const editRow = useEditRow();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("measurements")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("activity deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const bulkImportModal = useModalState();

  const handleValidateBulkImport = async (rows) => {
    const errors = [];
    // Validation for each row
    for (let i = 0; i < rows.length; i++) {
      // handle logic validation here
    }
    return errors;
  };

  return (
    <>
      <div className="dark:border-slate-700 mt-6- mb-2 border-slate-300">
        <div className="border-b- flex items-center justify-between dark:border-b-slate-700 border-slate-300 mb-0 pb-3 ">
          <div className="">
            <h4 className="font-semibold dark:text-slate-200 text-sm">
              Measurements.
            </h4>
            <p className="text-[14px] leading-7 dark:text-slate-400 mt-1 text-slate-500">
              Measurements are used to measure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => newRecordModal.open()}
              variant="outline"
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              <span className="text-[13px]">Add New</span>
            </Button>
            <Button
              onClick={() => bulkImportModal.open()}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="text-[13px]">Bulk Import</span>
            </Button>
          </div>
        </div>
        <div className="mb-0 border">
          <Table className="table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] !h-10">Name</TableHead>
                <TableHead className="w-[100px]- !h-10">Base unit</TableHead>
                <TableHead className="w-[100px]- !h-10">Operation</TableHead>
                <TableHead className="!h-10 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsQuery?.data?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium capitalize truncate">
                    {record.name}
                  </TableCell>
                  <TableCell className="font-medium truncate">
                    {record?.expand?.base_unit?.name || "--"}
                  </TableCell>
                  <TableCell className="font-medium truncate">
                    {record.operator} {record.operator_value || "---"}
                  </TableCell>
                  <TableCell className="flex justify-end">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          editRow.edit(record);
                        }}
                        size="sm"
                        variant="default"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          confirmModal.open({ meta: record });
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {recordsQuery.status === "loading" && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <div className="flex items-center h-40 justify-center">
                      <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {recordsQuery.status === "error" && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <div className="flex items-center h-40 justify-center">
                      <span className="text-sm text-slate-500">
                        Failed to load Measurements.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {recordsQuery.status === "success" &&
                recordsQuery?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="flex items-center h-40 justify-center">
                        <span className="text-sm text-slate-500 font-normal">
                          No Measurements found
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </div>
      <BulkImport
        open={bulkImportModal.isOpen}
        setOpen={bulkImportModal.setisOpen}
        name="measurements"
        onComplete={() => {
          recordsQuery.refetch();
          bulkImportModal.close();
        }}
        sample={[
          {
            Id: "hrWaqGObEHyz6wW",
            Name: "KG",
          },
        ]}
        expectedColumns={["Id", "Name"]}
        parseEntity={(e) => {
          return {
            id: e["Id"],
            name: e["Name"],
          };
        }}
        validate={handleValidateBulkImport}
      />
      <MeasurementsFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />{" "}
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

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is a required field" }),
  description: z
    .string()
    .min(1, { message: "Desctiption is a required field" }),
  track_as_sale: z.boolean(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    description: data?.description || "",
    track_as_sale: data?.track_as_sale || true,
  };
};

export function ActivityFormModal({ open, setOpen, record, onComplete }: any) {
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
    };

    const q = !record
      ? pocketbase
          .collection("activities")
          .create({ ...data, created_by: user.id })
      : pocketbase.collection("activities").update(record.id, data);

    return q
      .then(async (e) => {
        onComplete();
        toast.error(
          q ? "Activity updated succesfully" : "Activity created succesfully"
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
              {record ? "Update" : " Create a new"} activity.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : " Create a new"}
              activity.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-1">
                <AppFormField
                  form={form}
                  label={"Activity name"}
                  placeholder={"Enter activity name"}
                  name={"name"}
                />
              </div>

              <div className="grid gap-2 grid-cols-1">
                <AppFormTextArea
                  form={form}
                  label={"Description"}
                  placeholder={"Enter description"}
                  name={"description"}
                />
              </div>
              <div className="grid gap-2 grid-cols-1">
                <div className="flex mt-2 items-center space-x-2">
                  <Checkbox
                    onCheckedChange={(e: boolean) => {
                      form.setValue("track_as_sale", e);
                    }}
                    checked={form.watch("track_as_sale")}
                    id="track_inventory"
                  />

                  <label
                    htmlFor="track_inventory"
                    className="text-sm text-slate-500 font-medium- leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Track activity as sale.
                  </label>
                </div>
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
                  {record ? "Update activity." : " Create new activity"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BillsMetadata() {
  const [metas, setMetas] = useState([]);

  const { settings, refetch } = useSettings();

  const [loading, setloading] = useState(false);

  useEffect(() => {
    if (settings?.bills_metadata) {
      setMetas(settings.bills_metadata);
    }
  }, [settings]);

  async function onSubmit() {
    setloading(true);
    try {
      await pocketbase
        .collection("settings")
        .update(settings.id, { bills_metadata: metas });

      refetch();
      setloading(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update settings");
      setloading(false);
    }
  }

  return (
    <div>
      <div className="border-b- flex items-center justify-between dark:border-b-slate-700 border-slate-300 mb-0 pb-3 ">
        <div className="">
          <h4 className="font-semibold dark:text-slate-200 text-sm">
            Bills Metadata
          </h4>
          <p className="text-[14px] leading-7 dark:text-slate-400 mt-1 text-slate-500">
            List of other meta data that are used in the system.
          </p>
        </div>
        <Button
          onClick={() => {
            setMetas([...metas, { key: "", value: "" }]);
          }}
          variant="outline"
          size="sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          <span className="text-[13px]">Add Metadata</span>
        </Button>
      </div>
      {!metas.length ? (
        <div className="flex items-center justify-center h-40">
          <span className="text-sm text-slate-500">No metadata found</span>
        </div>
      ) : null}

      {metas.map((meta, index) => {
        return (
          <div className="flex mt-3 items-center gap-3">
            <Input
              className="border-slate-300 dark:border-slate-700"
              placeholder="Enter key here"
              value={meta.key}
              onChange={(e) => {
                setMetas((prev) => {
                  const newMetas = [...prev];
                  newMetas[index].key = e.target.value;
                  return newMetas;
                });
              }}
            />
            <Input
              className="border-slate-300 dark:border-slate-700"
              placeholder="Enter Value here"
              value={meta.value}
              onChange={(e) => {
                setMetas((prev) => {
                  const newMetas = [...prev];
                  newMetas[index].value = e.target.value;
                  return newMetas;
                });
              }}
            />
            <a
              className="px-2 cursor-pointer"
              onClick={() => {
                setMetas((prev) => {
                  const newMetas = [...prev];
                  newMetas.splice(index, 1);
                  return newMetas;
                });
              }}
            >
              <Trash size={18} className="text-red-500" />
            </a>
          </div>
        );
      })}
      {metas.length ? (
        <div className="mt-4">
          <Button disabled={loading} onClick={onSubmit} size="sm">
            {loading && (
              <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
            )}
            <span>Save Metadatas</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function MeasurementsFormModal({
  open,
  setOpen,
  record,
  onComplete,
}: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  const formSchema = z.object({
    name: z.string().min(1, { message: "Name is a required field" }),
    base_unit: z.string().optional(),
    operator: z.string().optional(),
    operator_value: z.string().optional(),
  });

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

    const q = !record
      ? pocketbase
          .collection("measurements")
          .create({ ...data, created_by: user.id })
      : pocketbase.collection("measurements").update(record.id, data);

    return q
      .then(async (e) => {
        onComplete();
        toast.error(
          q
            ? "Measurement updated succesfully"
            : "Measurement created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function baseLoader({ search }) {
    return pocketbase
      .collection("measurements")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : " Create a new"} measured.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : " Create a new"}
              measured.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Measurements name"}
                  placeholder={"Enter measurements name"}
                  name={"name"}
                />
                <AppFormAsyncSelect
                  form={form}
                  label={"Base unit"}
                  placeholder={"Choose base unit"}
                  name={"base_unit"}
                  loader={baseLoader}
                />
              </div>
              <div className="space-y-2">
                <AppFormSelect
                  form={form}
                  label={"Operation"}
                  placeholder={"Choose operation"}
                  name={"operator"}
                  options={[
                    { label: "Multiply", value: "*" },
                    { label: "Divide", value: "/" },
                  ]}
                />
                <AppFormField
                  type="number"
                  form={form}
                  label={"Operation value"}
                  placeholder={"Enter operation value"}
                  name={"operator_value"}
                  options={[
                    { label: "Multiply", value: "*" },
                    { label: "Divide", value: "/" },
                  ]}
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
                  {record ? "Update Measurements." : " Create new Measurements"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
