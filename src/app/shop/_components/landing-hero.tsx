"use client";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";

export function LandingHero() {
  return (
    <div className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600 blur-3xl filter" />
        <div className="absolute top-1/2 right-0 h-96 w-96 rounded-full bg-indigo-600 blur-3xl filter" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 text-4xl font-bold tracking-tight text-white duration-1000 sm:text-6xl">
            Forge Your Best Self at <span className="text-blue-500">{APP_CONFIG.name}</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-8 mt-6 text-lg leading-8 text-gray-300 delay-200 duration-1000">
            Join the premier CrossFit community where strength meets resilience. Expert coaching, world-class
            facilities, and a supportive tribe waiting for you.
          </p>
          <div className="animate-in fade-in slide-in-from-bottom-8 mt-10 flex items-center justify-center gap-x-6 delay-300 duration-1000">
            <Link href="#plans">
              <Button size="lg" className="gap-2">
                Start Your Journey <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#about" className="text-sm leading-6 font-semibold text-white hover:text-blue-400">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
