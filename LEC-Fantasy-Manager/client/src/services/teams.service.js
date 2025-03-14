import axios from 'axios';

class TeamsService {
    constructor() {
        // Base URL for API calls - Asegúrate de que esta URL coincida con la de tu backend
        this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

        // Cache para almacenar equipos obtenidos de la API
        this.teamsCache = null;
    }

    /**
     * Get all teams from the API
     * @returns {Promise<Object>} Promise resolving to teams data response
     */
    async getTeams() {
        try {
            // Si ya tenemos los equipos en cache, los devolvemos directamente
            if (this.teamsCache) {
                return { data: this.teamsCache };
            }

            // Obtener equipos de la API
            const response = await axios.get(`${this.baseUrl}/teams`);

            // Guardar en cache para futuras solicitudes
            if (response.data && (Array.isArray(response.data) || response.data.teams)) {
                this.teamsCache = Array.isArray(response.data) ? response.data : response.data.teams;
            }

            return response;
        } catch (error) {
            console.error('Error fetching teams from API:', error);
            throw error;
        }
    }

    /**
     * Get a specific team by ID from the API
     * @param {string} teamId - Team ID
     * @returns {Promise<Object>} Promise resolving to team data
     */
    async getTeamById(teamId) {
        try {
            // Primero intentamos obtener el equipo de la cache
            if (this.teamsCache) {
                const cachedTeam = this.teamsCache.find(t =>
                    t.id === teamId ||
                    t.code === teamId ||
                    t.slug === teamId
                );

                if (cachedTeam) {
                    return cachedTeam;
                }
            }

            // Si no está en cache, hacemos la petición a la API
            const response = await axios.get(`${this.baseUrl}/teams/${teamId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching team with ID ${teamId} from API:`, error);

            // Intentar encontrar el equipo en la cache como último recurso
            if (this.teamsCache) {
                const teamByCode = this.teamsCache.find(t =>
                    t.code && t.code.toLowerCase() === teamId.toLowerCase()
                );

                if (teamByCode) {
                    return teamByCode;
                }
            }

            throw error;
        }
    }

    /**
     * Get team logo URL directly from team code by querying the API
     * @param {string} teamCode - Team code (e.g., 'G2', 'FNC')
     * @returns {Promise<string>} Promise resolving to logo URL
     */
    async getTeamLogoUrl(teamCode) {
        try {
            if (!teamCode) return null;

            // Normalizar el código del equipo
            const code = String(teamCode).toUpperCase();

            // Buscar el equipo en la cache primero
            if (this.teamsCache) {
                const team = this.teamsCache.find(t =>
                    t.code && t.code.toUpperCase() === code
                );

                if (team && team.image) {
                    return team.image;
                }
            }

            // Si no está en cache, intentar obtener todos los equipos
            const teams = await this.getTeams();
            const teamsData = Array.isArray(teams.data) ? teams.data :
                (teams.data.teams || []);

            const team = teamsData.find(t =>
                t.code && t.code.toUpperCase() === code
            );

            // Devolver la imagen del equipo si existe
            if (team && team.image) {
                return team.image;
            }

            // Si no se encuentra el equipo o la imagen, devolver null
            return null;
        } catch (error) {
            console.error(`Error getting logo URL for team ${teamCode}:`, error);
            return null;
        }
    }

    /**
     * @param {string|Object} teamInfo - Team code or team object
     * @returns {string|null} Logo URL if available in cache, null otherwise
     */
    getLogoUrl(teamInfo) {
        // Si ya tenemos el objeto completo del equipo, usar su propiedad de imagen
        if (teamInfo && typeof teamInfo === 'object') {
            if (teamInfo.image) return teamInfo.image;
            if (teamInfo.alternativeImage) return teamInfo.alternativeImage;
            if (teamInfo.backgroundImage) return teamInfo.backgroundImage;

            // Si el objeto tiene código pero no imagen, intentar buscar por código
            teamInfo = teamInfo.code || null;
        }

        // Si no tenemos un código o la cache no está inicializada, no podemos hacer nada
        if (!teamInfo || !this.teamsCache) {
            return null;
        }

        // Intentar encontrar el equipo por código en la cache
        const code = String(teamInfo).toUpperCase();
        const team = this.teamsCache.find(t =>
            t.code && t.code.toUpperCase() === code
        );

        if (team) {
            // Priorizar image, pero caer en alternativas si existe
            return team.image || team.alternativeImage || team.backgroundImage || null;
        }

        // No se encontró el equipo en la cache
        return null;
    }

    /**
     * Get teams by league name
     * @param {string} leagueName - League name (e.g., 'LEC')
     * @returns {Promise<Array>} Promise resolving to teams array
     */
    async getTeamsByLeague(leagueName) {
        try {
            // Asegurarse de que tenemos los equipos
            const response = await this.getTeams();
            const teams = Array.isArray(response.data) ? response.data :
                (response.data.teams || []);

            // Filtrar por nombre de liga
            return teams.filter(team =>
                team.homeLeague &&
                team.homeLeague.name?.toUpperCase() === leagueName.toUpperCase()
            );
        } catch (error) {
            console.error(`Error fetching teams for league ${leagueName}:`, error);
            throw error;
        }
    }

    clearCache() {
        this.teamsCache = null;
    }
}

const teamsService = new TeamsService();
export default teamsService;