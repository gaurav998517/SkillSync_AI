import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuggestionsData } from "@/services/aiService";
import { 
  Sparkles, CheckCircle, AlertCircle, Copy, Check, 
  Lightbulb, Code, BookOpen, CheckSquare, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: SuggestionsData | null;
  loading: boolean;
  jobTitle: string;
  companyName: string;
  onRetry: () => void;
}

const ResumeSuggestionsModal: React.FC<SuggestionsModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  loading,
  jobTitle,
  companyName,
  onRetry
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Bullet point copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              Resume Improvement suggestions
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Tailored optimization for <span className="font-semibold text-primary">{jobTitle}</span> at <span className="font-semibold text-primary">{companyName}</span>.
            </DialogDescription>
          </div>
          {suggestions && !loading && (
            <Button variant="outline" size="sm" onClick={onRetry} className="self-start sm:self-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Re-analyze
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 py-4">
          {loading ? (
            <div className="h-full flex flex-col justify-center items-center space-y-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center max-w-sm space-y-2">
                <h4 className="font-bold text-lg text-foreground">Analyzing Match Parameters</h4>
                <p className="text-sm text-muted-foreground">
                  Evaluating skills delta, job specifications, and writing targeted recommendation sections...
                </p>
              </div>
              <div className="w-full max-w-md space-y-3 mt-4">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                <div className="h-4 bg-muted animate-pulse rounded w-5/6 mx-auto" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3 mx-auto" />
              </div>
            </div>
          ) : suggestions ? (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                {/* 1. Overall Assessment */}
                <div className="glass-panel relative overflow-hidden rounded-2xl p-6 bg-primary/5 border border-primary/10">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  <h4 className="font-bold text-lg text-primary flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5" /> Overall Assessment
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {suggestions.overallAssessment}
                  </p>
                </div>

                {/* 2. Strengths and Weaknesses */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="glass-panel border border-success/25 bg-success/5 rounded-2xl p-5">
                    <h4 className="font-bold text-md text-success flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4" /> Key Strengths
                    </h4>
                    <ul className="space-y-2.5">
                      {suggestions.strengths.map((strength, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-success font-semibold mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-panel border border-destructive/25 bg-destructive/5 rounded-2xl p-5">
                    <h4 className="font-bold text-md text-destructive flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4" /> Critical Gaps & Weaknesses
                    </h4>
                    <ul className="space-y-2.5">
                      {suggestions.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-foreground">
                          <span className="text-destructive font-semibold mt-0.5">•</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. Missing Skills Explanation */}
                {suggestions.missingSkillsExplanation && suggestions.missingSkillsExplanation.length > 0 && (
                  <div className="glass-panel border border-border rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-md text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <BookOpen className="h-4.5 w-4.5 text-accent" /> Why Missing Skills Matter
                    </h4>
                    <div className="grid gap-3">
                      {suggestions.missingSkillsExplanation.map((explanation, idx) => (
                        <div key={idx} className="text-sm rounded-lg bg-muted/40 p-3 border border-border/50">
                          {explanation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Resume Improvements */}
                <div className="glass-panel border border-border rounded-2xl p-5">
                  <h4 className="font-bold text-md text-foreground flex items-center gap-2 mb-3 border-b border-border pb-2">
                    <CheckSquare className="h-4.5 w-4.5 text-primary" /> Actionable Resume Structure Changes
                  </h4>
                  <ul className="space-y-3">
                    {suggestions.resumeImprovements.map((improvement, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Suggested Bullet Points */}
                <div className="glass-panel border border-border rounded-2xl p-5">
                  <h4 className="font-bold text-md text-foreground flex items-center gap-2 mb-3 border-b border-border pb-2">
                    <Code className="h-4.5 w-4.5 text-accent" /> Suggested Experience Bullet Points
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Copy and adapt these tailor-made performance bullet points containing keywords and missing technical competencies:
                  </p>
                  <div className="space-y-3">
                    {suggestions.suggestedBulletPoints.map((bullet, idx) => (
                      <div key={idx} className="group flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50">
                        <span className="text-primary font-semibold mt-1 shrink-0">→</span>
                        <p className="text-sm text-foreground flex-1 italic">"{bullet}"</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(bullet, idx)}
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground opacity-80 group-hover:opacity-100"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Project Recommendations */}
                <div className="glass-panel border border-border rounded-2xl p-5">
                  <h4 className="font-bold text-md text-foreground flex items-center gap-2 mb-3 border-b border-border pb-2">
                    <BookOpen className="h-4.5 w-4.5 text-success" /> Recommended Portfolio Projects
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {suggestions.projectRecommendations.map((project, idx) => (
                      <div key={idx} className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sm text-foreground">Project Concept</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {project}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. ATS Optimization Tips */}
                <div className="glass-panel border border-border rounded-2xl p-5">
                  <h4 className="font-bold text-md text-foreground flex items-center gap-2 mb-3 border-b border-border pb-2">
                    <Sparkles className="h-4.5 w-4.5 text-warning" /> ATS Scan Optimization Tips
                  </h4>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {suggestions.atsOptimizationTips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2.5 text-sm text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border/40">
                        <span className="text-warning font-bold mt-0.5">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col justify-center items-center space-y-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Failed to load suggestions.</p>
              <Button onClick={onRetry}>Try Again</Button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button onClick={onClose} className="px-6">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeSuggestionsModal;
