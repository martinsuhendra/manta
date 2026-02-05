"use client";

import Image from "next/image";

import { User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function InstructorsSection({ instructors }: InstructorsSectionProps) {
  if (instructors.length === 0) return null;

  return (
    <section className="border-border bg-muted/20 border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-black tracking-tighter uppercase italic sm:text-4xl md:text-5xl">
            Elite Coaching
          </h2>
          <p className="text-muted-foreground mt-4">Led by certified specialists and experienced athletes.</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {instructors.map((instructor) => (
            <Card
              key={instructor.id}
              className="group border-border bg-card hover:border-primary/50 relative overflow-hidden pt-0 transition-all"
            >
              <CardHeader className="block p-0">
                <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden">
                  {instructor.image ? (
                    <Image
                      src={instructor.image}
                      alt={instructor.name ?? "Instructor"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="text-muted-foreground h-20 w-20" />
                    </div>
                  )}
                  <div className="from-background via-background/40 absolute inset-0 bg-gradient-to-t to-transparent opacity-90" />
                  <div className="absolute right-0 bottom-0 left-0 translate-y-1 p-6 transition-transform group-hover:translate-y-0">
                    <CardTitle className="text-foreground text-xl font-bold uppercase italic">
                      {instructor.name ?? "Coach"}
                    </CardTitle>
                    <p className="text-primary mt-0.5 text-sm font-bold tracking-wide uppercase">Coach</p>
                    <CardDescription className="text-muted-foreground mt-1 text-xs">
                      {instructor.description ?? "CrossFit Level 1 Trainer"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
