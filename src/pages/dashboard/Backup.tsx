import Loader from "@/components/icons/Loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import pocketbase from "@/lib/pocketbase";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveAs } from "file-saver";

export default function Backup() {
  const [loading, setloading] = useState(false);

  const handleGenerateBackup = async () => {
    setloading(true);
    try {
      await pocketbase.admins.authWithPassword("admin@admin.com", "1234567890");

      const name = `backup_${new Date()
        .toLocaleDateString()
        .replace(/\//g, "_")}_${new Date().getTime()}.zip`;

      await pocketbase.backups.create(name);

      const token = await pocketbase.files.getToken();

      const url = pocketbase.backups.getDownloadUrl(token, name);

      setTimeout(() => {
        saveAs(url, name);
      }, 500);
    } catch (error) {
      console.log(error);
      toast.error("Failed to create backup");
    } finally {
      setloading(false);
    }
  };

  return (
    <div className="px-4 py-4- mt-2">
      <Card className="shadow-none rounded-[4px]">
        <div className="max-w-2xl px-5">
          <div className="px-3- py-2 text-[12.5px] text-slate-500 font-medium uppercase">
            <h4>Backup and restore</h4>
          </div>
          <div>
            <div>
              <div>
                <p className="text-sm text-slate-800 leading-7">
                  Generate a backup of your data. This will create a backup file
                  that you can use to restore your data in case of data loss.
                </p>
              </div>
              <div className="mt-3 mb-3">
                <Button onClick={handleGenerateBackup} size="sm">
                  {loading ? (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4 text-white" />
                  )}
                  <span>Generate Backup</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
