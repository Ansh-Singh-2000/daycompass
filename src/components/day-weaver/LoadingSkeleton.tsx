
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoadingSkeleton() {
    const isMobile = useIsMobile();

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
            <header className="shrink-0 border-b">
                <div className="px-4 lg:px-6 py-3">
                    {/* Simplified Header Skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Skeleton className="h-10 w-10 sm:h-14 sm:w-14" />
                            <Skeleton className="h-8 sm:h-9 w-36 sm:w-48" />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Skeleton className="hidden sm:flex h-9 w-24 rounded-lg" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-10 w-10 rounded-md" />
                                <Skeleton className="h-10 w-10 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-4 lg:overflow-hidden">
                {isMobile && (
                    <Alert className="shrink-0">
                        <Smartphone className="h-4 w-4" />
                        <AlertTitle>Optimized for Desktop</AlertTitle>
                        <AlertDescription>
                            For the best experience, please use Day Compass on a larger screen.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="lg:flex-1 flex flex-col lg:flex-row gap-6 lg:min-h-0">
                    {/* Left Panel Skeleton */}
                    <Card className="lg:w-[400px] lg:shrink-0 xl:w-[480px] flex flex-col">
                        <CardHeader>
                            <Skeleton className="h-7 w-48 mb-2" />
                            <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="lg:flex-1 flex flex-col gap-4 p-4 pt-0">
                            {/* Task Form Skeleton */}
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 flex-1" />
                                    <Skeleton className="h-10 w-10 shrink-0" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-10 w-24" />
                                    <Skeleton className="h-10 w-[120px]" />
                                    <Skeleton className="h-10 flex-1 min-w-[150px]" />
                                </div>
                            </div>
                            {/* Task List Skeleton */}
                            <div className="lg:flex-1 lg:relative">
                                <div className="lg:absolute lg:inset-0">
                                    <div className="space-y-2">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 border-t">
                            <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>

                    {/* Right Panel Skeleton */}
                    <Card className="lg:flex-1 flex flex-col lg:overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <Skeleton className="h-7 w-36 mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-10 w-10" />
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-10 w-10" />
                            </div>
                        </CardHeader>
                        <CardContent className="lg:flex-1 flex flex-col gap-4 lg:overflow-y-hidden p-4 pt-0">
                           <Skeleton className="h-full w-full min-h-[300px] lg:min-h-0" />
                        </CardContent>
                    </Card>
                </div>
            </main>
            <footer className="shrink-0 border-t">
              <div className="container mx-auto flex h-16 flex-col items-center justify-between gap-2 px-4 py-3 sm:flex-row sm:gap-0">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-9 w-28" />
              </div>
            </footer>
        </div>
    );
}
