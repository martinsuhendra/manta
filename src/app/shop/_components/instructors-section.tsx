"use client";

import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Instructor {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
}

interface InstructorsSectionProps {
  instructors: Instructor[];
}

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
          {instructors.map((instructor) => (
            <Card key={instructor.id} className="overflow-hidden text-center transition-all hover:shadow-lg">
              <CardHeader className="p-0">
                <div className="bg-muted flex aspect-square w-full items-center justify-center overflow-hidden">
                  {instructor.image ? (
                    <img
                      src={instructor.image}
                      alt={instructor.name ?? "Instructor"}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <User className="text-muted-foreground h-24 w-24" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-lg font-semibold">{instructor.name ?? "Coach"}</CardTitle>
                <CardDescription className="mt-2 text-sm">CrossFit Level 1 Trainer</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
