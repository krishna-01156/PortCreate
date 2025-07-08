import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Eye, Trash2, Plus, Calendar, User } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';

const Dashboard: React.FC = () => {
  const { portfolios, deletePortfolio } = usePortfolio();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}'s portfolio? This action cannot be undone.`)) {
      deletePortfolio(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Portfolio Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your portfolios and track their performance
            </p>
          </div>
          
          <Link
            to="/create"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Portfolio</span>
          </Link>
        </div>

        {portfolios.length === 0 ? (
          <div className="text-center py-16">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Portfolios Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              You haven't created any portfolios yet. Start building your professional presence by creating your first portfolio.
            </p>
            <Link
              to="/create"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Portfolio</span>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <div key={portfolio.id} className="card p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  {(portfolio.profilePhoto || portfolio.profile_photo) ? (
                    <img
                      src={portfolio.profilePhoto || portfolio.profile_photo}
                      alt={portfolio.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {portfolio.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {portfolio.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {portfolio.email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {portfolio.projects.length} projects
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {portfolio.skills.length} skills
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    to={`/portfolio/${portfolio.id}`}
                    className="flex-1 btn-secondary text-center inline-flex items-center justify-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Link>
                  
                  <Link
                    to={`/edit/${portfolio.id}`}
                    className="flex-1 btn-primary text-center inline-flex items-center justify-center space-x-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(portfolio.id, portfolio.name)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;