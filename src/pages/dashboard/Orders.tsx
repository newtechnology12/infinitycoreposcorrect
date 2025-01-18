import Orders from "@/components/Orders";
import BreadCrumb from "@/components/breadcrumb";

export default function OrdersPage() {
  return (
    <div className="sm:px-4 px-2">
      <div className="flex items-start justify-between space-y-2 mb-3">
        <div className="flex mb-3 md:mb-0 items-start gap-2 flex-col">
          <h2 className="text-base font-semibold tracking-tight">
            All Orders Placed
          </h2>
          <BreadCrumb items={[{ title: "All Orders", link: "/dashboard" }]} />
        </div>
      </div>
      <Orders />
    </div>
  );
}
