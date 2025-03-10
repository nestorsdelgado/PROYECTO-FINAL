import api from "./axios";

class LeagueService {
    // Get all leagues for the current user
    async getAllLeagues() {
        try {
            const response = await api.get("/api/my-leagues");
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Create a new league
    async createLeague(leagueName) {
        try {
            const response = await api.post("/api/create", { Nombre: leagueName });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Join a league with a code
    async joinLeague(code) {
        try {
            const response = await api.post("/api/join", { code });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Delete a league
    async deleteOneLeague(leagueId) {
        try {
            const response = await api.delete(`/api/leagues/${leagueId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Leave a league (without deleting it)
    async leaveLeague(leagueId) {
        try {
            const response = await api.post(`/api/leave/${leagueId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new LeagueService();