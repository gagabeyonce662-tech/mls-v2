"use client";

import { Table, TableBody, TableCell, TableRow } from "./table";

interface PropertyDetail {
  label: string;
  value: string | number;
}

interface PropertyDetailsTableProps {
  details: PropertyDetail[];
}

export function PropertyDetailsTable({ details }: PropertyDetailsTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableBody>
          {details.map((detail, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-gray-700 w-1/3">
                {detail.label}
              </TableCell>
              <TableCell className="text-gray-900">{detail.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
