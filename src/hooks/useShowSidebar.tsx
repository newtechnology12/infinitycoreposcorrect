import { useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { useLocation } from "react-router-dom";

export default function useShowSidebar() {
  const isMobile = useMediaQuery({ query: "(max-width: 750px)" });

  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const param = searchParams.get("show_sidebar");

  const showSideBar = useMemo(() => {
    return !isMobile ? true : param === "yes" ? true : false;
  }, [param, isMobile]);

  return { showSideBar };
}
