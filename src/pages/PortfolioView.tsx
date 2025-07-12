import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Download, 
  ExternalLink, 
  Github, 
  Calendar,
  Award,
  GraduationCap,
  Briefcase,
  Moon,
  Sun,
  Linkedin,
  Building
} from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Portfolio } from '../types';
import { generatePortfolioPDF } from '../utils/pdfGenerator';
import { generateATSResume } from '../utils/resumeGenerator';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';


const PortfolioView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getPortfolio } = usePortfolio();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();


  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // First try to get from context (for authenticated users)
      const contextPortfolio = getPortfolio(id);
      if (contextPortfolio) {
        setPortfolio(contextPortfolio);
        
        // Apply theme to document
        if (contextPortfolio.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setLoading(false);
        return;
      }

      // If not found in context, fetch from database (for public access)
      try {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching portfolio:', error);
          setPortfolio(null);
        } else {
          setPortfolio(data);
          
          // Apply theme to document
          if (data.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setPortfolio(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [id, getPortfolio]);

  const handleDownloadPortfolio = async () => {
    if (!portfolio) return;
    
    setIsGeneratingPDF(true);
    try {
      await generatePortfolioPDF(portfolio, 'portfolio-content');
    } catch (error) {
      console.error('Error generating portfolio PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadATSResume = async () => {
    if (!portfolio) return;
    
    try {
      await generateATSResume(portfolio);
    } catch (error) {
      console.error('Error generating ATS resume:', error);
      alert('Error generating ATS resume. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Portfolio Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The portfolio you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Action Buttons */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-gray-600" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </button>
        
        <button
          onClick={handleDownloadPortfolio}
          disabled={isGeneratingPDF}
          className="p-3 rounded-full bg-primary-600 text-white shadow-lg hover:shadow-xl hover:bg-primary-700 transition-all duration-200 disabled:opacity-50"
          title="Download Portfolio as PDF"
        >
          <Download className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleDownloadATSResume}
          className="p-3 rounded-full bg-success-600 text-white shadow-lg hover:shadow-xl hover:bg-success-700 transition-all duration-200"
          title="Download ATS-Friendly Resume (.docx)"
        >
          <Award className="h-5 w-5" />
        </button>
      </div>

      <div id="portfolio-content">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-accent-600 text-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              <div className="flex-shrink-0">
                {(portfolio.profilePhoto || portfolio.profile_photo) ? (
                  <img
                    src={portfolio.profilePhoto || portfolio.profile_photo}
                    alt={portfolio.name}
                    className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white">
                      {portfolio.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  {portfolio.name}
                </h1>
                <p className="text-xl lg:text-2xl text-primary-100 mb-6">
                  {portfolio.bio}
                </p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                  {portfolio.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>{portfolio.email}</span>
                    </div>
                  )}
                  {portfolio.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-5 w-5" />
                      <span>{portfolio.phone}</span>
                    </div>
                  )}
                  {portfolio.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>{portfolio.location}</span>
                    </div>
                  )}
                </div>

                {/* GitHub and LinkedIn Links */}
                {(portfolio.githubUrl || portfolio.linkedinUrl) && (
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                    {portfolio.githubUrl && (
                      <a
                        href={portfolio.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                      >
                        <Github className="h-5 w-5" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {portfolio.linkedinUrl && (
                      <a
                        href={portfolio.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  {portfolio.resumeLink && (
                    <a
                      href={portfolio.resumeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      <span>View Resume</span>
                    </a>
                  )}
                  
                  <button
                    onClick={handleDownloadATSResume}
                    className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    <Award className="h-5 w-5" />
                    <span>Download ATS Resume</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Education Section */}
          {portfolio.education.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center space-x-2 mb-8">
                <GraduationCap className="h-8 w-8 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Education</h2>
              </div>
              
              <div className="space-y-6">
                {portfolio.education.map((edu) => (
                  <div key={edu.id} className="card p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {edu.degree}
                    </h3>
                    <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                      {edu.institution}
                    </p>
                    <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{edu.year}</span>
                      </div>
                      {edu.grade && (
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4" />
                          <span>{edu.grade}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Work Experience Section */}
          {portfolio.workExperience && portfolio.workExperience.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center space-x-2 mb-8">
                <Building className="h-8 w-8 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Work Experience</h2>
              </div>
              
              <div className="space-y-6">
                {portfolio.workExperience.map((exp) => (
                  <div key={exp.id} className="card p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {exp.title}
                    </h3>
                    <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                      {exp.company} • {exp.location}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    <ul className="space-y-2">
                      {exp.description.map((desc, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start">
                          <span className="text-primary-600 mr-2">•</span>
                          {desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects Section */}
          {portfolio.projects.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center space-x-2 mb-8">
                <Briefcase className="h-8 w-8 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {portfolio.projects.map((project) => (
                  <div key={project.id} className="card p-6 hover:shadow-xl transition-shadow">
                    {project.image && (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {project.description}
                    </p>
                    
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.map((tech, index) => (
                          <span key={index} className="skill-badge text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-4">
                      {project.liveLink && (
                        <a
                          href={project.liveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Live Demo</span>
                        </a>
                      )}
                      {project.githubLink && (
                        <a
                          href={project.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                        >
                          <Github className="h-4 w-4" />
                          <span>Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Technical Skills Section */}
          {portfolio.technicalSkills && portfolio.technicalSkills.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Technical Skills</h2>
              <div className="flex flex-wrap gap-3">
                {portfolio.technicalSkills.map((skill, index) => (
                  <span key={index} className="skill-badge text-lg px-4 py-2">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* General Skills Section */}
          {portfolio.skills.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Skills</h2>
              <div className="flex flex-wrap gap-3">
                {portfolio.skills.map((skill, index) => (
                  <span key={index} className="skill-badge text-lg px-4 py-2">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Achievements Section */}
          {portfolio.achievements.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Achievements</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {portfolio.achievements.map((achievement, index) => (
                  <div key={index} className="card p-4 flex items-center space-x-3">
                    <Award className="h-6 w-6 text-accent-600 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-white">{achievement}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioView;