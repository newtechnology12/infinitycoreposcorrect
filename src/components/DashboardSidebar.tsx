import { useAuth } from "@/context/auth.context";
import { cn } from "@/utils/cn";
import {
  Grid,
  Users,
  LogOut,
  UserMinus,
  Archive,
  XCircle,
  Search,
} from "react-feather";
import { AiOutlineShop } from "react-icons/ai";
import { Link, useLocation } from "react-router-dom";
import { Fragment, useMemo, useState } from "react";
import Avatar from "./shared/Avatar";
import { BiDish } from "react-icons/bi";
import { IoWalletOutline } from "react-icons/io5";
import { IoFastFoodOutline } from "react-icons/io5";
import { PiBowlFoodBold } from "react-icons/pi";
import { LiaUserSecretSolid } from "react-icons/lia";
import { LuUsers } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TbTableShare } from "react-icons/tb";
import { BiPurchaseTagAlt } from "react-icons/bi";
import { TbAdjustmentsHorizontal } from "react-icons/tb";
import { LuLayoutGrid } from "react-icons/lu";
import ProfileDropdown from "./ProfileDropdown";
import LogoutModal from "./modals/LogoutModal";
import useModalState from "@/hooks/useModalState";
import {
  Activity,
  AlarmClock,
  ArchiveRestore,
  ArrowRightLeft,
  BellElectric,
  BetweenHorizonalEnd,
  BetweenVerticalEnd,
  Blocks,
  Box,
  CircleDollarSign,
  Contact,
  Container,
  CopyPlus,
  CreditCard,
  DoorOpen,
  Flag,
  FolderTree,
  GitPullRequestCreate,
  Landmark,
  Layers2,
  ListChecks,
  Megaphone,
  Percent,
  PieChart,
  PizzaIcon,
  Settings,
  ShoppingCart,
  Shuffle,
  SigmaIcon,
  User,
  UserCog,
  Wallet,
} from "lucide-react";
import { useRoles } from "@/context/roles.context";
import useSettings from "@/hooks/useSettings";
import pocketbase from "@/lib/pocketbase";

