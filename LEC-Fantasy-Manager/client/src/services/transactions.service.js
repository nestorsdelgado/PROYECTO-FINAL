import api from "./axios";
import playerService from "./players.service";

class TransactionService {
    // Get transaction history for a league
    async getTransactionHistory(leagueId) {
        try {
            // Esta sería la llamada real a la API cuando esté disponible
            const response = await api.get(`/api/transactions/${leagueId}`);
            return response.data;
        } catch (error) {
            // Mientras el endpoint no exista, cargamos los datos disponibles
            // desde otras fuentes en la aplicación
            console.error("Error fetching transaction history, using available data:", error);
            return this.getAvailableTransactions(leagueId);
        }
    }

    // Obtener transacciones de fuentes disponibles en la aplicación
    async getAvailableTransactions(leagueId) {
        try {
            // Podemos obtener ofertas completadas desde el endpoint existente
            // Esto nos dará las transacciones entre usuarios
            const offers = await playerService.getPendingOffers(leagueId);

            // Transformar las ofertas completadas en transacciones
            let transactions = [];

            // Ofertas entre usuarios (solo las completadas)
            if (offers && offers.length > 0) {
                const completedOffers = offers.filter(offer => offer.status === 'completed');

                completedOffers.forEach(offer => {
                    const player = offer.player || {};

                    transactions.push({
                        id: offer._id,
                        type: 'trade',
                        typeLabel: 'Intercambio entre usuarios',
                        playerId: player.id || offer.playerId,
                        playerName: player.summonerName || player.name || 'Jugador',
                        playerTeam: player.team || '',
                        playerPosition: player.role || '',
                        price: offer.price,
                        timestamp: new Date(offer.createdAt),
                        sellerUserId: offer.sellerUserId?._id || offer.sellerUserId,
                        sellerUsername: offer.sellerUserId?.username || 'Usuario',
                        buyerUserId: offer.buyerUserId?._id || offer.buyerUserId,
                        buyerUsername: offer.buyerUserId?.username || 'Usuario'
                    });
                });
            }

            // Ordenar por fecha, más reciente primero
            transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return transactions;
        } catch (error) {
            console.error("Error getting available transactions:", error);
            return [];
        }
    }

    // También podemos intentar obtener un historial de compras/ventas al mercado
    // Esta función se podría expandir cuando se agregue más funcionalidad al backend
    async getMarketTransactions(leagueId) {
        try {
            // Aquí se podría implementar la lógica para obtener las transacciones 
            // del mercado una vez que esté disponible en el backend
            return [];
        } catch (error) {
            console.error("Error getting market transactions:", error);
            return [];
        }
    }
}

export default new TransactionService();