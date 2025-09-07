import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { boardService } from '../services/boardService';
import Navbar from '../components/Navbar';

const BoardInvite = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boardInfo, setBoardInfo] = useState(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchBoardInfo = async () => {
      try {
        const response = await boardService.getBoardByInvite(boardId);
        setBoardInfo(response.board);
      } catch (error) {
        console.error('Error fetching board info:', error);
        setError(error.message || 'Board not found or invite link is invalid');
      } finally {
        setLoading(false);
      }
    };

    if (boardId) {
      fetchBoardInfo();
    }
  }, [boardId]);

  const handleJoinBoard = async () => {
    try {
      setJoining(true);
      await boardService.joinBoardViaInvite(boardId);
      // Navigate to the board using boardId (UUID)
      navigate(`/board/${boardId}`);
    } catch (error) {
      console.error('Error joining board:', error);
      setError(error.message || 'Failed to join board');
    } finally {
      setJoining(false);
    }
  };

  const handleAnonymousAccess = () => {
    // Navigate directly to the board for anonymous access using boardId (UUID)
    navigate(`/board/${boardId}?anonymous=true`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading board information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invite Link</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Board</h2>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{boardInfo?.title}</h3>
            {boardInfo?.description && (
              <p className="text-gray-600 mb-4">{boardInfo.description}</p>
            )}
            <p className="text-sm text-gray-500">
              Created by {boardInfo?.owner?.name || 'Unknown'}
            </p>
          </div>

          <div className="space-y-4">
            {isAuthenticated ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Signed in as <strong>{user?.name}</strong>
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleJoinBoard}
                  disabled={joining}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {joining ? 'Joining...' : 'Join Board'}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/login', { state: { from: `/invite/${boardId}` } })}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Sign In to Join
                  </button>
                  <button
                    onClick={() => navigate('/signup', { state: { from: `/invite/${boardId}` } })}
                    className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Create Account
                  </button>
                  {boardInfo?.allowAnonymous && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                      </div>
                      <button
                        onClick={handleAnonymousAccess}
                        className="w-full bg-gray-50 text-gray-700 py-3 rounded-lg hover:bg-gray-100 font-medium border border-gray-300"
                      >
                        Continue as Guest
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This board is shared with you via an invite link. You can collaborate in real-time with other users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardInvite;
