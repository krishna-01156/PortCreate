export interface Portfolio {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  education: Education[];
  projects: Project[];
  skills: string[];
  achievements: string[];
  profilePhoto: string;
  resumeLink: string;
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
  githubUrl?: string;
  linkedinUrl?: string;
  workExperience?: WorkExperience[];
  technicalSkills?: string[];
  // Database field mappings (for backward compatibility)
  github_url?: string;
  linkedin_url?: string;
  work_experience?: WorkExperience[];
  technical_skills?: string[];
  profile_photo?: string;
  resume_link?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  grade?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  liveLink?: string;
  githubLink?: string;
  image?: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  education: Education[];
  projects: Project[];
  skills: string[];
  achievements: string[];
  profilePhoto: string;
  resumeLink: string;
  theme: 'light' | 'dark';
  githubUrl: string;
  linkedinUrl: string;
  workExperience: WorkExperience[];
  technicalSkills: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}