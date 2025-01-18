import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import App from "@/App";
import DashboardLayout from "@/layouts/DashboardLayout";
import ForgotPassword from "@/pages/ForgotPassword";
import PageNotFound from "@/pages/PageNotFound";
import KitchenLayout from "./layouts/KitchenLayout";
import KitchenDisplay from "./pages/kitchen/KitchenDisplay";
import PosLayout from "./layouts/PosLayout";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import RootLayout from "./layouts/RootLayout";
import Settings from "./pages/pos/Settings";
import PosOrder from "./pages/pos/PosOrder";
import PosOrders from "./pages/pos/PosOrders";
import KitchenMenu from "./pages/kitchen/KitchenMenu";
import KitchenHistory from "./pages/kitchen/KitchenHistory";
import Dashboard from "./pages/dashboard/Dashboard";
import Employees from "./pages/dashboard/Employees";
import Categories from "./pages/dashboard/Categories";
import Menus from "./pages/dashboard/Menus";
import Ingredients from "./pages/dashboard/Ingredients";
import Customers from "./pages/dashboard/Customer";
import Suppliers from "./pages/dashboard/Suppliers";
import Transactions from "./pages/dashboard/Transactions";
import Stocks from "./pages/dashboard/Stocks";
import StockLevels from "./pages/dashboard/StockLevels";
import Purchases from "./pages/dashboard/Purchases";
import Transfers from "./pages/dashboard/Transfers";
import Adjustments from "./pages/dashboard/Adjustments";
import ChooseKitchen from "./pages/kitchen/ChooseKitchen";
import Leaves from "./pages/dashboard/Leaves";
import Tables from "./pages/dashboard/Tables";
import PosTables from "./pages/pos/Tables";
import Stations from "./pages/dashboard/Stations";
import PaymentMethods from "./pages/dashboard/PaymentMethods";
import WorkPeriods from "./pages/dashboard/WorkPeriods";
import WorkPeriodDetails from "./pages/dashboard/WorkPeriodDetails";
import OrdersPage from "./pages/dashboard/Orders";
import GeneralWorkPeriodReport from "./components/GeneralWorkPeriodReport";
import WorkPeriodTransactions from "./components/WorkPeriodTransactions";
import WorkShifts from "./components/WorkShifts";
import CreateShiftReport from "./components/CreateShiftReport";
import WorkShiftReports from "./pages/dashboard/WorkShiftReports";
import CashierReportDetails from "./pages/dashboard/CashierReportDetails";
import EmployeesCredits from "./pages/dashboard/EmployeesCredits";
import CustomersCredits from "./pages/dashboard/CustomersCredits";
import Reservations from "./pages/dashboard/Reservations";
import LowStockLevels from "./pages/dashboard/LowStockLevels";
import OrderDetails from "./pages/dashboard/OrderDetails";
import Payroll from "./pages/dashboard/Payroll";
import NewPayroll from "./pages/dashboard/NewPayroll";
import PayrollDetails from "./pages/dashboard/PayrollDetails";
import KitchenSettings from "./pages/kitchen/KitchenSettings";
import AccountSettings from "./pages/dashboard/AccountSettings";
import GeneralSettings from "./pages/dashboard/GeneralSettings";
import General from "./pages/dashboard/General";
import Roles from "./pages/dashboard/Roles";
import PayrollSettings from "./pages/dashboard/PayrollSettings";
import LeavesSettings from "./pages/dashboard/LeavesSettings";
import CreateOrUpdaterRole from "./pages/dashboard/CreateOrUpdaterRole";
import ImportData from "./pages/dashboard/ImportData";
import WorkPeriodOrders from "./pages/dashboard/WorkPeriodOrders";
import Discounts from "./pages/dashboard/Discounts";
import PurchaseForm from "./pages/dashboard/PurchaseForm";
import PurchaseDetails from "./pages/dashboard/PurchaseDetails";
import StockDetails from "./pages/dashboard/StockDetails";
import AttendaceSettings from "./pages/dashboard/AttendaceSettings";
import Expenses from "./pages/dashboard/Expenses";
import ExpenseCategories from "./pages/dashboard/ExpenseCategories";
import ProfitAndLoss from "./pages/dashboard/ProfitAndLoss";
import ExpensesReport from "./pages/dashboard/ExpensesReport";
import SalesReport from "./pages/dashboard/SalesReport";
import AttendaceLogs from "./pages/AttendanceLogs";
import AttendanceReport from "./pages/dashboard/AttendanceReport";
import AssetsCategories from "./pages/dashboard/AssetsCategories";
import Assets from "./pages/dashboard/Assets";
import AssetsTypes from "./pages/dashboard/AssetsTypes";
import FieldsSettings from "./pages/dashboard/FieldsSettings";
import IngredeintsReport from "./pages/dashboard/IngredeintsReport";
import SalesItemsReport from "./components/SalesItemsReport";
import Contractors from "./pages/dashboard/Contractors";
import ActivityLogs from "./pages/dashboard/ActivityLogs";
import InAndOut from "./pages/dashboard/InAndOut";
import TicketPage from "./pages/TicketPage";
import BillPage from "./pages/BillPage";
import TicketsReport from "./pages/dashboard/TicketsReport";
import WaitersReport from "./pages/dashboard/WaitersReport";
import Backup from "./pages/dashboard/Backup";
import Departments from "./pages/dashboard/Departments";
import CancellationsReport from "./components/CancellationsReport";
import Requisitions from "./pages/dashboard/Requisitions";
import RequisitionForm from "./pages/dashboard/RequisitionForm";
import RequisitionDetails from "./pages/dashboard/RequisitionDetails";
import DailyReports from "./pages/dashboard/DailyReports";
import StockAudits from "./pages/dashboard/StockAudits";
import StockAuditForm from "./components/StockAuditForm";
import StockAuditDetails from "./components/StockAuditDetails";

