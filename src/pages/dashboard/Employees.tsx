import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import DataTableRowActions from "@/components/datatable/DataTableRowActions";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { CheckCircle, PlusCircle, XCircle } from "lucide-react";
import { cn } from "@/utils";
import { Link } from "react-router-dom";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useState } from "react";
import { useQuery } from "react-query";
import { addDays } from "date-fns";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import useModalState from "@/hooks/useModalState";
import { EmployeFormModal } from "@/components/modals/EmployeeFormModal";
import useEditRow from "@/hooks/use-edit-row";
import { BulkImport } from "@/components/modals/BulkImport";
import { Upload } from "react-feather";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import ConfirmModal from "@/components/modals/ConfirmModal";
import formatFilter from "@/utils/formatFilter";
import { PasswordFormModal } from "@/components/modals/PasswordFormModal";
import { useRoles } from "@/context/roles.context";

export const orderSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  role: z.string(),
  email: z.string(),
  phone: z.string(),
});

const statuses = [
  {
    value: "active",
    label: "active",
    icon: CheckCircle,
  },
  {
    value: "in active",
    label: "in active",
    icon: XCircle,
  },
];

export type Order = z.infer<typeof orderSchema>;

export default function Employees() {
  const { canPerform } = useRoles();

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          // @ts-ignore
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- flex items-center gap-2">
          <Link
            to={""}
            className="hover:underline flex truncate items-center gap-2 capitalize hover:text-slate-600"
          >
            {row?.original["index"]}. {row.getValue("name")}
          </Link>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <div className="capitalize- truncate">{row.getValue("email")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("role")}</div>
      ),
      enableSorting: false,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Department" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("department")}</div>
      ),
      enableSorting: false,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },

    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("phone") || "N.A"}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "salary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Salary" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {Number(row.getValue("salary")).toLocaleString()} FRW
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "net_salary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Net salary" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {Number(row.getValue("net_salary")).toLocaleString()} FRW
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      filterFn: (__, _, value) => {
        return value;
      },
    },

    {
      accessorKey: "gender",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Gender" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("gender") || "N.A"}</div>
      ),
      enableSorting: true,
      enableHiding: true,
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return (
          <div
            className={cn(
              "flex w-[110px] text-left justify-center- text-[13px] capitalize rounded-full"
            )}
          >
            <span>{row.getValue("status")}</span>
          </div>
        );
      },
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined at" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("created")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              title: "update employee",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            canPerform("update_employee_status")
              ? {
                  title: "change password",
                  onClick: (e) => {
                    editPasswordRow.edit(e?.original);
                  },
                }
              : undefined,
          ].filter((e) => e)}
          row={row}
        />
      ),
    },
  ];

  const [searchText, setsearchText] = useState("");

  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([
    {
      id: "created",
      desc: true,
    },
  ]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const employeesQuery = useQuery({
    queryKey: [
      "employees",
      {
        search: searchText,
        filter: columnFilters,
        sort: sorting,
        pageIndex,
        pageSize,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText
        ? `name~"${searchText}" || department.name~"${searchText}"`
        : "";
      const filters = formatFilter(columnFilters);

      console.log(filters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("users")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            expand: "role,department",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e, i) => {
              return {
                id: e.id,
                index: i + 1,
                name: e.name,
                avatar: e.avatar,
                role: e.expand?.role?.name || "---",
                email: e.email || "---",
                phone: e.phone,
                status: e.status,
                net_salary: e?.net_salary,
                gender: e.gender,
                department: e?.expand?.department?.name || "N.A",
                salary: e.salary,
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                original: e,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const newEmployeeModal = useModalState();

  const editRow = useEditRow();

  const bulkImportModal = useModalState();

  const confirmModal = useConfirmModal();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("users")
      .delete(e.id)
      .then(() => {
        employeesQuery.refetch();
        confirmModal.close();
        toast.success("employee deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const handleValidateBulkImport = async (rows) => {
    const errors = [];
    // Validation for each row
    for (let i = 0; i < rows.length; i++) {
      // handle logic validation here
    }
    return errors;
  };

  const editPasswordRow = useEditRow();

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Employees
            </h2>
            <BreadCrumb
              items={[{ title: "All Employees", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button onClick={() => newEmployeeModal.open()} size="sm">
              <PlusCircle size={16} className="mr-2" />
              <span>Create new Employee</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={employeesQuery.isFetching}
          defaultColumnVisibility={{
            email: false,
          }}
          isLoading={employeesQuery.status === "loading"}
          data={employeesQuery?.data?.items || []}
          columns={columns}
          onSearch={(e) => {
            setsearchText(e);
          }}
          sorting={sorting}
          setSorting={setSorting}
          pageCount={employeesQuery?.data?.totalPages}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setColumnFilters={setColumnFilters}
          columnFilters={columnFilters}
          facets={[
            { title: "Status", options: statuses, name: "status" },
            {
              title: "Role",
              loader: ({ search }) => {
                console.log(search);
                return pocketbase
                  .collection("roles")
                  .getFullList(
                    cleanObject({
                      filter: search ? `name~"${search}"` : "",
                    })
                  )
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "role",
              type: "async-options",
            },
            {
              title: "Department",
              loader: ({ search }) => {
                return pocketbase
                  .collection("departments")
                  .getFullList(
                    cleanObject({
                      filter: search ? `name~"${search}"` : "",
                    })
                  )
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "department",
              type: "async-options",
            },
            {
              title: "Gender",
              options: [
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ],
              name: "gender",
            },
          ]}
        />
      </div>

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

      <EmployeFormModal
        onComplete={() => {
          employeesQuery.refetch();
          newEmployeeModal.close();
          editRow.close();
        }}
        employee={editRow.row}
        employeeToUpdate={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newEmployeeModal.setisOpen}
        open={newEmployeeModal.isOpen || editRow.isOpen}
      />

      <PasswordFormModal
        onComplete={() => {
          // employeesQuery.refetch();
          // newEmployeeModal.close();
          // editRow.close();
        }}
        employee={editPasswordRow.row}
        employeeToUpdate={editPasswordRow.row}
        setOpen={editPasswordRow.close}
        open={editPasswordRow.isOpen}
      />

      <BulkImport
        open={bulkImportModal.isOpen}
        setOpen={bulkImportModal.setisOpen}
        name="users"
        onComplete={() => {
          employeesQuery.refetch();
          bulkImportModal.close();
        }}
        sample={[
          {
            Name: "John",
            Phone: "+250788209629",
            Email: "john@mail.com",
            Gender: "male",
            Status: "active",
            Salary: "100000",
          },
        ]}
        expectedColumns={[
          "Name",
          "Phone",
          "Email",
          "Gender",
          "Status",
          "Salary",
        ]}
        parseEntity={(e) => {
          return {
            name: e["Name"],
            phone: e["Phone"],
            email: e["Email"],
            gender: e["Gender"],
            status: e["Status"],
            salary: e["Salary"],
            emailVisibility: true,
            password: "123456",
            passwordConfirm: "123456",
          };
        }}
        validate={handleValidateBulkImport}
      />
    </>
  );
}
