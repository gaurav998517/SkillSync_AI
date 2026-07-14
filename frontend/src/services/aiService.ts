import api from "./api";

export interface SuggestionsData {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  missingSkillsExplanation: string[];
  resumeImprovements: string[];
  suggestedBulletPoints: string[];
  projectRecommendations: string[];
  atsOptimizationTips: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
}

/**
 * Fetches AI resume improvement suggestions for a given resume and job matching combination.
 * 
 * @param resumeId ID of the resume to analyze
 * @param jobId ID of the target job
 * @returns Suggestion recommendations data object
 */
export const getResumeSuggestions = async (resumeId: string, jobId: string): Promise<SuggestionsData> => {
  const response = await api.post<ApiResponse<SuggestionsData>>("/ai/resume-suggestions", {
    resumeId,
    jobId,
  });
  return response.data.data;
};
