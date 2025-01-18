import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider } from "./context/auth.context";
import { Toaster } from "@/components/ui/sonner";
import { RolesProvider } from "./context/roles.context";
import { WorkShiftProvider } from "./context/workShift.context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RolesProvider>
          <WorkShiftProvider>
            <Outlet />
          </WorkShiftProvider>
        </RolesProvider>
      </AuthProvider>

      <Toaster
        duration={1000}
        position="bottom-right"
        className="flex h-full w-full flex-col items-center justify-center"
      />
    </QueryClientProvider>
  );
}
