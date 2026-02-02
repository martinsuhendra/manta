"use client";

import Image from "next/image";

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
    <section id="about" className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:pt-4 lg:pr-8">
            <div className="lg:max-w-lg">
              <h2 className="text-base leading-7 font-semibold text-blue-600">About Us</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">More Than Just a Gym</p>
              <p className="text-muted-foreground mt-6 text-lg leading-8">
                At {APP_CONFIG.name}, we believe in the transformative power of fitness. Founded in 2024, our mission
                has been to create a space where everyone—from competitive athletes to fitness beginners—can push their
                limits and achieve their goals.
              </p>
              <div className="mt-8 space-y-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-muted absolute -inset-4 -z-10 rounded-xl opacity-50 blur-xl" />
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-900 shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] md:-ml-4 lg:-ml-0">
              <div className="flex h-full items-center justify-center text-gray-500">
                {/* Placeholder for gym image */}
                <span className="text-lg">Gym Interior Image Placeholder</span>
                {/* In a real app, use: <Image src="/path/to/image.jpg" alt="Gym interior" fill className="object-cover" /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
