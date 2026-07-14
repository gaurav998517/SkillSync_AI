import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ResumeSuggestionsModal from "../components/ResumeSuggestionsModal";
import { useResumeSuggestions } from "../hooks/useResumeSuggestions";
import { renderHook, act } from "@testing-library/react";
import * as aiService from "../services/aiService";

// Mock toast and getResumeSuggestions
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../services/aiService", () => ({
  getResumeSuggestions: vi.fn(),
}));

describe("Resume Suggestions Frontend Module", () => {
  const mockSuggestions = {
    overallAssessment: "Excellent fit for this NodeJS role.",
    strengths: ["Strong backend knowledge", "Hands-on React experience"],
    weaknesses: ["Missing Docker exposure"],
    missingSkillsExplanation: ["Docker is required for local setup."],
    resumeImprovements: ["Add Docker container projects."],
    suggestedBulletPoints: [
      "Containerized a NodeJS application with Docker Compose.",
      "Optimized load times by 40%."
    ],
    projectRecommendations: ["Create a Docker microservice."],
    atsOptimizationTips: ["Ensure Docker is in the skills section."],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  describe("useResumeSuggestions Hook", () => {
    it("should handle initial idle state", () => {
      const { result } = renderHook(() => useResumeSuggestions());
      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should successfully fetch suggestions", async () => {
      vi.mocked(aiService.getResumeSuggestions).mockResolvedValueOnce(mockSuggestions);

      const { result } = renderHook(() => useResumeSuggestions());

      let fetchPromise;
      act(() => {
        fetchPromise = result.current.fetchSuggestions("res_1", "job_1");
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await fetchPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.error).toBeNull();
    });

    it("should handle fetch errors gracefully", async () => {
      const mockError = {
        response: {
          data: {
            message: "Groq API Limit Exceeded",
          },
        },
      };
      vi.mocked(aiService.getResumeSuggestions).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useResumeSuggestions());

      let fetchPromise;
      act(() => {
        fetchPromise = result.current.fetchSuggestions("res_1", "job_1");
      });

      await act(async () => {
        await fetchPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toBeNull();
      expect(result.current.error).toBe("Groq API Limit Exceeded");
    });
  });

  describe("ResumeSuggestionsModal Component", () => {
    it("should render skeleton/loading state when loading is true", () => {
      render(
        <ResumeSuggestionsModal
          isOpen={true}
          onClose={vi.fn()}
          suggestions={null}
          loading={true}
          jobTitle="Node Developer"
          companyName="TechCorp"
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(/Analyzing Match Parameters/i)).toBeInTheDocument();
      expect(screen.getByText(/Evaluating skills delta/i)).toBeInTheDocument();
    });

    it("should render all suggestions when loading is false and suggestions present", () => {
      render(
        <ResumeSuggestionsModal
          isOpen={true}
          onClose={vi.fn()}
          suggestions={mockSuggestions}
          loading={false}
          jobTitle="Node Developer"
          companyName="TechCorp"
          onRetry={vi.fn()}
        />
      );

      // Section titles & content checks
      expect(screen.getByText(/Excellent fit for this NodeJS role/i)).toBeInTheDocument();
      expect(screen.getByText(/Strong backend knowledge/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing Docker exposure/i)).toBeInTheDocument();
      expect(screen.getByText(/Docker is required for local setup/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Docker container projects/i)).toBeInTheDocument();
      expect(screen.getByText(/Create a Docker microservice/i)).toBeInTheDocument();
      expect(screen.getByText(/Ensure Docker is in the skills section/i)).toBeInTheDocument();
    });

    it("should call onRetry when clicking re-analyze button", () => {
      const onRetryMock = vi.fn();
      render(
        <ResumeSuggestionsModal
          isOpen={true}
          onClose={vi.fn()}
          suggestions={mockSuggestions}
          loading={false}
          jobTitle="Node Developer"
          companyName="TechCorp"
          onRetry={onRetryMock}
        />
      );

      const retryBtn = screen.getByRole("button", { name: /Re-analyze/i });
      fireEvent.click(retryBtn);

      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it("should allow copying suggested bullet points to clipboard", async () => {
      render(
        <ResumeSuggestionsModal
          isOpen={true}
          onClose={vi.fn()}
          suggestions={mockSuggestions}
          loading={false}
          jobTitle="Node Developer"
          companyName="TechCorp"
          onRetry={vi.fn()}
        />
      );

      const copyButtons = screen.getAllByTitle("Copy to clipboard");
      expect(copyButtons).toHaveLength(2);

      fireEvent.click(copyButtons[0]);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Containerized a NodeJS application with Docker Compose."
      );
    });
  });
});
