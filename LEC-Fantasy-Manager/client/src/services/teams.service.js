import axios from 'axios';

/**
 * Service for handling team-related API calls
 */
class TeamsService {
    constructor() {
        // Base URL for API calls - adjust as needed for your environment
        this.baseUrl = process.env.REACT_APP_API_URL || '/api';
        // CDN base for LoL esports assets
        this.cdnBase = 'https://am-a.akamaihd.net/image?f=https://lolstatic-a.akamaihd.net/esports-assets/production/team';
    }

    /**
     * Get all teams
     * @returns {Promise<Object>} Promise resolving to teams data response
     */
    async getTeams() {
        try {
            const response = await axios.get(`${this.baseUrl}/teams`);

            // Add image fallbacks for each team
            if (response.data && Array.isArray(response.data)) {
                response.data = response.data.map(team => ({
                    ...team,
                    image: team.image || team.logo || this.getLogoUrl(team.code),
                    logo: team.logo || team.image || this.getLogoUrl(team.code)
                }));
            } else if (response.data && response.data.teams && Array.isArray(response.data.teams)) {
                response.data.teams = response.data.teams.map(team => ({
                    ...team,
                    image: team.image || team.logo || this.getLogoUrl(team.code),
                    logo: team.logo || team.image || this.getLogoUrl(team.code)
                }));
            }

            return response;
        } catch (error) {
            console.error('Error fetching teams:', error);

            // Create fallback teams with proper image URLs
            const fallbackTeams = {
                data: [
                    {
                        id: 'g2',
                        code: 'G2',
                        name: 'G2 Esports',
                        logo: `${this.cdnBase}/g2-esports-8kcovfb3.png`,
                        image: `${this.cdnBase}/g2-esports-8kcovfb3.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'fnc',
                        code: 'FNC',
                        name: 'Fnatic',
                        logo: `${this.cdnBase}/fnatic-mi19dkhm.png`,
                        image: `${this.cdnBase}/fnatic-mi19dkhm.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'mad',
                        code: 'MAD',
                        name: 'MAD Lions',
                        logo: `${this.cdnBase}/mad-lions-h5xuvs0y.png`,
                        image: `${this.cdnBase}/mad-lions-h5xuvs0y.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'kc',
                        code: 'KC',
                        name: 'Karmine Corp',
                        logo: `${this.cdnBase}/karmine-corp-61i393gx.png`,
                        image: `${this.cdnBase}/karmine-corp-61i393gx.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'koi',
                        code: 'KOI',
                        name: 'KOI',
                        logo: `${this.cdnBase}/koi-dcr1iqxs.png`,
                        image: `${this.cdnBase}/koi-dcr1iqxs.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'ast',
                        code: 'AST',
                        name: 'Astralis',
                        logo: `${this.cdnBase}/astralis-1jr2u49y.png`,
                        image: `${this.cdnBase}/astralis-1jr2u49y.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'xl',
                        code: 'XL',
                        name: 'Excel Esports',
                        logo: `${this.cdnBase}/excel-esports-8shtlgy6.png`,
                        image: `${this.cdnBase}/excel-esports-8shtlgy6.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'sk',
                        code: 'SK',
                        name: 'SK Gaming',
                        logo: `${this.cdnBase}/sk-gaming-7mm0s8eq.png`,
                        image: `${this.cdnBase}/sk-gaming-7mm0s8eq.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'th',
                        code: 'TH',
                        name: 'Team Heretics',
                        logo: `${this.cdnBase}/team-heretics-9jwx0hey.png`,
                        image: `${this.cdnBase}/team-heretics-9jwx0hey.png`,
                        homeLeague: { name: 'LEC' }
                    },
                    {
                        id: 'vit',
                        code: 'VIT',
                        name: 'Team Vitality',
                        logo: `${this.cdnBase}/team-vitality-4m9utcol.png`,
                        image: `${this.cdnBase}/team-vitality-4m9utcol.png`,
                        homeLeague: { name: 'LEC' }
                    }
                ]
            };

            return fallbackTeams;
        }
    }

    /**
     * Get a specific team by ID
     * @param {string} teamId - Team ID
     * @returns {Promise<Object>} Promise resolving to team data
     */
    async getTeamById(teamId) {
        try {
            const response = await axios.get(`${this.baseUrl}/teams/${teamId}`);
            const team = response.data;

            // Ensure the team has an image URL
            if (team) {
                team.image = team.image || team.logo || this.getLogoUrl(team.code);
                team.logo = team.logo || team.image || this.getLogoUrl(team.code);
            }

            return team;
        } catch (error) {
            console.error(`Error fetching team with ID ${teamId}:`, error);

            // Try to find the team in our fallback data
            const allTeamsResponse = await this.getTeams();
            const teams = allTeamsResponse.data;
            const team = teams.find(t =>
                t.id === teamId ||
                t.code?.toLowerCase() === teamId.toLowerCase()
            );

            if (team) {
                return team;
            }

            throw new Error(`Team with ID ${teamId} not found`);
        }
    }

    /**
     * Get a standardized logo URL for a team based on team code
     * @param {string} teamCode - Team code (e.g., 'G2', 'FNC')
     * @returns {string} Logo URL
     */
    getLogoUrl(teamCode) {
        if (!teamCode) return '/assets/images/teams/default-logo.png';

        // Map of specific team codes to their image identifiers
        const teamImageMap = {
            'G2': 'g2-esports-8kcovfb3.png',
            'FNC': 'fnatic-mi19dkhm.png',
            'MAD': 'mad-lions-h5xuvs0y.png',
            'KC': 'karmine-corp-61i393gx.png',
            'KOI': 'koi-dcr1iqxs.png',
            'AST': 'astralis-1jr2u49y.png',
            'XL': 'excel-esports-8shtlgy6.png',
            'SK': 'sk-gaming-7mm0s8eq.png',
            'TH': 'team-heretics-9jwx0hey.png',
            'VIT': 'team-vitality-4m9utcol.png'
        };

        const code = teamCode.toUpperCase();
        if (teamImageMap[code]) {
            return `${this.cdnBase}/${teamImageMap[code]}`;
        }

        // Fallback to generic format
        return `${this.cdnBase}/${teamCode.toLowerCase()}.png`;
    }

    /**
     * Get teams by league
     * @param {string} leagueName - League name (e.g., 'LEC')
     * @returns {Promise<Array>} Promise resolving to teams array
     */
    async getTeamsByLeague(leagueName) {
        try {
            const response = await this.getTeams();
            const teams = Array.isArray(response.data) ? response.data :
                (response.data.teams ? response.data.teams : []);

            return teams.filter(team =>
                team.homeLeague &&
                team.homeLeague.name?.toUpperCase() === leagueName.toUpperCase()
            );
        } catch (error) {
            console.error(`Error fetching teams for league ${leagueName}:`, error);
            throw error;
        }
    }
}

const teamsService = new TeamsService();
export default teamsService;