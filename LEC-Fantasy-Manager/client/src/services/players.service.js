import api from "./axios";

const normalizePlayerData = (player) => {
    if (!player) return null;

    return {
        ...player, // Mantener todas las propiedades originales
        id: player.id || '',
        name: player.name || '',
        summonerName: player.summonerName || player.name || '',
        role: player.role?.toLowerCase() || player.position || '',
        team: player.team || '',
        teamName: player.teamName || player.team || '',
        // Normalizar las URLs de imágenes
        imageUrl: player.imageUrl || player.image || player.profilePhotoUrl ||
            'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ryze_0.jpg',
        price: player.price || 5,
    };
};

class PlayerService {

    // Get all players
    async getAllPlayers() {
        try {
            const response = await api.get("/api/players");
            // Normalizar cada jugador para asegurar coherencia
            return Array.isArray(response.data)
                ? response.data.map(normalizePlayerData).filter(Boolean)
                : [];
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

    // Método auxiliar para obtener un jugador por ID
    async getPlayerById(playerId) {
        try {
            const allPlayers = await this.getAllPlayers();
            const player = allPlayers.find(p => p.id === playerId);
            return player ? normalizePlayerData(player) : null;
        } catch (error) {
            console.error("Error fetching player by ID:", error);
            return null;
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
            // Primero obtener la información del jugador para conocer su posición original
            const allPlayers = await this.getAllPlayers();
            const playerInfo = allPlayers.find(p => p.id === playerId);

            if (!playerInfo) {
                throw new Error("No se pudo encontrar información del jugador");
            }

            // Enviar la posición junto con el ID al servidor
            const response = await api.post("/api/players/buy", {
                playerId,
                leagueId,
                position: playerInfo.role // Enviar la posición correcta desde la tienda
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
            // Normalizar cada jugador para asegurar coherencia
            return Array.isArray(response.data)
                ? response.data.map(normalizePlayerData).filter(Boolean)
                : [];

        } catch (error) {
            console.error("Error fetching user players:", error);
            return []; // Retornar array vacío en caso de error
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

            // Verificar que los datos son válidos antes de hacer la llamada
            if (!playerId) {
                console.error("Invalid playerId:", playerId);
                throw new Error("El ID del jugador es requerido");
            }

            if (!leagueId) {
                console.error("Invalid leagueId:", leagueId);
                throw new Error("El ID de la liga es requerido");
            }

            if (!position || !['top', 'jungle', 'mid', 'bottom', 'support'].includes(position.toLowerCase())) {
                console.error("Invalid position:", position);
                throw new Error("La posición no es válida");
            }

            const payload = {
                playerId,
                leagueId,
                position: position.toLowerCase(),
                matchday: matchday || 1
            };

            const response = await api.post("/api/players/lineup", payload);
            return response.data;
        } catch (error) {
            console.error("Error in setPlayerAsStarter:", error);
            if (error.response) {
                console.error("Response error data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
            throw error;
        }
    }

    // Get current lineup
    async getCurrentLineup(leagueId, matchday = 1) {
        try {
            const response = await api.get(`/api/players/lineup/${leagueId}/${matchday}`);
            // Normalizar cada jugador para asegurar coherencia
            return Array.isArray(response.data)
                ? response.data.map(normalizePlayerData).filter(Boolean)
                : [];
        } catch (error) {
            console.error("Error fetching current lineup:", error);
            return []; // Retornar array vacío en caso de error
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

    // Get pending offers
    async checkPendingOffers(leagueId) {
        try {
            const response = await api.get(`/api/players/offers/${leagueId}/count`);
            return response.data;
        } catch (error) {
            console.error("Error checking pending offers:", error);
            return { incoming: 0, outgoing: 0 };
        }
    }

}

export default new PlayerService();