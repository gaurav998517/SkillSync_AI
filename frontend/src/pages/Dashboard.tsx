import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "@/services/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import ResumeUploader from "@/components/ResumeUploader";
import MatchResults from "@/components/MatchResults";
import JobUploader from "@/components/JobUploader";
import SavedJobs from "@/components/SavedJobs";
import { motion } from "framer-motion";
import { Bell, User, FileText, Target, TrendingUp, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const DashboardHome = () => {
  const { user } = useAuth();
  const isRecruiter = user?.role === "recruiter";
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRecruiter) return;
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/jobs");
        setJobs(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch jobs for overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [isRecruiter]);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name}. Here's your overview.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {(isRecruiter
          ? [
              { icon: Briefcase, label: "Active Jobs", value: loading ? "..." : String(jobs.length), color: "text-primary" },
              { icon: Target, label: "Candidates Matched", value: "24", color: "text-accent" },
              { icon: TrendingUp, label: "Avg Match Score", value: "88%", color: "text-success" },
            ]
          : [
              { icon: FileText, label: "Resumes Uploaded", value: user?.resumesCount !== undefined ? String(user.resumesCount) : "0", color: "text-primary" },
              { icon: Target, label: "Jobs Matched", value: user?.jobsMatchedCount !== undefined ? String(user.jobsMatchedCount) : "0", color: "text-accent" },
              { icon: TrendingUp, label: "Avg Match Score", value: user?.avgMatchScore ? `${user.avgMatchScore}%` : "0%", color: "text-success" },
            ]
        ).map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {isRecruiter ? (
          <div className="lg:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Active Job Postings Overview</h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading active jobs...</p>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">You currently have no active job postings. Go to Jobs to create one.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {jobs.map((job) => (
                    <div key={job._id} className="p-4 rounded-xl border border-border bg-card/50 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-foreground">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">{job.company}</p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        {job.minExperience}y+ exp
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Upload</h3>
                <ResumeUploader />
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Match</h3>
                <MatchResults />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">My Profile Skills</h3>
                {user?.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary capitalize">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills extracted yet. Upload a resume to see your skills here!</p>
                )}
                
                {user?.education && user.education.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-2 text-sm font-semibold text-foreground">Education</h4>
                    <div className="space-y-2">
                      {user.education.map((edu, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">{edu}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const UploadPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Upload Resume</h2>
      <p className="text-sm text-muted-foreground">Upload your resume for AI analysis.</p>
    </div>
    <div className="glass rounded-2xl p-8">
      <ResumeUploader />
    </div>
  </motion.div>
);

const MatchPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Job Matching</h2>
      <p className="text-sm text-muted-foreground">Check your compatibility score against any job.</p>
    </div>
    <MatchResults />
  </motion.div>
);

const JobsPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Jobs Management</h2>
      <p className="text-sm text-muted-foreground">Create new jobs or browse available positions.</p>
    </div>
    <JobUploader />
  </motion.div>
);

const SavedJobsPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-foreground">Saved Jobs</h2>
      <p className="text-sm text-muted-foreground">Your bookmarked career opportunities.</p>
    </div>
    <SavedJobs />
  </motion.div>
);
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-end gap-4 border-b border-border px-6">
          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="match" element={<MatchPage />} />
            <Route path="saved-jobs" element={<SavedJobsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
