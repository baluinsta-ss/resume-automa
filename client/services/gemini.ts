import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeData, JobDescription, ATSScore } from "@/types";

let GEMINI_API_KEY = "";

try {
  GEMINI_API_KEY = (import.meta.env as any)?.VITE_GOOGLE_GEMINI_API_KEY || "";
} catch (e) {
  console.warn("[Gemini] Could not access import.meta.env:", e);
  GEMINI_API_KEY = "";
}

let client: GoogleGenerativeAI | null = null;

function initGemini(): GoogleGenerativeAI {
  if (client) return client;
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Gemini API key not configured. Set VITE_GOOGLE_GEMINI_API_KEY in .env",
    );
  }
  client = new GoogleGenerativeAI(GEMINI_API_KEY);
  return client;
}

export async function parseJobFromHTML(
  htmlContent: string,
): Promise<JobDescription> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Clean HTML to remove scripts and styles for better parsing
  const cleanHTML = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .substring(0, 16000); // Limit to first 16k chars for API limits

  const prompt = `You are an expert at extracting job posting information from HTML pages.

  Analyze this HTML content and extract the job posting details. Be thorough in finding all job information, requirements, and skills.

  Return ONLY a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
  {
    "title": "the job title or position name",
    "company": "the company name",
    "location": "location if available, or empty string",
    "description": "the full job description and responsibilities",
    "requirements": ["requirement or qualification 1", "requirement or qualification 2", "requirement or qualification 3"],
    "skills": ["technical skill 1", "technical skill 2", "soft skill 1", "soft skill 2"]
  }

  Guidelines:
  - Extract the actual job title (not 'Job' or generic text)
  - Find the company name from the page
  - Include location if mentioned
  - Combine all job description/responsibilities into one description field
  - List key requirements and qualifications as an array
  - Extract technical skills (programming languages, tools, frameworks) and soft skills
  - If information is not found, use empty string or empty array
  - Return only the JSON object, nothing else
  - Make sure to extract the most relevant job description from the page

  HTML Content to parse:
  ${cleanHTML}`;

  try {
    console.log(
      "Sending HTML to Gemini for parsing...",
      cleanHTML.length,
      "chars",
    );
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    console.log("Gemini response for job parsing:", text.substring(0, 300));

    // Try to extract JSON from response
    let parsed;

    // First, try to parse as direct JSON
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Try to find JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerE) {
          console.error("Failed to parse extracted JSON:", innerE);
          throw new Error("No valid JSON found in response");
        }
      } else {
        throw new Error("No JSON found in response");
      }
    }

    const result_obj: JobDescription = {
      title: (parsed.title || "Unknown Position").trim(),
      company: (parsed.company || "Unknown Company").trim(),
      location: (parsed.location || "").trim(),
      description: (parsed.description || "").trim(),
      requirements: Array.isArray(parsed.requirements)
        ? parsed.requirements
            .filter((r: string) => r && r.trim())
            .map((r: string) => r.trim())
        : [],
      skills: Array.isArray(parsed.skills)
        ? parsed.skills
            .filter((s: string) => s && s.trim())
            .map((s: string) => s.trim())
        : [],
      extractedAt: new Date(),
    };

    console.log(
      "Successfully parsed job description:",
      result_obj.title,
      "at",
      result_obj.company,
    );
    return result_obj;
  } catch (error) {
    console.error("Error parsing job from HTML:", error);

    // Extract text content from HTML as fallback
    const textContent = htmlContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

    console.log(
      "Using fallback text extraction:",
      textContent.substring(0, 100),
    );

    return {
      title: "Job Position",
      company: "Company",
      location: "",
      description: textContent,
      requirements: [],
      skills: [],
      extractedAt: new Date(),
    };
  }
}

export async function analyzeMasterResume(resume: ResumeData): Promise<string> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Analyze this resume and provide a concise summary of key strengths and areas:
  
  Contact: ${resume.contact.name} - ${resume.contact.email}
  Summary: ${resume.summary || "No summary"}
  Skills: ${resume.skills.join(", ")}
  
  Experience:
  ${resume.experience.map((e) => `${e.title} at ${e.company} (${e.startDate} - ${e.endDate || "Present"})`).join("\n")}
  
  Education:
  ${resume.education.map((e) => `${e.degree} in ${e.field} from ${e.institution} (${e.graduationDate})`).join("\n")}
  
  Provide a 2-3 sentence analysis of this candidate's profile.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function extractJobRequirements(
  jobDescription: string,
): Promise<JobDescription> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Extract structured information from this job description. Return JSON with this format:
  {
    "title": "job title",
    "company": "company name",
    "location": "location",
    "requirements": ["requirement 1", "requirement 2", ...],
    "skills": ["skill 1", "skill 2", ...]
  }
  
  Job Description:
  ${jobDescription}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Error parsing job requirements:", e);
  }

  return {
    title: "Unknown Position",
    company: "Unknown Company",
    description: jobDescription,
    requirements: [],
    skills: [],
  };
}

