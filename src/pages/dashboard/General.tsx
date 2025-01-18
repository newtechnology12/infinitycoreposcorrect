import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppFormField from "@/components/forms/AppFormField";
import { Button } from "@/components/ui/button";
import Loader from "@/components/icons/Loader";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import { useMemo } from "react";
import useSettings from "@/hooks/useSettings";
import { Switch } from "@/components/ui/switch";
import AppFileUpload from "@/components/forms/AppFileUpload";

function General() {
  return (
    <div>
      <div className="border-b- border-dashed pb-3">
        <CompanyInfo />
      </div>
    </div>
  );
}

function CompanyInfo() {
  const formSchema = z.object({
    company_name: z.string(),
    company_email: z.string().email(),
    company_phone: z.string(),
    company_address: z.string(),
    company_tin: z.string(),
    application_url: z.string(),
    logo: z.any(),
    white_logo: z.any(),
    login_background: z.any(),
    ticket_watermark: z.string(),
  });

  const { settings, refetch } = useSettings();

  const values = useMemo(
    () => ({
      company_name: settings?.company_name || "",
      company_email: settings?.company_email || "",
      company_phone: settings?.company_phone || "",
      company_address: settings?.company_address || "",
      company_tin: settings?.company_tin || "",
      application_url: settings?.application_url || "",
      logo: settings?.logo || "",
      white_logo: settings?.white_logo || "",
      login_background: settings?.login_background || "",
      ticket_watermark: settings?.ticket_watermark || "",
    }),
    [settings]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: values,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await pocketbase.collection("settings").update(settings.id, values);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to update settings");
    }
  }

  return (
    <div className="grid grid-cols-2- py-2 gap-3">
      <div className="border-r- border-dashed">
        <div className="px-3 py-2 text-[12.5px] text-slate-500 font-medium uppercase">
          <h4>Company information</h4>
        </div>
        <div>
          <div>
            <div className="max-w-2xl py-1 px-4">
              <div className="dark:border-slate-700 border-slate-300">
                <div className="mb-0">
                  <Form {...form}>
                    <form
                      className="space-y-2"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="!col-span-2">
                          <AppFormField
                            label="Company Name"
                            placeholder={"Company Name"}
                            name={"company_name"}
                            form={form}
                          />
                        </div>
                        <AppFormField
                          label="Company Email"
                          placeholder={"Company Email"}
                          name={"company_email"}
                          form={form}
                        />
                        <AppFormField
                          label="Company Phone"
                          placeholder={"Company Phone"}
                          name={"company_phone"}
                          form={form}
                        />
                        {/* <div className="col-span-2-s"> */}
                        <AppFormField
                          label="Company Address"
                          placeholder={"Company Address"}
                          name={"company_address"}
                          form={form}
                        />{" "}
                        <AppFormField
                          label="Company Tin"
                          placeholder={"Company Tin"}
                          name={"company_tin"}
                          form={form}
                        />
                        {/* </div> */}
                      </div>
                      <div>
                        <AppFormField
                          label="Application url"
                          placeholder={"Application url"}
                          name={"application_url"}
                          form={form}
                        />
                      </div>
                      <div>
                        <AppFormField
                          label="Ticket watermark"
                          placeholder={"Ticket watermark"}
                          name={"ticket_watermark"}
                          form={form}
                        />
                      </div>
                      <AppFileUpload
                        form={form}
                        label={"Upload Logo"}
                        name={"logo"}
                        preview={pocketbase.files.getUrl(
                          settings,
                          settings?.logo
                        )}
                      />
                      <AppFileUpload
                        form={form}
                        label={"Upload White Logo"}
                        name={"white_logo"}
                        preview={pocketbase.files.getUrl(
                          settings,
                          settings?.white_logo
                        )}
                      />
                      <AppFileUpload
                        form={form}
                        label={"Upload Login Background"}
                        name={"login_background"}
                        preview={pocketbase.files.getUrl(
                          settings,
                          settings?.login_background
                        )}
                      />
                      <div></div>
                      <div className="!mt-3 flex items-center justify-start">
                        <Button
                          size="sm"
                          type="submit"
                          className="mt-1"
                          disabled={
                            form.formState.disabled ||
                            form.formState.isSubmitting
                          }
                        >
                          {form.formState.isSubmitting && (
                            <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                          )}
                          Update Company Details
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-2xl px-5">
        <div className="px-3- py-2 text-[12.5px] text-slate-500 font-medium uppercase">
          <h4>App Configuration</h4>
        </div>
        <div>
          <div className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
            <div className="space-y-2">
              <h4 className="text-[15px] font-medium">
                Enable to recall tickets
              </h4>
              <p className="text-sm text-slate-500">
                Enable this to allow users to recall tickets.
              </p>
            </div>
            <Switch
              checked={settings.enable_ticket_recall}
              onCheckedChange={async () => {
                await pocketbase.collection("settings").update(settings.id, {
                  enable_ticket_recall: !settings.enable_ticket_recall,
                });
                refetch();
              }}
            />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
            <div className="space-y-2">
              <h4 className="text-[15px] font-medium">
                Enable delete draft items.
              </h4>
              <p className="text-sm text-slate-500">
                Enable this to allow users to delete draft items.
              </p>
            </div>
            <Switch
              checked={settings.enable_delete_draft_items}
              onCheckedChange={async () => {
                await pocketbase.collection("settings").update(settings.id, {
                  enable_delete_draft_items:
                    !settings.enable_delete_draft_items,
                });
                refetch();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default General;
