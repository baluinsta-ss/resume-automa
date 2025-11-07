import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeData, JobDescription, ATSScore } from "@/types";

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || "";

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

  HTML Content to parse:
  ${cleanHTML}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    console.log("Gemini response for job parsing:", text.substring(0, 200));

    // Try to extract JSON from response
    let parsed;

    // First, try to parse as direct JSON
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Try to find JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    }

    return {
      title: (parsed.title || "Unknown Position").trim(),
      company: (parsed.company || "Unknown Company").trim(),
      location: (parsed.location || "").trim(),
      description: (parsed.description || "").trim(),
      requirements: Array.isArray(parsed.requirements)
        ? parsed.requirements.filter((r: string) => r && r.trim()).map((r: string) => r.trim())
        : [],
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s: string) => s && s.trim()).map((s: string) => s.trim())
        : [],
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error("Error parsing job from HTML:", error);

    // Extract text content from HTML as fallback
    const textContent = htmlContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

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
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `You are an expert resume optimizer. Tailor this resume for this specific job.
  
  Job Title: ${jobDescription.title}
  Company: ${jobDescription.company}
  Required Skills: ${jobDescription.skills.join(", ")}
  
  Original Resume:
  Name: ${masterResume.contact.name}
  Summary: ${masterResume.summary || "No summary"}
  Skills: ${masterResume.skills.join(", ")}
  
  Experience:
  ${masterResume.experience.map((e) => `${e.title} at ${e.company}: ${e.description.join(" ")}`).join("\n\n")}
  
  Provide a tailored summary and rewritten experience descriptions that:
  1. Highlight relevant skills matching the job
  2. Use keywords from the job description
  3. Emphasize achievements matching job requirements
  4. Optimize for ATS (use standard formatting, keywords naturally)
  
  Return JSON with this format:
  {
    "tailoredSummary": "tailored 2-3 sentence summary",
    "tailoredExperience": [
      {"originalTitle": "Original Job Title", "newDescription": ["tailored bullet 1", "tailored bullet 2", ...]}
    ],
    "keywordMatches": ["matching skill 1", "matching skill 2", ...]
  }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      const tailoredResume: ResumeData = {
        ...masterResume,
        summary: parsed.tailoredSummary || masterResume.summary,
        experience: masterResume.experience.map((exp, idx) => {
          const tailored = parsed.tailoredExperience?.find(
            (t: any) => t.originalTitle === exp.title,
          );
          return {
            ...exp,
            description: tailored?.newDescription || exp.description,
          };
        }),
      };

      return tailoredResume;
    }
  } catch (e) {
    console.error("Error tailoring resume:", e);
  }

  return masterResume;
}

export async function calculateATSScore(
  resume: ResumeData,
  jobDescription: JobDescription,
): Promise<ATSScore> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const resumeText = [
    resume.contact.name,
    resume.summary,
    resume.skills.join(" "),
    resume.experience
      .map((e) => `${e.title} ${e.company} ${e.description.join(" ")}`)
      .join(" "),
    resume.education
      .map((e) => `${e.degree} ${e.field} ${e.institution}`)
      .join(" "),
  ].join(" ");

  const prompt = `Analyze this resume against a job description for ATS (Applicant Tracking System) compatibility.
  
  Resume: ${resumeText}
  
  Job Requirements: ${jobDescription.requirements.join(", ")}
  Required Skills: ${jobDescription.skills.join(", ")}
  
  Provide a JSON response with:
  {
    "score": number (0-100),
    "matchPercentage": number (0-100),
    "matchedKeywords": ["keyword1", "keyword2", ...],
    "missingKeywords": ["keyword1", "keyword2", ...],
    "improvements": ["improvement 1", "improvement 2", ...]
  }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 0,
        matchPercentage: parsed.matchPercentage || 0,
        keywordMatches: parsed.matchedKeywords || [],
        missingKeywords: parsed.missingKeywords || [],
        improvements: parsed.improvements || [],
      };
    }
  } catch (e) {
    console.error("Error calculating ATS score:", e);
  }

  return {
    score: 0,
    matchPercentage: 0,
    keywordMatches: [],
    missingKeywords: [],
    improvements: [],
  };
}
