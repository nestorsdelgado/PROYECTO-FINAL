import api from "./axios";

class PlayerService {
    // Obtener todos los jugadores
    async getAllPlayers() {
        try {
            const response = await api.get("/api/players");
            return response.data;
        } catch (error) {
            console.error("Error fetching players:", error);
            throw error;
        }
    }

    // Obtener jugadores por equipo
    async getPlayersByTeam(teamId) {
        try {
            const response = await api.get(`/api/players/team/${teamId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching players by team:", error);
            throw error;
        }
    }

    // Obtener jugadores por posición
    async getPlayersByPosition(position) {
        try {
            const response = await api.get(`/api/players/position/${position}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching players by position:", error);
            throw error;
        }
    }

    // Comprar un jugador
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

    // Obtener jugadores del usuario en una liga específica
    async getUserPlayers(leagueId) {
        try {
            const response = await api.get(`/api/players/user/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user players:", error);
            throw error;
        }
    }

    // Obtener equipos para filtrado
    async getTeams() {
        try {
            const response = await api.get("/api/teams");
            // Transformar la respuesta para adaptarla al formato que espera la UI
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

    // Nuevas funciones para la gestión del equipo

    // Obtener datos financieros del usuario en una liga
    async getUserLeagueData(leagueId) {
        try {
            const response = await api.get(`/api/user-league/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user league data:", error);
            throw error;
        }
    }

    // Establecer jugador como titular
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

    // Obtener alineación actual
    async getCurrentLineup(leagueId, matchday = 1) {
        try {
            const response = await api.get(`/api/players/lineup/${leagueId}/${matchday}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching current lineup:", error);
            throw error;
        }
    }

    // Vender jugador al mercado
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

    // Crear oferta para otro usuario
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

    // Obtener ofertas pendientes
    async getPendingOffers(leagueId) {
        try {
            const response = await api.get(`/api/players/offers/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching pending offers:", error);
            throw error;
        }
    }

    // Aceptar oferta
    async acceptOffer(offerId) {
        try {
            const response = await api.post(`/api/players/offer/accept/${offerId}`);
            return response.data;
        } catch (error) {
            console.error("Error accepting offer:", error);
            throw error;
        }
    }

    // Rechazar oferta
    async rejectOffer(offerId) {
        try {
            const response = await api.post(`/api/players/offer/reject/${offerId}`);
            return response.data;
        } catch (error) {
            console.error("Error rejecting offer:", error);
            throw error;
        }
    }

    // Obtener usuarios de la liga
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