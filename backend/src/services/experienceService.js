/**
 * Service to extract years of experience from raw resume text.
 */

/**
 * Extracts years of experience from a text snippet.
 * @param {string} text - The raw text of the resume.
 * @returns {number} - The extracted years of experience (defaults to 0 if not found).
 */
const extractExperience = (text) => {
    if (!text) return 0;

    // Normalize text: collapse whitespace, lowercase
    const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();

    // 1. Precise patterns looking for overall/total/professional experience
    const primaryRegexes = [
        /(?:total|overall|professional|work|industry|relevant)?\s*(?:of\s*)?(\d+)\s*\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:professional|work|industry|relevant)?\s*experience/i,
        /(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:in|of)\s*(?:software|development|programming|it|industry|field|experience)/i,
        /(?:experience|exp)\s*[:\-]?\s*(\d+)\s*\+?\s*(?:years?|yrs?)/i,
        /(?:worked|working)\s*(?:for|as)?\s*(\d+)\s*\+?\s*(?:years?|yrs?)/i
    ];

    for (const regex of primaryRegexes) {
        const match = normalizedText.match(regex);
        if (match) {
            const val = parseInt(match[1], 10);
            if (!isNaN(val) && val >= 0 && val <= 30) {
                return val;
            }
        }
    }

    // 2. Generic fallback: look for any number of years/yrs pattern
    const genericRegex = /\b(\d+)\s*\+?\s*(?:years?|yrs?)\b/gi;
    let match;
    let maxYears = 0;
    
    // We search the entire text and return the maximum valid year found (bounded between 1 and 25)
    while ((match = genericRegex.exec(normalizedText)) !== null) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxYears && val <= 25) {
            maxYears = val;
        }
    }

    return maxYears;
};

module.exports = {
    extractExperience
};