const getRoles = (entity, roles) => {
  return roles.filter((e) =>
    e?.permitions?.find((e) => e.name === entity && e.access === true)
  );
};
export default function DashboardSidebar() {
  const { roles } = useRoles();

  const { user }: any = useAuth();

  const [search, setSearch] = useState("");

  const groupLinks: any = useMemo(
    () =>
      roles
        ? [
            {
              name: "Menu",
              children: [
                {
                  name: "Dashboard Overview",
                  icon: LuLayoutGrid,
                  link: "/dashboard",
                  roles: getRoles("view_dashboard", roles),
                },
              ],
            },
            {
              name: "Portals",
              children: [
                {
                  name: "Point of sale",
                  icon: AiOutlineShop,
                  link: "/pos",
                  roles: getRoles("access_pos", roles),
                },
                {
                  name: "Kitchen display system",
                  icon: BiDish,
                  link: "/kitchen-display",
                  roles: getRoles("access_kitchen_display", roles),
                },
              ],
            },

            {
              name: "Sales & orders",
              children: [
                {
                  name: "Orders",
                  icon: Shuffle,
                  link: "/dashboard/sales/orders",
                  roles: getRoles("view_orders", roles),
                },
                {
                  name: "Payments & transaction",
                  icon: CreditCard,
                  link: "/dashboard/sales/transactions",
                  roles: getRoles("view_transactions", roles),
                },
                {
                  name: "Reservations",
                  icon: BetweenVerticalEnd,
                  link: "/dashboard/sales/reservations",
                  roles: getRoles("view_reservations", roles),
                },
              ],
            },
            {
              name: "Foods & Menu management.",
              children: [
                {
                  name: "Categories",
                  icon: Grid,
                  link: "/dashboard/menu/categories",
                  roles: getRoles("view_categories", roles),
                },
                {
                  name: "Food & Menus items",
                  icon: IoFastFoodOutline,
                  link: "/dashboard/menu/items",
                  roles: getRoles("view_menu_items", roles),
                },
                {
                  name: "Raw items",
                  icon: PiBowlFoodBold,
                  link: "/dashboard/menu/ingredients",
                  roles: getRoles("view_ingredients", roles),
                },
              ],
            },
            {
              name: "People",
              children: [
                {
                  name: "Customers",
                  icon: LuUsers,
                  link: "/dashboard/people/customers",
                  roles: getRoles("view_customers", roles),
                },
                {
                  name: "Suppliers",
                  icon: LiaUserSecretSolid,
                  link: "/dashboard/people/suppliers",
                  roles: getRoles("view_suppliers", roles),
                },
              ],
            },
            {
              name: "Inventory & stock",
              children: [
                {
                  name: "Requisition Orders",
                  icon: GitPullRequestCreate,
                  link: "/dashboard/inventory/requisitions",
                  roles: getRoles("view_requisitions_orders", roles),
                },
                {
                  name: "Purchase Orders",
                  icon: BiPurchaseTagAlt,
                  link: "/dashboard/inventory/purchases",
                  roles: getRoles("view_purchase_orders", roles),
                },
                {
                  name: "Stocks",
                  icon: Layers2,
                  link: "/dashboard/inventory/stocks",
                  roles: getRoles("view_stocks", roles),
                },
                {
                  name: "Adjustments",
                  icon: TbAdjustmentsHorizontal,
                  link: "/dashboard/inventory/adjustments",
                  roles: getRoles("view_adjustments", roles),
                },
                {
                  name: "Transfers",
                  icon: ArrowRightLeft,
                  link: "/dashboard/inventory/transfers",
                  roles: getRoles("view_transfers", roles),
                },
                {
                  name: "Stock Audits",
                  icon: ArchiveRestore,
                  link: "/dashboard/inventory/stock-audits",
                  roles: getRoles("view_stock_audits", roles),
                },
                {
                  name: "Create stock Audit",
                  icon: CopyPlus,
                  link: "/dashboard/inventory/new-stock-audit",
                  roles: getRoles("create_stock_audit", roles),
                },
              ],
            },

            {
              name: "HR Management",
              children: [
                {
                  name: "Employees",
                  icon: Users,
                  link: "/dashboard/hr/employees",
                  roles: getRoles("view_employees", roles),
                },
                {
                  name: "Departments",
                  icon: Box,
                  link: "/dashboard/hr/departments",
                  roles: getRoles("view_departments", roles),
                },
                {
                  name: "Leaves & Holidays",
                  icon: LogOut,
                  link: "/dashboard/hr/leaves",
                  roles: getRoles("view_leaves", roles),
                },
                {
                  name: "Attendance Logs",
                  icon: Megaphone,
                  link: "/dashboard/hr/attendance",
                  roles: getRoles("view_attendance", roles),
                },
                {
                  name: "Attendance reports.",
                  icon: ListChecks,
                  link: "/dashboard/hr/attendance-report",
                  roles: getRoles("view_attendance_report", roles),
                },
                {
                  name: "Payroll",
                  icon: IoWalletOutline,
                  link: "/dashboard/hr/payroll",
                  roles: getRoles("view_payrolls", roles),
                },
              ],
            },

            {
              name: "Expenses",
              children: [
                {
                  name: "Expenses categories",
                  icon: FolderTree,
                  link: "/dashboard/expenses/categories",
                  roles: getRoles("view_expenses_categories", roles),
                },
                {
                  name: "Expenses",
                  icon: CircleDollarSign,
                  link: "/dashboard/expenses",
                  roles: getRoles("view_expenses", roles),
                },
              ],
            },
            {
              name: "Reports and analytics.",
              children: [
                {
                  name: "Cashier reports.",
                  icon: Landmark,
                  link: "/dashboard/reports/cashier-reports",
                  roles: getRoles("view_cashier_reports", roles),
                },
                {
                  name: "Work Periods & shifts.",
                  icon: BetweenVerticalEnd,
                  roles: getRoles("view_work_periods", roles),
                  link: "/dashboard/reports/work-periods",
                },
                {
                  name: "Expenses Report",
                  icon: PieChart,
                  link: "/dashboard/reports/expenses-report",
                  roles: getRoles("view_expenses_report", roles),
                },
                {
                  name: "Profit & Loss",
                  icon: SigmaIcon,
                  link: "/dashboard/reports/profit-loss",
                  roles: getRoles("view_profit_and_loss", roles),
                },
                {
                  name: "Sales report",
                  icon: Flag,
                  link: "/dashboard/reports/sales-report",
                  roles: getRoles("view_sales_report", roles),
                },
                {
                  name: "Tickets report",
                  icon: Flag,
                  link: "/dashboard/reports/tickets-report",
                  roles: getRoles("view_tickets_report", roles),
                },
                {
                  name: "Waiter Sales report",
                  icon: User,
                  link: "/dashboard/reports/waiter-sales-report",
                  roles: getRoles("view_waiter_sales_report", roles),
                },
                {
                  name: "Sales items report",
                  icon: ShoppingCart,
                  link: "/dashboard/reports/sales-items-report",
                  roles: getRoles("view_sales_items_report", roles),
                },
                {
                  name: "Cancellation Report",
                  icon: XCircle,
                  link: "/dashboard/reports/cancellations-report",
                  roles: getRoles("view_cancellations_report", roles),
                },
                {
                  name: "Daily reports",
                  icon: AlarmClock,
                  link: "/dashboard/reports/daily-reports",
                  roles: getRoles("view_daily_reports", roles),
                },
              ],
            },
            {
              name: "Finance & accounting",
              children: [
                {
                  name: "Employees credits",
                  icon: BetweenHorizonalEnd,
                  link: "/dashboard/finance/employees-credits",
                  roles: getRoles("view_employee_credits", roles),
                },
                {
                  name: "Customers credits",
                  icon: UserMinus,
                  link: "/dashboard/finance/customers-credits",
                  roles: getRoles("view_customer_credits", roles),
                },
              ],
            },
            {
              name: "Other information",
              children: [
                {
                  name: "Contractors",
                  icon: Contact,
                  link: "/dashboard/other/contractors",
                  roles: getRoles("view_contractors", roles),
                },
                {
                  name: "Activity Logs",
                  icon: Activity,
                  link: "/dashboard/other/activity-logs",
                  roles: getRoles("view_activity_logs", roles),
                },
              ],
            },
            {
              name: "Security & Checkup",
              children: [
                {
                  name: "In And Out",
                  icon: DoorOpen,
                  link: "/dashboard/other/in-and-out",
                  roles: getRoles("view_in_and_out", roles),
                },
              ],
            },
            {
              name: "Assets inventory",
              children: [
                {
                  name: "Assets categories",
                  icon: BiPurchaseTagAlt,
                  link: "/dashboard/assets/categories",
                  roles: getRoles("view_assets_categories", roles),
                },
                {
                  name: "Assets types",
                  icon: Container,
                  link: "/dashboard/assets/types",
                  roles: getRoles("view_assets_types", roles),
                },
                {
                  name: "Assets inventory",
                  icon: Blocks,
                  link: "/dashboard/assets",
                  roles: getRoles("view_assets", roles),
                },
              ],
            },
            {
              name: "Settings",
              children: [
                {
                  name: "Tables",
                  icon: TbTableShare,
                  link: "/dashboard/settings/tables",
                  roles: getRoles("view_tables", roles),
                },
                {
                  name: "Discounts",
                  icon: Percent,
                  link: "/dashboard/settings/discounts",
                  roles: getRoles("view_discounts", roles),
                },
                {
                  name: "Order stations",
                  icon: BellElectric,
                  link: "/dashboard/settings/order-stations",
                  roles: getRoles("view_order_stations", roles),
                },
                {
                  name: "Payment methods",
                  icon: Wallet,
                  link: "/dashboard/settings/payment-methods",
                  roles: getRoles("view_payment_methods", roles),
                },
                {
                  name: "Backup & Restore",
                  icon: Archive,
                  link: "/dashboard/settings/backups",
                  roles: getRoles("handle_backups", roles),
                },
                {
                  name: "Account settings",
                  icon: UserCog,
                  link: "/dashboard/account",
                  roles: ["*"],
                },
                {
                  name: "General settings",
                  icon: Settings,
                  link: "/dashboard/settings/general-settings",
                  roles: getRoles("general_settings", roles),
                },
              ],
            },
          ].map((e) => {
            return {
              ...e,
              children: e.children
                .filter(
                  (e) =>
                    e.roles?.find((e) => e?.id === user?.role?.id) ||
                    e.roles[0] === "*"
                )
                .filter((e) => {
                  return e.name.toLowerCase().includes(search.toLowerCase());
                }),
            };
          })
        : [],
    [roles, search]
  );

  const location = useLocation();

  const [showProfile, setshowProfile] = useState(false);

  const logoutModal = useModalState();

  const { settings } = useSettings();

  return (
    <Fragment>
      {user && (
        <div className="fixed z-50 flex flex-col border-r border-slate-200 h-dvh w-[280px] bg-white ">
          <div className="px-4 py-3">
            <Link to={"/"} className="flex items-center gap-3">
              <img
                src={pocketbase.files.getUrl(settings, settings?.logo)}
                className="w-14"
                alt=""
              />
            </Link>
          </div>

          <ScrollArea className="h-full w-full border-t pt-1 border-slate-200 max-h-[90vh]">
            <div className="px-2 pt-1">
              <div className="rounded-[4px] relative overflow-hidden text-sm w-full border">
                <Search
                  size={16}
                  className="absolute text-slate-500 top-[10px] left-[8px]"
                />
                <input
                  placeholder="Search here.."
                  className="w-full py-[10px] pl-8 h-full"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            {groupLinks
              .filter((e) => {
                return e.children?.length;
              })
              .map((group, index) => {
                return (
                  <div key={index}>
                    <h1 className="px-3 tracking-wide py-2 text-[11.5px] font-medium text-slate-500 uppercase">
                      {group.name}
                    </h1>
                    <div className="border-t- mx-2 border-slate-200">
                      {group.children.map((link, index) => {
                        const linkToUse = link.link;
                        const baseSidebarPath = location.pathname
                          .split("/")
                          .slice(0, 4)
                          .join("/");
                        return (
                          <Link
                            to={linkToUse}
                            key={index}
                            {...link.props}
                            className={cn(
                              "px-3 py-3 my-1 cursor-pointer text-[13.5px] border-transparent border font-medium text-slate-700 capitalize flex items-center gap-4 ",
                              {
                                "bg-primary border text-white rounded-sm border-primary border-opacity-20":
                                  baseSidebarPath === linkToUse,
                                "hover:bg-slate-100":
                                  baseSidebarPath !== linkToUse,
                              }
                            )}
                          >
                            <link.icon className="text-base" size={18} />
                            <span>{link.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </ScrollArea>

          <div className="border-t  relative border-slate-200 shadow-md">
            <ProfileDropdown
              onLogout={() => {
                logoutModal.open();
              }}
              close={() => setshowProfile(false)}
              open={showProfile}
            />
            <div className="flex px-[6px] py-[6px] gap-2">
              <div
                onClick={() => {
                  setshowProfile(true);
                }}
                className="hover:bg-slate-100 px-[6px] hover:bg-opacity-60 cursor-pointer hover:border-slate-200 rounded-sm border border-transparent py-[6px] items-center justify-between w-full flex "
              >
                <div className="flex items-center gap-2">
                  <Avatar name={user?.names || ""} path={user?.photo} />
                  <div className="space-y-[2px]">
                    <h4 className="text-[13px] font-semibold capitalize text-slate-700">
                      {user?.names}
                    </h4>
                    <p className="text-[12px]  text-slate-500 capitalize font-medium">
                      {user?.role?.name}
                    </p>
                  </div>
                </div>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    setshowProfile(!showProfile);
                  }}
                  className="h-8 w-8 border border-transparent hover:border-slate-200 cursor-pointer hover:bg-slate-100 rounded-sm flex justify-center items-center"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-slate-400 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M15.1029 7.30379C15.3208 7.5974 15.2966 8.01406 15.0303 8.28033C14.7374 8.57322 14.2626 8.57322 13.9697 8.28033L10 4.31066L6.03033 8.28033L5.94621 8.35295C5.6526 8.5708 5.23594 8.5466 4.96967 8.28033C4.67678 7.98744 4.67678 7.51256 4.96967 7.21967L9.46967 2.71967L9.55379 2.64705C9.8474 2.4292 10.2641 2.4534 10.5303 2.71967L15.0303 7.21967L15.1029 7.30379ZM4.89705 12.6962C4.6792 12.4026 4.7034 11.9859 4.96967 11.7197C5.26256 11.4268 5.73744 11.4268 6.03033 11.7197L10 15.6893L13.9697 11.7197L14.0538 11.6471C14.3474 11.4292 14.7641 11.4534 15.0303 11.7197C15.3232 12.0126 15.3232 12.4874 15.0303 12.7803L10.5303 17.2803L10.4462 17.3529C10.1526 17.5708 9.73594 17.5466 9.46967 17.2803L4.96967 12.7803L4.89705 12.6962Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <LogoutModal
        onClose={() => logoutModal.close()}
        open={logoutModal.isOpen}
      />
    </Fragment>
  );
}
