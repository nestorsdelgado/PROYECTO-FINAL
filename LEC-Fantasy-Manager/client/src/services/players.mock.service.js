import { mockPlayers, mockTeams, mockUserPlayers } from '../data/mockPlayers';

// Función auxiliar para esperar un tiempo simulando una llamada API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class PlayerMockService {
    // Obtener todos los jugadores
    async getAllPlayers() {
        await delay(800); // Simular delay de red
        return [...mockPlayers];
    }

    // Obtener jugadores por equipo
    async getPlayersByTeam(teamId) {
        await delay(500);
        return mockPlayers.filter(player => player.team === teamId);
    }

    // Obtener jugadores por posición
    async getPlayersByPosition(position) {
        await delay(500);
        return mockPlayers.filter(player => player.position === position);
    }

    // Arreglo local para almacenar jugadores comprados durante la sesión
    userPlayerIds = mockUserPlayers.map(p => p.id);

    // Comprar un jugador
    async buyPlayer(playerId, leagueId) {
        await delay(1000);

        // Verificar si ya está comprado
        if (this.userPlayerIds.includes(playerId)) {
            throw new Error("Ya tienes este jugador en tu equipo");
        }

        // Verificar máximo de 2 jugadores por equipo
        const playerToBuy = mockPlayers.find(p => p.id === playerId);
        if (!playerToBuy) {
            throw new Error("Jugador no encontrado");
        }

        const teamPlayers = this.getUserPlayers().filter(p => p.team === playerToBuy.team);
        if (teamPlayers.length >= 2) {
            throw new Error(`Ya tienes 2 jugadores del equipo ${playerToBuy.team}`);
        }

        // Añadir a la lista de jugadores comprados
        this.userPlayerIds.push(playerId);

        return { success: true, message: "Jugador comprado correctamente" };
    }

    // Obtener jugadores del usuario en una liga específica
    async getUserPlayers() {
        await delay(600);
        return mockPlayers.filter(player => this.userPlayerIds.includes(player.id));
    }

    // Obtener equipos para filtrado
    async getTeams() {
        await delay(300);
        return [...mockTeams];
    }
}

export default new PlayerMockService();