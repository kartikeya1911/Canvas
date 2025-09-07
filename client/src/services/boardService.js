import api from './api';

export const boardService = {
  // Get all boards for user
  getBoards: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/boards?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get specific board
  getBoard: async (boardId) => {
    try {
      const response = await api.get(`/boards/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new board
  createBoard: async (boardData) => {
    try {
      const response = await api.post('/boards', boardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update board
  updateBoard: async (boardId, boardData) => {
    try {
      const response = await api.put(`/boards/${boardId}`, boardData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete board
  deleteBoard: async (boardId) => {
    try {
      const response = await api.delete(`/boards/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Add collaborator
  addCollaborator: async (boardId, email, role = 'editor') => {
    try {
      const response = await api.post(`/boards/${boardId}/collaborators`, { email, role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Remove collaborator
  removeCollaborator: async (boardId, userId) => {
    try {
      const response = await api.delete(`/boards/${boardId}/collaborators/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Generate invite link
  generateInviteLink: async (boardId, settings = {}) => {
    try {
      const response = await api.post(`/boards/${boardId}/invite`, settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get board by invite
  getBoardByInvite: async (boardId) => {
    try {
      const response = await api.get(`/boards/invite/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Join board via invite
  joinBoardViaInvite: async (boardId) => {
    try {
      const response = await api.post(`/boards/join/${boardId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