function Empty({ title }) {
  return <div>{title}</div>;
}

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            path: "/",
            element: <Login />,
          },
          {
            path: "/tickets/:ticketId",
            element: <TicketPage />,
          },
          {
            path: "/bills/:billId",
            element: <BillPage />,
          },
          {
            path: "/backups",
            element: (
              // <ProtectedRoute entity="handle_backups">
              <Backup />
              // </ProtectedRoute>
            ),
          },
        ],
      },

      {
        element: <RootLayout />,
        children: [
          {
            path: "/pos",
            element: (
              <ProtectedRoute entity="access_pos">
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              {
                index: true,
                element: <Navigate to={"menu"} replace />,
              },
              {
                element: <PosLayout />,
                children: [
                  {
                    path: "menu",
                    element: <PosOrder />,
                  },
                  {
                    path: "orders",
                    children: [
                      { index: true, element: <PosOrders /> },
                      { path: ":orderId", element: <PosOrder /> },
                    ],
                  },
                  {
                    path: "tables",
                    element: <PosTables />,
                  },
                  {
                    path: "settings",
                    element: <Settings />,
                  },
                ],
              },
            ],
          },
          {
            path: "/kitchen-display",
            element: (
              <ProtectedRoute entity="access_kitchen_display">
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              {
                index: true,
                element: <ChooseKitchen />,
              },
              {
                element: <KitchenLayout />,
                path: ":kitchen",
                children: [
                  {
                    index: true,
                    element: <KitchenDisplay />,
                  },
                  {
                    path: "menu",
                    element: <KitchenMenu />,
                  },
                  {
                    path: "history",
                    element: <KitchenHistory />,
                  },
                  {
                    path: "settings",
                    element: <KitchenSettings />,
                  },
                ],
              },
            ],
          },
          {
            path: "dashboard",
            element: <DashboardLayout />,
            children: [
              {
                element: (
                  <ProtectedRoute entity="view_dashboard">
                    <Dashboard />,
                  </ProtectedRoute>
                ),
                index: true,
              },
              {
                path: "account",
                element: <AccountSettings />,
              },
              {
                path: "sales",
                children: [
                  {
                    path: "orders",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_orders">
                            <OrdersPage />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":orderId",
                        element: (
                          <ProtectedRoute entity="view_order_details">
                            <OrderDetails />
                          </ProtectedRoute>
                        ),
                      },
                    ],
                  },
                  {
                    path: "transactions",
                    element: (
                      <ProtectedRoute entity="view_transactions">
                        <Transactions />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "reservations",
                    element: (
                      <ProtectedRoute entity="view_reservations">
                        <Reservations />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "hr",
                children: [
                  {
                    path: "employees",
                    element: (
                      <ProtectedRoute entity="view_employees">
                        <Employees />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "departments",
                    element: (
                      <ProtectedRoute entity="view_departments">
                        <Departments />
                      </ProtectedRoute>
                    ),
                  },

                  {
                    path: "leaves",
                    element: (
                      <ProtectedRoute entity="view_leaves">
                        <Leaves />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "attendance",
                    element: (
                      <ProtectedRoute entity="view_attendance">
                        <AttendaceLogs />
                      </ProtectedRoute>
                    ),
                  },
                  // attendance reports
                  {
                    path: "attendance-report",
                    element: <AttendanceReport />,
                  },
                  {
                    path: "payroll",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_payrolls">
                            <Payroll />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: "create",
                        element: (
                          <ProtectedRoute entity="create_payroll">
                            <NewPayroll />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":payrollId",
                        element: (
                          <ProtectedRoute entity="view_payroll_detail">
                            <PayrollDetails />
                          </ProtectedRoute>
                        ),
                      },
                    ],
                  },
                ],
              },
              {
                path: "menu",
                // element: <ProtectedRoute roles={["admin"]} />,
                children: [
                  {
                    path: "categories",
                    element: (
                      <ProtectedRoute entity="view_categories">
                        <Categories />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "items",
                    element: (
                      <ProtectedRoute entity="view_menu_items">
                        <Menus />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "ingredients",
                    element: (
                      <ProtectedRoute entity="view_ingredients">
                        <Ingredients />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "people",
                // element: <ProtectedRoute roles={["admin"]} />,
                children: [
                  {
                    path: "customers",
                    element: (
                      <ProtectedRoute entity="view_customers">
                        <Customers />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "suppliers",
                    element: (
                      <ProtectedRoute entity="view_suppliers">
                        <Suppliers />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "expenses",
                // element: <ProtectedRoute roles={["admin"]} />,
                children: [
                  {
                    index: true,
                    element: <Expenses />,
                  },
                  {
                    path: "categories",
                    element: <ExpenseCategories />,
                  },
                ],
              },
              {
                path: "assets",
                children: [
                  {
                    index: true,
                    element: (
                      <ProtectedRoute entity="view_assets">
                        <Assets />,
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "types",
                    element: (
                      <ProtectedRoute entity="view_assets_types">
                        <AssetsTypes />,
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "categories",
                    element: (
                      <ProtectedRoute entity="view_assets_categories">
                        <AssetsCategories />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "inventory",
                // element: <ProtectedRoute roles={["admin"]} />,
                children: [
                  {
                    path: "purchases",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_purchase_orders">
                            <Purchases />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: "new",
                        element: (
                          <ProtectedRoute entity="create_purchase_order">
                            <PurchaseForm />,
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":purchaseId",
                        element: (
                          <ProtectedRoute entity="view_purchase_details">
                            <PurchaseDetails />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":purchaseId/edit",
                        element: (
                          <ProtectedRoute entity="update_purchase_order">
                            <PurchaseForm />,
                          </ProtectedRoute>
                        ),
                      },
                    ],
                  },
                  {
                    path: "requisitions",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_requisitions_orders">
                            <Requisitions />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":requisitionId",
                        element: (
                          <ProtectedRoute entity="create_requisition">
                            <RequisitionDetails />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: "new",
                        element: (
                          <ProtectedRoute entity="create_requisition">
                            <RequisitionForm />
                          </ProtectedRoute>
                        ),
                      },
                    ],
                  },
                  {
                    path: "stocks",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_stocks">
                            <Stocks />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":stockId",
                        element: <StockDetails />,
                      },
                    ],
                  },
                  {
                    path: "transfers",
                    element: (
                      <ProtectedRoute entity="view_stocks">
                        <Transfers />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "adjustments",
                    element: (
                      <ProtectedRoute entity="view_stocks">
                        <Adjustments />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "stock-levels",
                    element: (
                      <ProtectedRoute entity="view_stock_levels">
                        <StockLevels />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "low-stock-levels",
                    element: (
                      <ProtectedRoute entity="view_low_stock_levels">
                        <LowStockLevels />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "stock-audits",
                    element: (
                      <ProtectedRoute entity="view_stock_audits">
                        <StockAudits />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "stock-audits/:auditId",
                    element: (
                      <ProtectedRoute entity="view_stock_audits">
                        <StockAuditDetails />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "new-stock-audit",
                    element: (
                      <ProtectedRoute entity="create_stock_audit">
                        <StockAuditForm />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "reports",
                children: [
                  {
                    path: "orders",
                    element: <Empty title="orders reports" />,
                  },
                  {
                    path: "inventory",
                    element: <Empty title="inventory report" />,
                  },
                  {
                    path: "cashier-reports",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_cashier_reports">
                            <WorkShiftReports />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":reportId",
                        element: (
                          <ProtectedRoute entity="view_cachier_report_details">
                            <CashierReportDetails />
                          </ProtectedRoute>
                        ),
                      },
                    ],
                  },
                  {
                    path: "work-periods",
                    children: [
                      {
                        index: true,
                        element: (
                          <ProtectedRoute entity="view_work_periods">
                            <WorkPeriods />
                          </ProtectedRoute>
                        ),
                      },
                      {
                        path: ":workPeriodId",
                        element: <WorkPeriodDetails />,
                        children: [
                          {
                            path: "shifts",
                            element: (
                              <ProtectedRoute entity="view_work_periods_shifts">
                                <WorkShifts />
                              </ProtectedRoute>
                            ),
                          },
                          {
                            path: "shifts/:shiftId",
                            element: (
                              <ProtectedRoute entity="create_work_period_shift_report">
                                <CreateShiftReport />
                              </ProtectedRoute>
                            ),
                          },
                          {
                            path: "general-report",
                            element: (
                              <ProtectedRoute entity="view_work_period_general_report">
                                <GeneralWorkPeriodReport />
                              </ProtectedRoute>
                            ),
                          },
                          {
                            path: "transactions",
                            element: (
                              <ProtectedRoute entity="view_work_period_transactions">
                                <WorkPeriodTransactions />
                              </ProtectedRoute>
                            ),
                          },
                          {
                            path: "orders",
                            element: (
                              <ProtectedRoute entity="view_work_period_orders">
                                <WorkPeriodOrders />
                              </ProtectedRoute>
                            ),
                          },
                        ],
                      },
                    ],
                  },
                  // profit and loss
                  {
                    path: "profit-loss",
                    element: <ProfitAndLoss />,
                  },
                  // expenses report
                  {
                    path: "expenses-report",
                    element: <ExpensesReport />,
                  },
                  // sales report
                  {
                    path: "sales-report",
                    element: <SalesReport />,
                  },
                  {
                    path: "tickets-report",
                    element: <TicketsReport />,
                  },
                  {
                    path: "waiter-sales-report",
                    element: <WaitersReport />,
                  },
                  {
                    path: "sales-items-report",
                    element: <SalesItemsReport />,
                  },
                  {
                    path: "cancellations-report",
                    element: <CancellationsReport />,
                  },
                  {
                    path: "daily-reports",
                    element: <DailyReports />,
                  },
                  {
                    path: "ingredients-report",
                    element: <IngredeintsReport />,
                  },
                ],
              },
              {
                path: "finance",
                children: [
                  {
                    path: "employees-credits",
                    element: (
                      <ProtectedRoute entity="view_employee_credits">
                        <EmployeesCredits />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "customers-credits",
                    element: (
                      <ProtectedRoute entity="view_customer_credits">
                        <CustomersCredits />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "other",
                children: [
                  {
                    path: "contractors",
                    element: (
                      <ProtectedRoute entity="view_contractors">
                        <Contractors />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "activity-logs",
                    element: (
                      <ProtectedRoute entity="view_activity_logs">
                        <ActivityLogs />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "in-and-out",
                    element: (
                      <ProtectedRoute entity="view_in_and_out">
                        <InAndOut />
                      </ProtectedRoute>
                    ),
                  },
                ],
              },
              {
                path: "settings",
                children: [
                  {
                    path: "general-settings",
                    element: (
                      <ProtectedRoute entity="general_settings">
                        <GeneralSettings />
                      </ProtectedRoute>
                    ),
                    children: [
                      {
                        index: true,
                        element: <General />,
                      },
                      {
                        path: "payroll",
                        element: <PayrollSettings />,
                      },
                      {
                        path: "leaves",
                        element: <LeavesSettings />,
                      },
                      {
                        path: "attendance",
                        element: <AttendaceSettings />,
                      },
                      {
                        path: "fields",
                        element: <FieldsSettings />,
                      },

                      {
                        path: "roles-permissions",
                        element: <Roles />,
                      },
                      {
                        path: "roles-permissions/new",
                        element: <CreateOrUpdaterRole />,
                      },
                      {
                        path: "roles-permissions/:roleId",
                        element: <CreateOrUpdaterRole />,
                      },
                      {
                        path: "roles-permissions/:roleId",
                        element: <CreateOrUpdaterRole />,
                      },
                    ],
                  },
                  {
                    path: "tables",
                    element: (
                      <ProtectedRoute entity="view_tables">
                        <Tables />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "discounts",
                    element: (
                      <ProtectedRoute entity="view_discounts">
                        <Discounts />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "backups",
                    element: (
                      // <ProtectedRoute entity="handle_backups">
                      <Backup />
                      // </ProtectedRoute>
                    ),
                  },
                  {
                    path: "import",
                    element: (
                      <ProtectedRoute entity="import_data">
                        <ImportData />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "order-stations",
                    element: (
                      <ProtectedRoute entity="view_order_stations">
                        <Stations />
                      </ProtectedRoute>
                    ),
                  },
                  {
                    path: "payment-methods",
                    element: (
                      <ProtectedRoute entity="view_payment_methods">
                        <PaymentMethods />,
                      </ProtectedRoute>
                    ),
                  },
                ],
              },

              {
                path: "*",
                element: <PageNotFound />,
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
]);

export default router;
