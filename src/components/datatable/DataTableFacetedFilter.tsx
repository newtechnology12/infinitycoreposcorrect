import * as React from "react";
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";

import { cn } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import PopoutSelect from "../PopoutSelect";

import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  type;
  loader;
  name;
  disabled?: any;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  type,
  loader,
  name,
  disabled,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues =
    type !== "date" && new Set(column?.getFilterValue() as string[]);

  const filterValue = column.getFilterValue() as any;

  const [open, setopen] = React.useState(false);

  const handleSelect = (option, isSelected) => {
    console.log(option);
    if (isSelected) {
      selectedValues.delete(option.value);
    } else {
      selectedValues.add(option.value);
    }
    const filterValues = Array.from(selectedValues);
    column?.setFilterValue(filterValues.length ? filterValues : undefined);
  };

  const [showDatePicker, setshowDatePicker] = React.useState(false);

  const dates: any = column.getFilterValue() || {};

  const { from, to } = dates;

  const onChange = (dates) => {
    const [start, end] = dates;
    column?.setFilterValue({ from: start, to: end });
  };

  return type === "date" ? (
    <div className="relative">
      <Button
        disabled={disabled}
        variant="outline"
        size="sm"
        className="h-8 border-dashed"
        onClick={() => setshowDatePicker(true)}
      >
        <PlusCircledIcon className="mr-2 h-4 w-4" />
        {title}
        {filterValue?.from ? (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="hidden- space-x-1 lg:flex">
              <Badge
                variant="secondary"
                className="rounded-sm capitalize px-1 font-normal"
              >
                {[from, to]
                  .filter((e) => e)
                  .map((e) => e?.toLocaleDateString())
                  .join(" - ")}
              </Badge>{" "}
            </div>
          </>
        ) : null}
      </Button>

      {showDatePicker && (
        <div className="absolute top-10 z-50 shadow-lg-">
          <DatePicker
            selected={from}
            onChange={onChange}
            startDate={from}
            endDate={to}
            onClickOutside={() => setshowDatePicker(false)}
            onSelect={() => setshowDatePicker(false)}
            selectsRange
            inline
          />
        </div>
      )}
    </div>
  ) : (
    <Popover open={open} onOpenChange={setopen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {filterValue ? (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="hidden- space-x-1 lg:flex">
                {type === "async-options" ? (
                  <>
                    {(column.getFilterValue() as any[])?.length > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {(column.getFilterValue() as any[])?.length} selected
                      </Badge>
                    ) : (
                      (column.getFilterValue() as any[]).map((option, i) => (
                        <Badge
                          variant="secondary"
                          key={i}
                          className="rounded-sm capitalize px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {selectedValues.size > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {selectedValues.size} selected
                      </Badge>
                    ) : (
                      options
                        .filter((option) => selectedValues.has(option.value))
                        .map((option, i) => (
                          <Badge
                            variant="secondary"
                            key={i}
                            className="rounded-sm capitalize px-1 font-normal"
                          >
                            {option.label}
                          </Badge>
                        ))
                    )}
                  </>
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      {type === "async-options" ? (
        <PopoverContent className="w-auto bg-white !p-0">
          <PopoutSelect
            open={open}
            name={name}
            isMulti={true}
            value={column.getFilterValue()}
            loader={loader}
            onChange={(e) => {
              if (e.length) {
                column?.setFilterValue(e);
              } else {
                column?.setFilterValue(undefined);
              }
            }}
            setOpen={setopen}
          />
        </PopoverContent>
      ) : (
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder={title} />
            <CommandList>
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options?.map((option, i) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <CommandItem
                        className="py-2"
                        key={i}
                        onSelect={() => {
                          handleSelect(option, isSelected);
                        }}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 text-slate-500 font-medium items-center justify-center rounded-sm border border-slate-400",
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <CheckIcon className={cn("h-3 w-3")} />
                        </div>
                        {option.icon && (
                          <option.icon className="mr-2 h-4 w-4 text-slate-500" />
                        )}
                        <span className="font-medium capitalize text-[12.5px]">
                          {option.label}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>

              {selectedValues.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => column?.setFilterValue(undefined)}
                      className="justify-center text-slate-600 !dark:text-slate-300 text-[13px] font-medium text-center"
                    >
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}
