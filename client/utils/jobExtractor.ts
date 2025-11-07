import { JobDescription } from "@/types";

export function extractJobDescriptionFromDOM(): JobDescription | null {
  // LinkedIn job description
  const linkedInTitle = document.querySelector("h2.show-more-less-html__title");
  const linkedInCompany = document.querySelector('a[href*="company"]');
  const linkedInDescription = document.querySelector(
    ".show-more-less-html__markup",
  );

  if (linkedInTitle && linkedInDescription) {
    return {
      title: linkedInTitle.textContent || "Unknown",
      company: linkedInCompany?.textContent || "Unknown",
      description: linkedInDescription.textContent || "",
      requirements: extractRequirements(linkedInDescription.textContent || ""),
      skills: extractSkills(linkedInDescription.textContent || ""),
      extractedAt: new Date(),
    };
  }

  // Indeed job description
  const indeedTitle = document.querySelector(
    "h1.jobsearch-JobInfoHeader-title",
  );
  const indeedCompany = document.querySelector("a[data-testid='company-name']");
  const indeedDescription = document.querySelector("[id='jobDescriptionText']");

  if (indeedTitle && indeedDescription) {
    return {
      title: indeedTitle.textContent || "Unknown",
      company: indeedCompany?.textContent || "Unknown",
      description: indeedDescription.textContent || "",
      requirements: extractRequirements(indeedDescription.textContent || ""),
      skills: extractSkills(indeedDescription.textContent || ""),
      extractedAt: new Date(),
    };
  }

  // Naukri job description
  const naukriTitle = document.querySelector(".jd-header .naukri-text");
  const naukriDescription = document.querySelector(".job-desc");

  if (naukriTitle && naukriDescription) {
    return {
      title: naukriTitle.textContent || "Unknown",
      company: "Unknown",
      description: naukriDescription.textContent || "",
      requirements: extractRequirements(naukriDescription.textContent || ""),
      skills: extractSkills(naukriDescription.textContent || ""),
      extractedAt: new Date(),
    };
  }

  // Glassdoor job description
  const glassdoorTitle = document.querySelector('[data-test="jobTitle"]');
  const glassdoorCompany = document.querySelector('[data-test="companyName"]');
  const glassdoorDescription = document.querySelector(
    '[data-test="JobDescription"]',
  );

  if (glassdoorTitle && glassdoorDescription) {
    return {
      title: glassdoorTitle.textContent || "Unknown",
      company: glassdoorCompany?.textContent || "Unknown",
      description: glassdoorDescription.textContent || "",
      requirements: extractRequirements(glassdoorDescription.textContent || ""),
      skills: extractSkills(glassdoorDescription.textContent || ""),
      extractedAt: new Date(),
    };
  }

  return null;
}

export function extractRequirements(text: string): string[] {
  const requirements: string[] = [];

  const requirementsSection = text.match(
    /(?:requirement|skill|qualification|must have|should have)[\s\S]*?(?:nice to have|about|$)/i,
  );

  if (requirementsSection) {
    const bullets = requirementsSection[0].match(/[•\-*]\s+([^\n]+)/g) || [];
    bullets.forEach((bullet) => {
      const cleaned = bullet.replace(/^[•\-*]\s+/, "").trim();
      if (cleaned.length > 5) {
        requirements.push(cleaned);
      }
    });
  }

  return requirements;
}

export function extractSkills(text: string): string[] {
  const commonSkills = [
    "javascript",
    "typescript",
    "python",
    "java",
    "react",
    "vue",
    "angular",
    "node",
    "express",
    "mongodb",
    "postgres",
    "sql",
    "html",
    "css",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "git",
    "rest api",
    "graphql",
    "agile",
    "scrum",
    "jira",
    "jenkins",
    "linux",
    "unix",
    "bash",
    "shell",
    "c++",
    "c#",
    "golang",
    "rust",
    "scala",
    "r",
    "matlab",
    "excel",
    "powerpoint",
    "word",
    "salesforce",
    "sap",
    "oracle",
    "tableau",
    "power bi",
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "spark",
    "hadoop",
    "kafka",
    "rabbitmq",
    "redis",
    "elasticsearch",
    "mysql",
    "cassandra",
    "dynamodb",
    "firebase",
    "iot",
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "data science",
    "data analysis",
    "big data",
    "etl",
    "api design",
    "microservices",
    "serverless",
    "ci/cd",
    "devops",
    "security",
    "encryption",
    "oauth",
    "jwt",
    "testing",
    "unit testing",
    "integration testing",
    "performance testing",
    "load testing",
  ];

  const lowerText = text.toLowerCase();
  const foundSkills = new Set<string>();

  commonSkills.forEach((skill) => {
    if (lowerText.includes(skill)) {
      foundSkills.add(skill);
    }
  });

  // Extract years of experience
  const yearsMatch = text.match(/(\d+)\+?\s*years?/gi);
  if (yearsMatch) {
    foundSkills.add(yearsMatch[0]);
  }

  return Array.from(foundSkills);
}

export function createJobExtractionButton(): HTMLElement {
  const button = document.createElement("button");
  button.id = "resumematch-extract-btn";
  button.textContent = "Analyse";
  button.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    z-index: 10000;
    transition: all 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  button.onmouseover = () => {
    button.style.transform = "translateY(-2px)";
    button.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.6)";
  };

  button.onmouseout = () => {
    button.style.transform = "translateY(0)";
    button.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
  };

  return button;
}
