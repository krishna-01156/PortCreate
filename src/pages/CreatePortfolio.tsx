import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Upload, User, GraduationCap, Briefcase, Award, Settings, Github, Linkedin, Building } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAuth } from '../contexts/AuthContext';
import { FormData, Education, Project, WorkExperience } from '../types';


const CreatePortfolio: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addPortfolio, updatePortfolio, getPortfolio, portfolios } = usePortfolio();
  const { user } = useAuth();
  const userKey = user ? `portfolioFormData_${user.id}` : null;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const isEditing = Boolean(id);

  // Suggestions state
  const [suggestions, setSuggestions] = useState({
    skills: [] as string[],
    achievements: [] as string[],
    institutions: [] as string[],
    technologies: [] as string[],
    locations: [] as string[],
    companies: [] as string[]
  });

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    education: [],
    projects: [],
    skills: [],
    achievements: [],
    profilePhoto: '',
    resumeLink: '',
    theme: 'light',
    githubUrl: '',
    linkedinUrl: '',
    workExperience: [],
    technicalSkills: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);
  // Auto-save functionality for new portfolios only
  const saveFormData = useCallback((data: FormData) => {
    if (!isEditing) {
      try {
        const saveData = {
          ...data,
          timestamp: Date.now()
        };
        if (userKey) {
          localStorage.setItem(userKey, JSON.stringify(saveData));
        }
        setAutoSaveStatus('Form data auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }
  }, [isEditing]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (data: FormData) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => saveFormData(data), 1000);
      };
    })(),
    [saveFormData]
  );

  // Load saved form data for new portfolios
  const loadSavedFormData = useCallback(() => {
    if (!isEditing) {
      try {
        if (!userKey) return false;
        const saved = localStorage.getItem(userKey);

        if (saved) {
          const parsedData = JSON.parse(saved);
          // Check if data is less than 24 hours old
          if (parsedData.timestamp && Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000) {
            const { timestamp, ...formDataWithoutTimestamp } = parsedData;
            setFormData(formDataWithoutTimestamp);
            setAutoSaveStatus('Previous form data restored');
            setTimeout(() => setAutoSaveStatus(''), 3000);
            return true;
          } else {
            // Remove expired data
            localStorage.removeItem(userKey);
          }
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
        localStorage.removeItem('portfolioFormData');
      }
    }
    return false;
  }, [isEditing]);

  // Generate suggestions from existing portfolios
  useEffect(() => {
    if (portfolios.length > 0) {
      const allSkills = new Set<string>();
      const allAchievements = new Set<string>();
      const allInstitutions = new Set<string>();
      const allTechnologies = new Set<string>();
      const allLocations = new Set<string>();
      const allCompanies = new Set<string>();

      portfolios.forEach(portfolio => {
        // Collect skills
        portfolio.skills.forEach(skill => allSkills.add(skill));
        portfolio.technicalSkills?.forEach(skill => allSkills.add(skill));

        // Collect achievements
        portfolio.achievements.forEach(achievement => allAchievements.add(achievement));

        // Collect institutions
        portfolio.education.forEach(edu => {
          if (edu.institution) allInstitutions.add(edu.institution);
        });

        // Collect technologies
        portfolio.projects.forEach(project => {
          project.technologies.forEach(tech => allTechnologies.add(tech));
        });

        // Collect companies
        portfolio.workExperience?.forEach(exp => {
          if (exp.company) allCompanies.add(exp.company);
        });

        // Collect locations
        if (portfolio.location) allLocations.add(portfolio.location);
      });

      setSuggestions({
        skills: Array.from(allSkills),
        achievements: Array.from(allAchievements),
        institutions: Array.from(allInstitutions),
        technologies: Array.from(allTechnologies),
        locations: Array.from(allLocations),
        companies: Array.from(allCompanies)
      });
    }
  }, [portfolios]);

  // Pre-fill form with user's most recent data for new portfolios
  useEffect(() => {
    if (!isEditing && portfolios.length > 0 && user) {
      // First try to load saved form data
      const hasSavedData = loadSavedFormData();

      // If no saved data, use most recent portfolio data
      if (!hasSavedData) {
        const mostRecentPortfolio = portfolios[0]; // portfolios are ordered by created_at desc

        setFormData(prev => ({
          ...prev,
          name: mostRecentPortfolio.name || '',
          email: mostRecentPortfolio.email || user.email || '',
          phone: mostRecentPortfolio.phone || '',
          location: mostRecentPortfolio.location || '',
          profilePhoto: mostRecentPortfolio.profilePhoto || '',
          githubUrl: mostRecentPortfolio.githubUrl || '',
          linkedinUrl: mostRecentPortfolio.linkedinUrl || ''
        }));
      }
    } else if (!isEditing) {
      // Load saved data for new portfolios without existing portfolios
      loadSavedFormData();
    }
  }, [isEditing, portfolios, user, loadSavedFormData]);

  // Load existing portfolio data for editing
  useEffect(() => {
    if (isEditing && id) {
      const existingPortfolio = getPortfolio(id);
      if (existingPortfolio) {
        setFormData({
          name: existingPortfolio.name,
          email: existingPortfolio.email,
          phone: existingPortfolio.phone || '',
          location: existingPortfolio.location || '',
          bio: existingPortfolio.bio,
          education: existingPortfolio.education || [],
          projects: existingPortfolio.projects || [],
          skills: existingPortfolio.skills || [],
          achievements: existingPortfolio.achievements || [],
          profilePhoto: existingPortfolio.profilePhoto || '',
          resumeLink: existingPortfolio.resumeLink || '',
          theme: existingPortfolio.theme || 'light',
          // Fix the mapping here - handle both old and new field names
          githubUrl: existingPortfolio.githubUrl || existingPortfolio.github_url || '',
          linkedinUrl: existingPortfolio.linkedinUrl || existingPortfolio.linkedin_url || '',
          workExperience: existingPortfolio.workExperience || existingPortfolio.work_experience || [],
          technicalSkills: existingPortfolio.technicalSkills || existingPortfolio.technical_skills || []
        });
      }
    }
  }, [isEditing, id, getPortfolio]);

  // Auto-save form data when it changes (for new portfolios only)
  useEffect(() => {
    if (!isEditing) { // Only save if there's actual data
      debouncedSave(formData);
    }
  }, [formData, debouncedSave, isEditing]);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: generateUniqueId(),
      degree: '',
      institution: '',
      year: '',
      grade: ''
    };
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      id: generateUniqueId(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ['']
    };
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newExperience]
    }));
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeWorkExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      id: generateUniqueId(),
      title: '',
      description: '',
      technologies: [],
      liveLink: '',
      githubLink: '',
      image: ''
    };
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      )
    }));
  };

  const removeProject = (id: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }));
  };

  const addSkill = (skillToAdd?: string) => {
    const skillInput = document.getElementById('skill-input') as HTMLInputElement;
    const skill = skillToAdd || skillInput.value.trim();

    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      if (!skillToAdd) skillInput.value = '';
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addTechnicalSkill = (skillToAdd?: string) => {
    const skillInput = document.getElementById('technical-skill-input') as HTMLInputElement;
    const skill = skillToAdd || skillInput.value.trim();

    if (skill && !formData.technicalSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        technicalSkills: [...prev.technicalSkills, skill]
      }));
      if (!skillToAdd) skillInput.value = '';
    }
  };

  const removeTechnicalSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = (achievementToAdd?: string) => {
    const achievementInput = document.getElementById('achievement-input') as HTMLInputElement;
    const achievement = achievementToAdd || achievementInput.value.trim();

    if (achievement && !formData.achievements.includes(achievement)) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievement]
      }));
      if (!achievementToAdd) achievementInput.value = '';
    }
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.bio.trim()) {
      setError('Bio is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing && id) {
        // Update existing portfolio
        const portfolioData = {
          ...formData,
          id,
          user_id: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await updatePortfolio(id, portfolioData);
        navigate(`/portfolio/${id}`);
      } else {
        // Create new portfolio
        const portfolioId = `${formData.name.toLowerCase().replace(/\s+/g, '-')}-${generateUniqueId()}`;
        const portfolioData = {
          ...formData,
          id: portfolioId,
          user_id: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await addPortfolio(portfolioData);

        // Clear saved form data on successful submission
        if (userKey) {
          localStorage.removeItem(userKey);
        }


        navigate(`/portfolio/${portfolioId}`);
      }
    } catch (error: any) {
      console.error('Error saving portfolio:', error);

      // Provide more specific error messages
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        setError('Database tables are not set up. Please contact support or check the migration instructions.');
      } else if (error.message?.includes('duplicate key')) {
        setError('A portfolio with this name already exists. Please choose a different name.');
      } else if (error.message?.includes('not authenticated')) {
        setError('You must be logged in to create a portfolio.');
      } else {
        setError(error.message || 'Failed to save portfolio. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Basic validation before moving to next step
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.bio.trim()) {
        setError('Please fill in all required fields (Name, Email, Bio)');
        return;
      }
    }
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const SuggestionChips = ({ suggestions: suggestionList, onSelect, type }: {
    suggestions: string[],
    onSelect: (item: string) => void,
    type: string
  }) => {
    if (suggestionList.length === 0) return null;

    return (
      <div className="mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Suggestions from your previous portfolios:
        </p>
        <div className="flex flex-wrap gap-1">
          {suggestionList.slice(0, 8).map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(item)}
              className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="input-field"
                />
                <SuggestionChips
                  suggestions={suggestions.locations}
                  onSelect={(location) => handleInputChange('location', location)}
                  type="location"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Github className="inline h-4 w-4 mr-1" />
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                  className="input-field"
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Linkedin className="inline h-4 w-4 mr-1" />
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                  className="input-field"
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio / About Me *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="input-field h-32"
                placeholder="Tell us about yourself, your passion, and what you're looking for..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Photo URL
              </label>
              <input
                type="url"
                value={formData.profilePhoto}
                onChange={(e) => handleInputChange('profilePhoto', e.target.value)}
                className="input-field"
                placeholder="https://example.com/your-photo.jpg"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Education</h2>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Education</span>
              </button>
            </div>

            {formData.education.map((edu) => (
              <div key={edu.id} className="card p-6 relative">
                <button
                  type="button"
                  onClick={() => removeEducation(edu.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Degree *
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="input-field"
                      placeholder="Bachelor of Science in Computer Science"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Institution *
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                      className="input-field"
                      placeholder="University Name"
                      required
                    />
                    <SuggestionChips
                      suggestions={suggestions.institutions}
                      onSelect={(institution) => updateEducation(edu.id, 'institution', institution)}
                      type="institution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year *
                    </label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                      className="input-field"
                      placeholder="2020-2024"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grade/GPA
                    </label>
                    <input
                      type="text"
                      value={edu.grade || ''}
                      onChange={(e) => updateEducation(edu.id, 'grade', e.target.value)}
                      className="input-field"
                      placeholder="3.8/4.0"
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.education.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No education entries added yet. Click "Add Education" to get started.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Work Experience</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">(Optional)</span>
              </div>
              <button
                type="button"
                onClick={addWorkExperience}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Experience</span>
              </button>
            </div>

            {formData.workExperience.map((exp) => (
              <div key={exp.id} className="card p-6 relative">
                <button
                  type="button"
                  onClick={() => removeWorkExperience(exp.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                        className="input-field"
                        placeholder="Software Engineer"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                        className="input-field"
                        placeholder="Company Name"
                        required
                      />
                      <SuggestionChips
                        suggestions={suggestions.companies}
                        onSelect={(company) => updateWorkExperience(exp.id, 'company', company)}
                        type="company"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => updateWorkExperience(exp.id, 'location', e.target.value)}
                        className="input-field"
                        placeholder="City, State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <div className="space-y-2">
                        <input
                          type="month"
                          value={exp.endDate}
                          onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                          className="input-field"
                          disabled={exp.current}
                        />
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateWorkExperience(exp.id, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Currently working here</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Job Description (one point per line)
                    </label>
                    <textarea
                      value={exp.description.join('\n')}
                      onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value.split('\n'))}
                      className="input-field h-24"
                      placeholder="• Developed web applications using React and Node.js&#10;• Collaborated with cross-functional teams&#10;• Improved system performance by 30%"
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.workExperience.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No work experience added yet. This section is optional - you can skip it if you don't have work experience.</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Add Project</span>
              </button>
            </div>

            {formData.projects.map((project) => (
              <div key={project.id} className="card p-6 relative">
                <button
                  type="button"
                  onClick={() => removeProject(project.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                      className="input-field"
                      placeholder="My Awesome Project"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={project.description}
                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                      className="input-field h-24"
                      placeholder="Describe what your project does and how you built it..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Technologies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={project.technologies.join(', ')}
                      onChange={(e) => updateProject(project.id, 'technologies', e.target.value.split(', ').filter(Boolean))}
                      className="input-field"
                      placeholder="React, Node.js, MongoDB, TypeScript"
                    />
                    <SuggestionChips
                      suggestions={suggestions.technologies.filter(tech => !project.technologies.includes(tech))}
                      onSelect={(tech) => {
                        const currentTechs = project.technologies;
                        if (!currentTechs.includes(tech)) {
                          updateProject(project.id, 'technologies', [...currentTechs, tech]);
                        }
                      }}
                      type="technology"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        value={project.liveLink || ''}
                        onChange={(e) => updateProject(project.id, 'liveLink', e.target.value)}
                        className="input-field"
                        placeholder="https://your-project.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        value={project.githubLink || ''}
                        onChange={(e) => updateProject(project.id, 'githubLink', e.target.value)}
                        className="input-field"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Image URL
                    </label>
                    <input
                      type="url"
                      value={project.image || ''}
                      onChange={(e) => updateProject(project.id, 'image', e.target.value)}
                      className="input-field"
                      placeholder="https://example.com/project-screenshot.jpg"
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.projects.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No projects added yet. Click "Add Project" to showcase your work.</p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skills & Achievements</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technical Skills (for ATS Resume)
              </label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  id="technical-skill-input"
                  className="input-field"
                  placeholder="Enter a technical skill (e.g., JavaScript, Python, React)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnicalSkill())}
                />
                <button
                  type="button"
                  onClick={() => addTechnicalSkill()}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>

              <SuggestionChips
                suggestions={suggestions.skills.filter(skill => !formData.technicalSkills.includes(skill))}
                onSelect={addTechnicalSkill}
                type="technical-skill"
              />

              <div className="flex flex-wrap gap-2 mt-4">
                {formData.technicalSkills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeTechnicalSkill(index)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Skills
              </label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  id="skill-input"
                  className="input-field"
                  placeholder="Enter a skill (e.g., Leadership, Communication, Design)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={() => addSkill()}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>

              <SuggestionChips
                suggestions={suggestions.skills.filter(skill => !formData.skills.includes(skill))}
                onSelect={addSkill}
                type="skill"
              />

              <div className="flex flex-wrap gap-2 mt-4">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Achievements
              </label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  id="achievement-input"
                  className="input-field"
                  placeholder="Enter an achievement (e.g., Dean's List, Hackathon Winner)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                />
                <button
                  type="button"
                  onClick={() => addAchievement()}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>

              <SuggestionChips
                suggestions={suggestions.achievements.filter(achievement => !formData.achievements.includes(achievement))}
                onSelect={addAchievement}
                type="achievement"
              />

              <div className="flex flex-wrap gap-2 mt-4">
                {formData.achievements.map((achievement, index) => (
                  <span key={index} className="achievement-badge">
                    {achievement}
                    <button
                      type="button"
                      onClick={() => removeAchievement(index)}
                      className="ml-2 text-accent-600 hover:text-accent-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Final Settings</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Portfolio Theme
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={formData.theme === 'light'}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    className="text-primary-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Light</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={formData.theme === 'dark'}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    className="text-primary-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Dark</span>
                </label>
              </div>
            </div>

            <div className="card p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Review Your Information
              </h3>
              <p className="text-primary-700 dark:text-primary-300 mb-4">
                Please review all your information before {isEditing ? 'updating' : 'creating'} your portfolio. You can always edit it later from your dashboard.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>GitHub:</strong> {formData.githubUrl || 'Not provided'}</p>
                <p><strong>LinkedIn:</strong> {formData.linkedinUrl || 'Not provided'}</p>
                <p><strong>Education Entries:</strong> {formData.education.length}</p>
                <p><strong>Work Experience:</strong> {formData.workExperience.length}</p>
                <p><strong>Projects:</strong> {formData.projects.length}</p>
                <p><strong>Technical Skills:</strong> {formData.technicalSkills.length}</p>
                <p><strong>General Skills:</strong> {formData.skills.length}</p>
                <p><strong>Achievements:</strong> {formData.achievements.length}</p>
              </div>
            </div>

            <div className="card p-6 bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800">
              <h3 className="text-lg font-semibold text-accent-900 dark:text-accent-100 mb-2">
                📄 ATS-Friendly Resume Generation
              </h3>
              <p className="text-accent-700 dark:text-accent-300">
                Your portfolio will automatically generate a professional, ATS-friendly resume in .docx format that you can download and edit. The resume will include your GitHub and LinkedIn links as clickable elements in the header.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditing ? 'Edit Portfolio' : 'Create Your Portfolio'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Step {currentStep} of 6: Fill out your information to {isEditing ? 'update' : 'create'} a stunning portfolio with ATS-friendly resume
          </p>
          {autoSaveStatus && !isEditing && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✓ {autoSaveStatus}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                }`}
            >
              Previous
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Portfolio' : 'Create Portfolio')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePortfolio;