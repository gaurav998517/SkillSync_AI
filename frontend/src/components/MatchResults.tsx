import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScoreCard from "@/components/ScoreCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Search, CheckCircle2, XCircle, Briefcase, Bookmark, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useResumeSuggestions } from "@/hooks/useResumeSuggestions";
import ResumeSuggestionsModal from "@/components/ResumeSuggestionsModal";

interface SkillBreakdown {
  name: string;
  weight: number;
  matched: boolean;
}

interface MatchData {
  skillMatch: number;
  experienceMatch: number;
  finalScore: number;
  matchPercentage?: number; // Added from new logic
  matchedSkills: string[];
  missingSkills: string[];
  weightsSummary?: {
    totalWeight: number;
    matchedWeight: number;
    skillBreakdown: SkillBreakdown[];
  };
}

interface RankedJob {
  job: {
    _id: string;
    title: string;
    company: string;
    minExperience: number;
  };
  matchDetails: MatchData;
}

const MatchResults = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<RankedJob[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resumeUsedId, setResumeUsedId] = useState<string>("");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const { user } = useAuth();
  const [savingJobs, setSavingJobs] = useState<Record<string, boolean>>({});

  const {
    loading: suggestionsLoading,
    suggestions,
    fetchSuggestions,
    clearSuggestions
  } = useResumeSuggestions();

  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string; company: string } | null>(null);

  const handleImproveResume = async (jobId: string, jobTitle: string, companyName: string) => {
    if (!resumeUsedId) {
      toast.error("No resume found. Please upload a resume first.");
      return;
    }
    setSelectedJob({ id: jobId, title: jobTitle, company: companyName });
    await fetchSuggestions(resumeUsedId, jobId);
  };

  const handleAutoMatch = async (expLevel = experienceFilter, eligible = eligibleOnly) => {
    if (!user) {
      setErrorMsg("Please log in to see job matches.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");
    try {
      const queryParams = [];
      if (expLevel !== "all") queryParams.push(`experienceLevel=${expLevel}`);
      if (eligible) queryParams.push(`eligibleOnly=true`);
      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const res = await api.get(`/match/auto/${user._id}${queryString}`);
      setJobs(res.data.data || []);
      setResumeUsedId(res.data.resumeUsed || "");
      setHasScanned(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Match scan failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && hasScanned) {
      handleAutoMatch(experienceFilter, eligibleOnly);
    }
  }, [experienceFilter, eligibleOnly]);

  const handleSaveJob = async (jobId: string) => {
    if (!user) return;
    setSavingJobs(prev => ({ ...prev, [jobId]: true }));
    try {
      await api.post(`/users/${user._id}/jobs/${jobId}`);
      toast.success("Job saved successfully!");
      // We could update local state if we want to show a saved indicator, but standard success toast is fine for now
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save job");
    } finally {
      setSavingJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const renderDemoCard = () => {
    return (
      <div className="glass rounded-2xl p-6 relative overflow-hidden border-primary/20 bg-primary/5 mt-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Demo Preview
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
            <ScoreCard score={78} label="Match Score" size={100} />
            <div className="text-center mt-4 space-y-1">
              <h4 className="font-bold text-lg text-foreground leading-tight">Full Stack Developer</h4>
              <p className="text-sm text-muted-foreground">SkillSync Systems (Demo)</p>
              <span className="inline-block mt-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                2+ yrs exp required
              </span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4 flex flex-col justify-center">
            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" /> You Have
              </h5>
              <div className="flex flex-wrap gap-2">
                {["react", "node.js", "javascript"].map((s) => (
                  <span key={s} className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" /> Missing
              </h5>
              <div className="flex flex-wrap gap-2">
                {["aws", "docker"].map((s) => (
                  <span key={s} className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              setSelectedJob({ id: "demo_job_id", title: "Full Stack Developer (Demo)", company: "SkillSync Systems" });
              await fetchSuggestions("demo_resume_id", "demo_job_id");
            }}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Improve My Resume
          </Button>
        </div>
      </div>
    );
  };

  // Fetch immediately on mount
  useEffect(() => {
    handleAutoMatch();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Auto-Match Analysis</h3>
          <p className="text-sm text-muted-foreground">Finding the best roles based on your latest resume skills.</p>
        </div>
        <Button variant="gradient" onClick={handleAutoMatch} disabled={loading}>
          {loading ? <LoadingSpinner size={16} /> : <><Search className="mr-2 h-4 w-4" /> Rescan</>}
        </Button>
      </div>

      {errorMsg ? (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-8 text-center border-destructive/30">
            <XCircle className="mx-auto h-8 w-8 text-destructive mb-3" />
            <p className="text-destructive font-medium">{errorMsg}</p>
            <p className="text-sm text-muted-foreground mt-2">Go to the "Upload Resume" tab to add your skills profile.</p>
          </div>
          
          <div className="space-y-4">
             <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Demo Match Preview</h4>
             {renderDemoCard()}
          </div>
        </div>
      ) : (
        <AnimatePresence>
          {hasScanned && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background/30 p-4 rounded-xl border border-border/40 glass mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Experience level:</span>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="bg-background/50 border border-border/60 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary glass"
                >
                  <option value="all">All levels</option>
                  <option value="entry">Entry Level (0-2 yrs)</option>
                  <option value="mid">Mid Level (3-5 yrs)</option>
                  <option value="senior">Senior Level (6+ yrs)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={eligibleOnly}
                    onChange={(e) => setEligibleOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-opacity-50"
                  />
                  Show eligible roles only
                </label>
              </div>
            </div>
          )}

          {hasScanned && jobs.length === 0 && (
             <div className="space-y-6">
               <div className="glass rounded-2xl p-8 text-center border-accent/30">
                 <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                 <p className="text-muted-foreground">No jobs available to match right now.</p>
                 <p className="text-sm text-muted-foreground mt-1">Check back later or add dummy jobs in the Jobs tab.</p>
               </div>
               
               <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Demo Match Preview</h4>
                  {renderDemoCard()}
               </div>
             </div>
          )}

          {hasScanned && jobs.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Top Recommendations</h3>
              {jobs.map((rankedJob, index) => (
                <motion.div
                  key={rankedJob.job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 relative overflow-hidden"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSaveJob(rankedJob.job._id)}
                      disabled={savingJobs[rankedJob.job._id]}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Save Job"
                    >
                       {savingJobs[rankedJob.job._id] ? <LoadingSpinner size={14} /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-12">
                     {/* Job Info & Score */}
                     <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                        <ScoreCard score={rankedJob.matchDetails.matchPercentage || rankedJob.matchDetails.finalScore || 0} label="Match Score" size={100} />
                        <div className="text-center mt-4 space-y-1">
                           <h4 className="font-bold text-lg text-foreground leading-tight">{rankedJob.job.title}</h4>
                           <p className="text-sm text-muted-foreground">{rankedJob.job.company}</p>
                           {rankedJob.job.minExperience > 0 && (
                              <span className="inline-block mt-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                {rankedJob.job.minExperience}+ yrs exp required
                              </span>
                           )}
                        </div>
                     </div>

                     {/* Skills Breakdown */}
                     <div className="md:col-span-8 space-y-4 flex flex-col justify-center">
                        <div>
                          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-success" /> You Have
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {rankedJob.matchDetails.matchedSkills.length > 0 ? (
                               rankedJob.matchDetails.matchedSkills.map((s) => (
                                <span key={s} className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                                  {s}
                                </span>
                              ))
                            ) : (
                               <span className="text-xs text-muted-foreground italic">No matching skills</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                             <XCircle className="h-3 w-3 text-destructive" /> Missing
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {rankedJob.matchDetails.missingSkills.length > 0 ? (
                               rankedJob.matchDetails.missingSkills.map((s) => (
                                <span key={s} className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                                  {s}
                                </span>
                              ))
                            ) : (
                               <span className="text-xs text-success italic mt-1 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Perfect match!</span>
                            )}
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Improve Resume Action */}
                  <div className="mt-6 pt-4 border-t border-border flex justify-end">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleImproveResume(rankedJob.job._id, rankedJob.job.title, rankedJob.job.company)}
                      className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" /> Improve My Resume
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {selectedJob && (
        <ResumeSuggestionsModal
          isOpen={!!selectedJob}
          onClose={() => {
            setSelectedJob(null);
            clearSuggestions();
          }}
          suggestions={suggestions}
          loading={suggestionsLoading}
          jobTitle={selectedJob.title}
          companyName={selectedJob.company}
          onRetry={() => handleImproveResume(selectedJob.id, selectedJob.title, selectedJob.company)}
        />
      )}
    </div>
  );
};

export default MatchResults;
