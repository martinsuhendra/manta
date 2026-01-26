import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProductCardIncludesProps {
  data: {
    whatIsIncluded?: string | null;
  };
  isPreview: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export function ProductCardIncludes({ data, isPreview, isExpanded, setIsExpanded }: ProductCardIncludesProps) {
  if (!data.whatIsIncluded) return null;

  const contentClasses =
    "text-muted-foreground prose prose-sm max-w-none text-sm [&_li]:ml-0 [&_ol]:ml-3 [&_ol]:list-decimal [&_ul]:ml-3 [&_ul]:list-disc";
  const content = <div className={contentClasses} dangerouslySetInnerHTML={{ __html: data.whatIsIncluded }} />;

  return (
    <div className="mt-4 border-t pt-4">
      {isPreview ? (
        <>
          <h4 className="mb-2 text-sm font-medium">What&apos;s Included?</h4>
          {content}
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 h-auto justify-between p-0 text-sm font-medium hover:bg-transparent"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            What&apos;s Included?
            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          {isExpanded && content}
        </>
      )}
    </div>
  );
}
