export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyWorking?: boolean;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface Project {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  date?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects?: Project[];
  certifications?: string[];
}

export interface JobDescription {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  skills: string[];
  url?: string;
  extractedAt?: Date;
}

export interface ApplicationRecord {
  _id?: string;
  userId: string;
  jobTitle: string;
  company: string;
  jobUrl?: string;
  jobDescription: JobDescription;
  originalResume: ResumeData;
  tailoredResume: ResumeData;
  atsScore: number;
  matchPercentage: number;
  appliedDate: Date;
  status: 'applied' | 'interview' | 'rejected' | 'offer';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id?: string;
  email: string;
  masterResume?: ResumeData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DemoResponse {
  message: string;
}
