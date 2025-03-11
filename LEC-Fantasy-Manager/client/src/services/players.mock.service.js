import { mockPlayers, mockTeams, mockUserPlayers } from '../data/mockPlayers';

// Helper function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class PlayerMockService {
    // Get all players
    async getAllPlayers() {
        await delay(800); // Simulate network delay
        return [...mockPlayers];
    }

    // Get players by team
    async getPlayersByTeam(teamId) {
        await delay(500);
        return mockPlayers.filter(player => player.team === teamId);
    }

    // Get players by position
    async getPlayersByPosition(position) {
        await delay(500);
        return mockPlayers.filter(player => player.position === position);
    }

    // Local array to store purchased players during session
    userPlayerIds = mockUserPlayers.map(p => p.id);

    // Buy a player
    async buyPlayer(playerId, leagueId) {
        await delay(1000);

        // Check if already purchased
        if (this.userPlayerIds.includes(playerId)) {
            throw new Error("You already own this player");
        }

        // Check maximum of 2 players per team
        const playerToBuy = mockPlayers.find(p => p.id === playerId);
        if (!playerToBuy) {
            throw new Error("Player not found");
        }

        const teamPlayers = this.getUserPlayers().filter(p => p.team === playerToBuy.team);
        if (teamPlayers.length >= 2) {
            throw new Error(`You already have 2 players from ${playerToBuy.team}`);
        }

        // Add to purchased players list
        this.userPlayerIds.push(playerId);

        return { success: true, message: "Player purchased successfully" };
    }

    // Get user's players in a specific league
    async getUserPlayers() {
        await delay(600);
        return mockPlayers.filter(player => this.userPlayerIds.includes(player.id));
    }

    // Get teams for filtering
    async getTeams() {
        await delay(300);
        return [...mockTeams];
    }

    // Get user's financial data in a league
    async getUserLeagueData() {
        await delay(200);
        return { money: 75, userId: "mock-user-id", leagueId: "mock-league-id" };
    }

    // Set player as starter
    async setPlayerAsStarter(playerId, leagueId, position) {
        await delay(400);
        return { success: true };
    }

    // Get current lineup
    async getCurrentLineup() {
        await delay(300);
        // Return empty lineup for simplicity
        return [];
    }

    // Sell player to market
    async sellPlayerToMarket(playerId) {
        await delay(500);

        // Remove from user's players
        this.userPlayerIds = this.userPlayerIds.filter(id => id !== playerId);

        return {
            success: true,
            newBalance: 75 // Mock balance
        };
    }

    // Create offer to another user
    async createPlayerOffer(playerId, leagueId, targetUserId, price) {
        await delay(700);
        return {
            success: true,
            offerId: "mock-offer-id"
        };
    }

    // Get pending offers
    async getPendingOffers() {
        await delay(400);
        return {
            incoming: [],
            outgoing: []
        };
    }

    // Accept offer
    async acceptOffer() {
        await delay(600);
        return {
            success: true
        };
    }

    // Reject offer
    async rejectOffer() {
        await delay(400);
        return {
            success: true
        };
    }

    // Get users in a league
    async getLeagueUsers() {
        await delay(300);
        return [
            { id: "user1", username: "Player1" },
            { id: "user2", username: "Player2" },
            { id: "user3", username: "Player3" }
        ];
    }
}

export default new PlayerMockService();