export async function tailorResumeForJob(
  masterResume: ResumeData,
  jobDescription: JobDescription,
): Promise<ResumeData> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const jobSkills =
    jobDescription.skills.join(", ") ||
    jobDescription.description.substring(0, 500);
  const jobRequirements =
    jobDescription.requirements.join(", ") ||
    jobDescription.description.substring(0, 300);

  const prompt = `You are an expert resume optimizer. Tailor this resume to match this specific job posting.

  TARGET JOB:
  - Title: ${jobDescription.title}
  - Company: ${jobDescription.company}
  - Required Skills: ${jobSkills}
  - Requirements: ${jobRequirements}

  ORIGINAL RESUME:
  - Name: ${masterResume.contact.name}
  - Summary: ${masterResume.summary || "Professional with relevant experience"}
  - All Skills: ${masterResume.skills.join(", ")}

  - Experience:
  ${masterResume.experience.map((e, i) => `${i + 1}. ${e.title} at ${e.company} (${e.startDate}${e.endDate ? ` - ${e.endDate}` : ""}): ${e.description.join(" ")}`).join("\n\n")}

  TASK: Create a tailored version that:
  1. Rewrites the professional summary to highlight relevant experience for THIS job
  2. Reorders and rewrites experience bullets to emphasize skills matching the job
  3. Uses keywords from the job description naturally
  4. Maintains ATS-friendly formatting (standard keywords, no special characters)
  5. Keeps achievements and quantifiable results that are relevant

  Return ONLY a valid JSON object (no markdown, no code blocks):
  {
    "tailoredSummary": "2-3 sentence professional summary tailored for this specific job, highlighting most relevant experience",
    "tailoredExperience": [
      {"jobTitle": "job title from original resume", "newBullets": ["tailored bullet point 1", "tailored bullet point 2", "tailored bullet point 3"]},
      {"jobTitle": "another job title", "newBullets": ["bullet 1", "bullet 2"]}
    ],
    "recommendedSkillsOrder": ["most relevant skill 1", "relevant skill 2", "skill 3"]
  }`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    console.log("Tailor response received, length:", text.length);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON in response");
      }
    }

    const tailoredResume: ResumeData = {
      ...masterResume,
      summary: parsed.tailoredSummary || masterResume.summary,
      experience: masterResume.experience.map((exp) => {
        const tailored = parsed.tailoredExperience?.find(
          (t: any) => t.jobTitle?.toLowerCase() === exp.title.toLowerCase(),
        );
        return {
          ...exp,
          description:
            tailored?.newBullets && Array.isArray(tailored.newBullets)
              ? tailored.newBullets
              : exp.description,
        };
      }),
      skills:
        parsed.recommendedSkillsOrder &&
        Array.isArray(parsed.recommendedSkillsOrder)
          ? parsed.recommendedSkillsOrder.filter((s: string) =>
              masterResume.skills.includes(s),
            )
          : masterResume.skills,
    };

    return tailoredResume;
  } catch (error) {
    console.error("Error tailoring resume:", error);
    // Return original resume if tailoring fails
    return masterResume;
  }
}

export async function calculateATSScore(
  resume: ResumeData,
  jobDescription: JobDescription,
): Promise<ATSScore> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const resumeText = [
    resume.contact.name,
    resume.summary || "Professional",
    "Skills: " + resume.skills.join(", "),
    "Experience: " +
      resume.experience
        .map((e) => `${e.title} at ${e.company}: ${e.description.join(" ")}`)
        .join(" | "),
    "Education: " +
      resume.education
        .map((e) => `${e.degree} in ${e.field} from ${e.institution}`)
        .join(" | "),
  ].join("\n");

  const jobText = [
    `Job: ${jobDescription.title} at ${jobDescription.company}`,
    `Skills needed: ${jobDescription.skills.join(", ")}`,
    `Requirements: ${jobDescription.requirements.join(", ")}`,
    `Description: ${jobDescription.description.substring(0, 500)}`,
  ].join("\n");

  const prompt = `Analyze how well this resume matches the job posting for ATS (Applicant Tracking System) screening.

  RESUME:
  ${resumeText}

  JOB POSTING:
  ${jobText}

  Evaluate the match and return ONLY a valid JSON object (no markdown):
  {
    "score": number between 0-100 (how likely ATS will rank it high),
    "matchPercentage": number between 0-100 (percentage of job requirements matched),
    "matchedKeywords": ["keyword matched 1", "keyword matched 2", "keyword matched 3"],
    "missingKeywords": ["important missing keyword 1", "missing keyword 2"],
    "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
  }

  Be honest and practical in your assessment.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    console.log("ATS Score response received, length:", text.length);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON in response");
      }
    }

    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      matchPercentage: Math.min(100, Math.max(0, parsed.matchPercentage || 0)),
      keywordMatches: (Array.isArray(parsed.matchedKeywords)
        ? parsed.matchedKeywords
        : []
      ).filter((k: string) => k && k.trim()),
      missingKeywords: (Array.isArray(parsed.missingKeywords)
        ? parsed.missingKeywords
        : []
      ).filter((k: string) => k && k.trim()),
      improvements: (Array.isArray(parsed.improvements)
        ? parsed.improvements
        : []
      ).filter((i: string) => i && i.trim()),
    };
  } catch (error) {
    console.error("Error calculating ATS score:", error);

    // Fallback: simple keyword matching
    const resumeStr = resumeText.toLowerCase();
    const jobKeywords = [
      ...jobDescription.skills,
      ...jobDescription.requirements,
    ].map((k) => k.toLowerCase());

    const matches = jobKeywords.filter((k) => resumeStr.includes(k));
    const matchPercentage = Math.round(
      (matches.length / jobKeywords.length) * 100,
    );

    return {
      score: Math.max(30, matchPercentage),
      matchPercentage: matchPercentage,
      keywordMatches: matches.slice(0, 5),
      missingKeywords: jobKeywords
        .filter((k) => !resumeStr.includes(k))
        .slice(0, 5),
      improvements: [
        "Add more relevant keywords from the job description",
        "Include specific technical skills mentioned in the job posting",
        "Quantify achievements with metrics and numbers",
      ],
    };
  }
}
