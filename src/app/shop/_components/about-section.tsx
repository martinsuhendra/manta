"use client";

import { CheckCircle2 } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

const features = [
  "Certified & Experienced Coaches",
  "Community-Focused Environment",
  "Scalable Workouts for All Levels",
  "Nutritional Guidance",
  "Open Gym Access",
  "Regular Community Events",
];

export function AboutSection() {
  return (
    <section id="about" className="border-border bg-muted/30 border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:pt-4">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase">About Us</p>
            <h2 className="text-foreground mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              More Than Just a Gym
            </h2>
            <p className="text-muted-foreground mt-6 text-lg leading-8">
              At {APP_CONFIG.name}, we believe in the transformative power of fitness. Our mission is to create a space
              where everyone—from competitive athletes to fitness beginners—can push their limits and achieve their
              goals.
            </p>
            <ul className="mt-8 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="text-muted-foreground flex items-start gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-border bg-card relative min-w-0 overflow-hidden rounded-2xl border">
            <div className="bg-muted aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground text-sm tracking-wider uppercase">Gym interior</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
