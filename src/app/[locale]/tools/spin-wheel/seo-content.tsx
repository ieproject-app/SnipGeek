"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeoContentProps {
  useCases: string[];
  faq: { q: string; a: string }[];
  labels: {
    useCasesTitle: string;
    faqTitle: string;
    showMore: string;
    showLess: string;
  };
}

export function SeoContent({ useCases, faq, labels }: SeoContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      aria-label="SEO content"
      className="max-w-3xl mx-auto px-4 sm:px-6 pb-20"
    >
      {/* Toggle button */}
      <div className="flex justify-center mb-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 text-sm font-semibold px-6 rounded-full border-2 hover:bg-muted/50 transition-all"
        >
          {isExpanded ? (
            <>
              {labels.showLess}
              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
            </>
          ) : (
            <>
              {labels.showMore}
              <ChevronDown className="w-4 h-4 transition-transform" />
            </>
          )}
        </Button>
      </div>

      {/* Expandable content - always in DOM for SEO */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-10 text-sm text-muted-foreground">
          {/* Use cases */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              {labels.useCasesTitle}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 list-none p-0 m-0">
              {useCases.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              {labels.faqTitle}
            </h2>
            <dl className="space-y-4">
              {faq.map(({ q, a }) => (
                <div key={q} className="p-4 rounded-xl bg-muted/20 border">
                  <dt className="font-medium text-foreground">{q}</dt>
                  <dd className="mt-1 leading-relaxed">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
