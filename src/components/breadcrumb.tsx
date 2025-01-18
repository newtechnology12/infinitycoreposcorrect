import { cn } from "@/utils";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import React from "react";
import { Link } from "react-router-dom";

type BreadCrumbType = {
  title: string;
  link: string;
};

type BreadCrumbPropsType = {
  items: BreadCrumbType[];
};

export default function BreadCrumb({ items }: BreadCrumbPropsType) {
  return (
    <div className="mb-4- md:flex hidden items-center space-x-1 text-sm text-muted-foreground">
      <Link
        to={"/"}
        className="overflow-hidden font-medium text-ellipsis whitespace-nowrap"
      >
        Dashboard
      </Link>
      {items?.map((item: BreadCrumbType, index: number) => (
        <React.Fragment key={item.title}>
          <ChevronRightIcon className="h-4 w-4" />
          <Link
            to={item.link}
            className={cn(
              "font-medium-",
              index === items.length - 1
                ? "text-slate-500 pointer-events-none"
                : "text-slate-500"
            )}
          >
            {item.title}
          </Link>
        </React.Fragment>
      ))}
    </div>
  );
}
