import { useState } from "react";
import { getResumeSuggestions, SuggestionsData } from "@/services/aiService";
import { toast } from "sonner";

export const useResumeSuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Triggers generation or retrieval of resume improvement suggestions
   * @param resumeId ID of the resume
   * @param jobId ID of the job
   */
  const fetchSuggestions = async (resumeId: string, jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResumeSuggestions(resumeId, jobId);
      setSuggestions(data);
      toast.success("Improvement suggestions loaded successfully.");
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Could not retrieve resume recommendations.";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions(null);
    setError(null);
  };

  return {
    loading,
    suggestions,
    error,
    fetchSuggestions,
    clearSuggestions
  };
};
