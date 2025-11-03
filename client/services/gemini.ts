import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResumeData, JobDescription, ATSScore } from "@/types";

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || "";

let client: GoogleGenerativeAI | null = null;

function initGemini(): GoogleGenerativeAI {
  if (client) return client;
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Set VITE_GOOGLE_GEMINI_API_KEY in .env");
  }
  client = new GoogleGenerativeAI(GEMINI_API_KEY);
  return client;
}

export async function analyzeMasterResume(resume: ResumeData): Promise<string> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Analyze this resume and provide a concise summary of key strengths and areas:
  
  Contact: ${resume.contact.name} - ${resume.contact.email}
  Summary: ${resume.summary || "No summary"}
  Skills: ${resume.skills.join(", ")}
  
  Experience:
  ${resume.experience.map(e => `${e.title} at ${e.company} (${e.startDate} - ${e.endDate || "Present"})`).join("\n")}
  
  Education:
  ${resume.education.map(e => `${e.degree} in ${e.field} from ${e.institution} (${e.graduationDate})`).join("\n")}
  
  Provide a 2-3 sentence analysis of this candidate's profile.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function extractJobRequirements(jobDescription: string): Promise<JobDescription> {
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
  jobDescription: JobDescription
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
  ${masterResume.experience.map(e => `${e.title} at ${e.company}: ${e.description.join(" ")}`).join("\n\n")}
  
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
            (t: any) => t.originalTitle === exp.title
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
  jobDescription: JobDescription
): Promise<ATSScore> {
  const genAI = initGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const resumeText = [
    resume.contact.name,
    resume.summary,
    resume.skills.join(" "),
    resume.experience.map(e => `${e.title} ${e.company} ${e.description.join(" ")}`).join(" "),
    resume.education.map(e => `${e.degree} ${e.field} ${e.institution}`).join(" "),
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
