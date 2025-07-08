import React, { createContext, useContext, useState, useEffect } from 'react';
import { Portfolio } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface PortfolioContextType {
  portfolios: Portfolio[];
  loading: boolean;
  addPortfolio: (portfolio: Portfolio) => Promise<void>;
  updatePortfolio: (id: string, portfolio: Portfolio) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  getPortfolio: (id: string) => Portfolio | undefined;
  fetchPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPortfolios = async () => {
    if (!user) {
      setPortfolios([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolios:', error);
        // Don't throw error, just log it and set empty array
        setPortfolios([]);
      } else {
        // Map database fields to frontend fields
        const mappedPortfolios = (data || []).map(portfolio => ({
          ...portfolio,
          // Map database snake_case to camelCase
          githubUrl: portfolio.github_url || portfolio.githubUrl || '',
          linkedinUrl: portfolio.linkedin_url || portfolio.linkedinUrl || '',
          workExperience: portfolio.work_experience || portfolio.workExperience || [],
          technicalSkills: portfolio.technical_skills || portfolio.technicalSkills || [],
          profilePhoto: portfolio.profile_photo || portfolio.profilePhoto || '',
          resumeLink: portfolio.resume_link || portfolio.resumeLink || '',
          createdAt: portfolio.created_at || portfolio.createdAt,
          updatedAt: portfolio.updated_at || portfolio.updatedAt
        }));
        setPortfolios(mappedPortfolios);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    } else {
      setPortfolios([]);
    }
  }, [user]);

  const ensureUserProfile = async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              email: user.email || '',
              created_at: new Date().toISOString(),
            }
          ]);

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          throw insertError;
        }
      } else if (fetchError) {
        console.error('Error checking user profile:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  };

  const addPortfolio = async (portfolio: Portfolio) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Ensure user profile exists first
      await ensureUserProfile();

      const portfolioData = {
        id: portfolio.id,
        user_id: user.id,
        name: portfolio.name,
        email: portfolio.email,
        phone: portfolio.phone || '',
        location: portfolio.location || '',
        bio: portfolio.bio,
        education: portfolio.education || [],
        projects: portfolio.projects || [],
        skills: portfolio.skills || [],
        achievements: portfolio.achievements || [],
        profile_photo: portfolio.profilePhoto || '',
        resume_link: portfolio.resumeLink || '',
        theme: portfolio.theme || 'light',
        github_url: portfolio.githubUrl || '',
        linkedin_url: portfolio.linkedinUrl || '',
        work_experience: portfolio.workExperience || [],
        technical_skills: portfolio.technicalSkills || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('portfolios')
        .insert([portfolioData]);

      if (error) {
        console.error('Error adding portfolio:', error);
        throw error;
      }
      
      await fetchPortfolios();
    } catch (error) {
      console.error('Error adding portfolio:', error);
      throw error;
    }
  };

  const updatePortfolio = async (id: string, updatedPortfolio: Portfolio) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const portfolioData = {
        name: updatedPortfolio.name,
        email: updatedPortfolio.email,
        phone: updatedPortfolio.phone || '',
        location: updatedPortfolio.location || '',
        bio: updatedPortfolio.bio,
        education: updatedPortfolio.education || [],
        projects: updatedPortfolio.projects || [],
        skills: updatedPortfolio.skills || [],
        achievements: updatedPortfolio.achievements || [],
        profile_photo: updatedPortfolio.profilePhoto || '',
        resume_link: updatedPortfolio.resumeLink || '',
        theme: updatedPortfolio.theme || 'light',
        github_url: updatedPortfolio.githubUrl || '',
        linkedin_url: updatedPortfolio.linkedinUrl || '',
        work_experience: updatedPortfolio.workExperience || [],
        technical_skills: updatedPortfolio.technicalSkills || [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('portfolios')
        .update(portfolioData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating portfolio:', error);
        throw error;
      }
      
      await fetchPortfolios();
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  };

  const deletePortfolio = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting portfolio:', error);
        throw error;
      }
      
      await fetchPortfolios();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      throw error;
    }
  };

  const getPortfolio = (id: string) => {
    return portfolios.find(portfolio => portfolio.id === id);
  };

  return (
    <PortfolioContext.Provider value={{
      portfolios,
      loading,
      addPortfolio,
      updatePortfolio,
      deletePortfolio,
      getPortfolio,
      fetchPortfolios
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};