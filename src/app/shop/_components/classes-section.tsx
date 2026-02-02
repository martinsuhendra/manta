"use client";

import Image from "next/image";
import Link from "next/link";

import { Dumbbell, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  capacity: number;
  color: string | null;
  image: string | null;
}

interface ClassesSectionProps {
  classes: ClassItem[];
}

export function ClassesSection({ classes }: ClassesSectionProps) {
  if (classes.length === 0) return null;

  return (
    <section id="classes" className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Classes</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Discover the variety of programs we offer to help you reach your peak performance.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {classes.map((item) => (
            <Link key={item.id} href={`/shop/classes/${item.id}`}>
              <Card className="h-full cursor-pointer overflow-hidden pt-0">
                <CardHeader className="block p-0">
                  <div className="bg-muted relative aspect-video w-full overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        style={{ objectPosition: "center top" }}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ backgroundColor: item.color || "hsl(var(--muted))" }}
                      >
                        <Dumbbell className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Max {item.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{item.duration} min</span>
                    </div>
                  </div>
                  {item.description && (
                    <CardDescription className="mt-4 line-clamp-3">{item.description}</CardDescription>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
