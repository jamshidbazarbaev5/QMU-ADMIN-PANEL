import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/api'
import { PageHeader } from '../helpers/PageHeader';

export function ChangePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/posts'), 2000);
    } catch (error: any) {
      setError(error.detail || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Change Password"
        createButtonLabel="Back to Posts"
        onCreateClick={() => navigate('/karsu-admin-panel/posts')}
      />

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-center p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-center p-3 rounded-lg text-sm">
              Password updated successfully! Redirecting...
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent transition-all duration-200 ease-in-out"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent transition-all duration-200 ease-in-out"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border-0 rounded-lg text-sm font-medium text-white bg-[#6C5DD3] hover:bg-[#5b4eb8] focus:ring-2 focus:ring-[#6C5DD3] focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}