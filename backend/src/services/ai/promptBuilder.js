/**
 * Prompt Builder Service for AI Resume Suggestions
 */
const buildPrompt = ({ resumeText, jobDescription, matchPercentage, matchedSkills, missingSkills }) => {
    const formattedMatched = (matchedSkills || []).join(', ') || 'None';
    const formattedMissing = (missingSkills || []).join(', ') || 'None';

    return `You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Screening Expert. 
Your goal is to evaluate the provided resume against the job description and output actionable resume improvement suggestions.

Input Data:
1. Current Resume Text:
"""
${resumeText || 'No resume text provided.'}
"""

2. Job Description:
"""
${jobDescription || 'No job description provided.'}
"""

3. Match Metrics:
- Current Match Percentage: ${matchPercentage || 0}%
- Matched Skills: ${formattedMatched}
- Missing Skills (Required but not present or matched in Resume): ${formattedMissing}

Your task is to analyze these inputs and return improvement suggestions.
You MUST output your response in valid JSON matching the schema below. 
Do not include any introductory text, Markdown formatting, backticks (\`\`\`), code block wrappers, or explanation outside of the JSON.

Expected JSON schema output:
{
  "overallAssessment": "A concise paragraph summarizing the resume's alignment, potential fit, and major gaps for this position.",
  "strengths": [
    "Specific strength 1 from the resume aligned with the job description.",
    "Specific strength 2..."
  ],
  "weaknesses": [
    "Specific gap or weakness 1 found in the resume relative to the job requirements.",
    "Specific gap or weakness 2..."
  ],
  "missingSkillsExplanation": [
    "Explanation of why missing skill 1 is important for this role and how the candidate can address it.",
    "Explanation of why missing skill 2..."
  ],
  "resumeImprovements": [
    "Actionable structural or phrasing improvement 1 for the resume.",
    "Actionable structural or phrasing improvement 2..."
  ],
  "suggestedBulletPoints": [
    "Tailored resume bullet point 1 integrating missing skills/experience that the candidate can copy/adapt (must start with strong action verbs).",
    "Tailored resume bullet point 2..."
  ],
  "projectRecommendations": [
    "Specific project recommendation 1 to help showcase the missing skills or tools.",
    "Specific project recommendation 2..."
  ],
  "atsOptimizationTips": [
    "ATS compliance tip 1 related to formatting, headings, or keyword density.",
    "ATS compliance tip 2..."
  ]
}

Ensure all lists have at least 2 relevant, concrete suggestions (unless no missing skills exist, in which case explain the success). Fill out all JSON keys. Make sure the JSON is properly escaped and syntactically correct. Output JSON only.`;
};

module.exports = {
    buildPrompt
};
