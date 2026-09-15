import { Skeleton } from "@/components/ui/skeleton";

/**
 * Carregando o relatorio (DESIGN.md 7): skeleton com as medidas do conteudo
 * final (header 44px, anel 168px / 128px no mobile, sub-scores de 70px).
 */
export default function ReportLoading() {
  return (
    <main aria-busy="true" aria-label="Carregando relatório" className="container-page flex flex-col gap-14 pt-22 pb-14 sm:gap-20 sm:pt-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6.5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-control" />
          <Skeleton className="h-10 w-36 rounded-control" />
        </div>
      </div>

      <div className="-mt-4 flex flex-col items-center gap-6 sm:-mt-8 md:flex-row md:gap-10">
        <Skeleton className="size-32 shrink-0 rounded-full md:size-42" />
        <div className="flex w-full max-w-160 flex-col items-center gap-3 md:items-start">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full max-w-120" />
          <Skeleton className="h-5 w-full max-w-140" />
          <Skeleton className="h-5 w-3/4 max-w-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-0.75 w-full rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
