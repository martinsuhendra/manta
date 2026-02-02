"use client";

import Image from "next/image";

import { User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Instructor {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  description?: string | null;
}

interface InstructorsSectionProps {
  instructors: Instructor[];
}

const ACCENT_GRADIENTS = [
  "from-amber-500 via-orange-500 to-rose-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-rose-500 via-pink-500 to-amber-500",
];

export function InstructorsSection({ instructors }: InstructorsSectionProps) {
  if (instructors.length === 0) return null;

  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Meet Your Coaches</h2>
          <p className="text-muted-foreground mt-4 text-lg">Expert guidance to help you crush your fitness goals.</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {instructors.map((instructor, index) => (
            <Card
              key={instructor.id}
              className="ring-border ring-offset-background overflow-hidden border-0 pt-0 text-center ring-2 ring-offset-2"
            >
              <CardHeader className="block p-0">
                <div className="bg-muted relative aspect-square w-full overflow-hidden">
                  {instructor.image ? (
                    <Image
                      src={instructor.image}
                      alt={instructor.name ?? "Instructor"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      style={{ objectPosition: "center top" }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="text-muted-foreground h-20 w-20" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r opacity-80",
                      ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length],
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-lg font-semibold tracking-tight">{instructor.name ?? "Coach"}</CardTitle>
                <CardDescription className="mt-2 text-sm">
                  {instructor.description ?? "CrossFit Level 1 Trainer"}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
