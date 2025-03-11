import api from "./axios";

class PlayerService {
    // Get all players
    async getAllPlayers() {
        try {
            const response = await api.get("/api/players");
            return response.data;
        } catch (error) {
            console.error("Error fetching players:", error);
            throw error;
        }
    }

    // Get players by team
    async getPlayersByTeam(teamId) {
        try {
            const response = await api.get(`/api/players/team/${teamId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching players by team:", error);
            throw error;
        }
    }

    // Get players by position
    async getPlayersByPosition(position) {
        try {
            const response = await api.get(`/api/players/position/${position}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching players by position:", error);
            throw error;
        }
    }

    // Buy a player
    async buyPlayer(playerId, leagueId) {
        try {
            const response = await api.post("/api/players/buy", {
                playerId,
                leagueId
            });
            return response.data;
        } catch (error) {
            console.error("Error buying player:", error);
            throw error;
        }
    }

    // Get user's players in a specific league
    async getUserPlayers(leagueId) {
        try {
            const response = await api.get(`/api/players/user/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user players:", error);
            throw error;
        }
    }

    // Get teams for filtering
    async getTeams() {
        try {
            const response = await api.get("/api/teams");
            // Transform response to format expected by UI
            const formattedTeams = response.data.map(team => ({
                id: team.code,
                name: team.name
            }));
            return formattedTeams;
        } catch (error) {
            console.error("Error fetching teams:", error);
            throw error;
        }
    }

    // New functions for team management

    // Get user's financial data in a league
    async getUserLeagueData(leagueId) {
        try {
            const response = await api.get(`/api/user-league/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user league data:", error);
            throw error;
        }
    }

    // Set player as starter
    async setPlayerAsStarter(playerId, leagueId, position, matchday = 1) {
        try {
            const response = await api.post("/api/players/lineup", {
                playerId,
                leagueId,
                position,
                matchday
            });
            return response.data;
        } catch (error) {
            console.error("Error setting player as starter:", error);
            throw error;
        }
    }

    // Get current lineup
    async getCurrentLineup(leagueId, matchday = 1) {
        try {
            const response = await api.get(`/api/players/lineup/${leagueId}/${matchday}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching current lineup:", error);
            throw error;
        }
    }

    // Sell player to market
    async sellPlayerToMarket(playerId, leagueId) {
        try {
            const response = await api.post("/api/players/sell/market", {
                playerId,
                leagueId
            });
            return response.data;
        } catch (error) {
            console.error("Error selling player to market:", error);
            throw error;
        }
    }

    // Create offer to another user
    async createPlayerOffer(playerId, leagueId, targetUserId, price) {
        try {
            const response = await api.post("/api/players/sell/offer", {
                playerId,
                leagueId,
                targetUserId,
                price
            });
            return response.data;
        } catch (error) {
            console.error("Error creating player offer:", error);
            throw error;
        }
    }

    // Get pending offers
    async getPendingOffers(leagueId) {
        try {
            const response = await api.get(`/api/players/offers/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching pending offers:", error);
            throw error;
        }
    }

    // Accept offer
    async acceptOffer(offerId) {
        try {
            const response = await api.post(`/api/players/offer/accept/${offerId}`);
            return response.data;
        } catch (error) {
            console.error("Error accepting offer:", error);
            throw error;
        }
    }

    // Reject offer
    async rejectOffer(offerId) {
        try {
            const response = await api.post(`/api/players/offer/reject/${offerId}`);
            return response.data;
        } catch (error) {
            console.error("Error rejecting offer:", error);
            throw error;
        }
    }

    // Get users in a league
    async getLeagueUsers(leagueId) {
        try {
            const response = await api.get(`/api/league-users/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching league users:", error);
            throw error;
        }
    }
}

export default new PlayerService();