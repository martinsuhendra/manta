"use client";

import Image from "next/image";
import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import { SectionWithPattern } from "./section-with-pattern";

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

function getClassFeatures(item: ClassItem): { label: string; value: string }[] {
  return [
    { label: "Duration", value: `${item.duration} min` },
    { label: "Capacity", value: `Max ${item.capacity}` },
    { label: "Level", value: "All levels" },
  ];
}

export function ClassesSection({ classes }: ClassesSectionProps) {
  if (classes.length === 0) return null;

  return (
    <SectionWithPattern id="classes" className="border-border bg-card/30 relative border-y py-24">
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col gap-4 sm:mb-16 sm:gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="text-foreground mb-3 text-2xl font-black tracking-tighter uppercase italic sm:mb-4 sm:text-3xl md:text-5xl">
              Specialized <span className="text-primary">Disciplines</span>
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
              Whether you&apos;re looking for the explosive variety of CrossFit or the endurance-focused challenge of
              HYROX, our specialized classes are designed for every fitness level.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-primary gap-2 font-bold tracking-widest uppercase hover:gap-3"
            asChild
          >
            <Link href="#schedule">
              Explore All Programs
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {classes.map((item) => {
            const features = getClassFeatures(item);
            const accentColor = item.color ?? "var(--primary)";
            return (
              <div
                key={item.id}
                className="group border-border bg-card relative overflow-hidden rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
                  )}
                  <div className="from-card via-card/20 absolute inset-0 bg-gradient-to-t to-transparent" />
                  <div
                    className="bg-background/90 absolute top-6 left-6 rounded-full border-l-4 px-4 py-1.5 text-xs font-black tracking-widest uppercase shadow-lg backdrop-blur"
                    style={{ borderLeftColor: accentColor }}
                  >
                    {item.name}
                  </div>
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-foreground mb-3 text-xl font-black tracking-tight uppercase italic sm:mb-4 sm:text-2xl">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed sm:mb-6 sm:text-base">
                    {item.description ??
                      `Structured training designed for all levels. ${item.duration}-minute sessions, max ${item.capacity} participants.`}
                  </p>

                  <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
                    {features.map((feat) => (
                      <div
                        key={feat.label}
                        className="border-border bg-accent/50 rounded-lg border p-2 text-center sm:rounded-xl sm:p-3"
                      >
                        <div className="text-muted-foreground mb-0.5 text-[9px] font-black tracking-tighter uppercase sm:mb-1 sm:text-[10px]">
                          {feat.label}
                        </div>
                        <div className="text-foreground truncate text-[10px] font-bold uppercase sm:text-[11px]">
                          {feat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="group-hover:bg-primary group-hover:text-primary-foreground w-full rounded-xl py-4 text-sm font-black tracking-widest uppercase transition-colors"
                    variant="secondary"
                    asChild
                  >
                    <Link href={`/shop/classes/${item.id}`}>View Class Info</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWithPattern>
  );
}
