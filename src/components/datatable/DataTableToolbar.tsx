"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { Fragment, useState } from "react";
import { useDebounce } from "react-use";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "react-feather";
import { Search } from "lucide-react";
import { utils, write } from "xlsx";

import { saveAs } from "file-saver";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  facets;
  onSearch;
  Action?: any;
  onExport;
}

export function DataTableToolbar<TData>({
  table,
  facets,
  onSearch,
  Action,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [search, setsearch] = useState("");

  useDebounce(
    () => {
      onSearch(search);
    },
    700,
    [search]
  );

  const handleExelExport = () => {
    var table = document.getElementById("dataTable");
    var wb = utils.table_to_book(table, { sheet: "Sheet JS" });
    var wbout = write(wb, {
      bookType: "xlsx",
      bookSST: true,
      type: "binary",
    });

    function s2ab(s) {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }

    const name = `export-${new Date().toISOString()}.xlsx`;

    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), name);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-y-3 items-center space-x-2">
          <div className="relative">
            <Input
              placeholder="Search here..."
              value={search}
              type="search"
              onChange={(event) => setsearch(event.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <Search
              className="absolute right-3 text-slate-500 top-2"
              size={15}
            />
          </div>
          {facets.map((e, i) => {
            return (
              <Fragment key={i}>
                {table.getColumn(e.name) && (
                  <DataTableFacetedFilter
                    column={table.getColumn(e.name)}
                    title={e.title}
                    options={e.options}
                    type={e.type}
                    loader={e.loader}
                    name={e.name}
                    disabled={e.disabled}
                  />
                )}
              </Fragment>
            );
          })}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-600 dark:text-slate-200 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
        {Action && <Action />}
        {/* <Button
          variant="secondary"
          className="border- !bg-red-500 !text-white h-[30px] bg-opacity-0 border-dashed border-slate-300 text-slate-700- mr-2"
          size="sm"
          onClick={() => confirmModal.open({})}
        >
          <Trash size={15} className="mr-2" />
          Delete
        </Button> */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="secondary"
              className="border- !bg-primary !text-white h-[30px] bg-opacity-0 border-dashed border-slate-300 text-slate-700- mr-2"
              size="sm"
            >
              Export
              <Download size={16} className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExelExport}>
              EXCEL
            </DropdownMenuItem>
            {/* <DropdownMenuItem>PDF</DropdownMenuItem>
          <DropdownMenuItem>DOCX</DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>

        <DataTableViewOptions table={table} />
      </div>
      {/* <ConfirmModal
        title={"Are you sure you want to delete all records?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        meta={confirmModal.meta}
        onConfirm={handleDelete}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      /> */}
    </>
  );
}
