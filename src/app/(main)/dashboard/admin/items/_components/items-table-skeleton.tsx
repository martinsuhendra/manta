import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ItemsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead className="w-[200px]">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-24">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-16">
              <Skeleton className="h-4 w-4" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }, (_, index) => `skeleton-row-${index}`).map((key) => (
            <TableRow key={key}>
              <TableCell className="w-12">
                <div className="flex items-center justify-center">
                  <Skeleton className="h-4 w-4" />
                </div>
              </TableCell>
              <TableCell className="w-[200px]">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell className="w-24">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </TableCell>
              <TableCell className="w-24">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-4 w-6" />
                </div>
              </TableCell>
              <TableCell className="w-24">
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell className="w-24">
                <Skeleton className="h-6 w-12" />
              </TableCell>
              <TableCell className="w-24">
                <Skeleton className="h-6 w-12" />
              </TableCell>
              <TableCell className="w-24">
                <Skeleton className="h-6 w-12" />
              </TableCell>
              <TableCell className="w-16">
                <div className="flex items-center justify-center">
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
