import api from "./axios";
import playerService from "./players.service";

class TransactionService {
    // Get transaction history for a league
    async getTransactionHistory(leagueId) {
        try {
            // Intentar obtener datos del endpoint de transacciones
            const response = await api.get(`/api/transactions/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching transaction history, gathering data from available sources:", error);
            return this.gatherAvailableTransactions(leagueId);
        }
    }

    // Recopilar transacciones desde distintas fuentes disponibles
    async gatherAvailableTransactions(leagueId) {
        try {
            let transactions = [];

            // 1. Intentar obtener ofertas completadas/aceptadas (intercambios entre usuarios)
            try {
                const offers = await playerService.getPendingOffers(leagueId);

                // Si ofertas contiene incoming y outgoing, procesar ambos
                if (offers && typeof offers === 'object') {
                    // Función auxiliar para extraer ofertas completadas
                    const extractCompletedOffers = (offersList) => {
                        return (offersList || []).filter(offer =>
                            offer.status === 'completed' || offer.status === 'accepted'
                        ).map(offer => {
                            const player = offer.player || {};
                            return {
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
                            };
                        });
                    };

                    if (Array.isArray(offers)) {
                        // Si es un array, procesarlo directamente
                        const completedOffers = offers
                            .filter(offer => offer.status === 'completed' || offer.status === 'accepted')
                            .map(offer => {
                                const player = offer.player || {};
                                return {
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
                                };
                            });
                        transactions = [...transactions, ...completedOffers];
                    } else {
                        // Si es un objeto con incoming y outgoing, procesar ambos
                        const incomingCompleted = extractCompletedOffers(offers.incoming);
                        const outgoingCompleted = extractCompletedOffers(offers.outgoing);
                        transactions = [...transactions, ...incomingCompleted, ...outgoingCompleted];
                    }
                }
            } catch (offerError) {
                console.error("Error getting offer transactions:", offerError);
            }

            // 2. Intentar obtener datos de compras/ventas al mercado (esto requeriría implementación en el backend)
            try {
                // Esta implementación dependerá de cómo se registren las compras/ventas
                // Por ahora, usamos una simulación básica
                const marketTransactions = await this.getMarketTransactions(leagueId);
                transactions = [...transactions, ...marketTransactions];
            } catch (marketError) {
                console.error("Error getting market transactions:", marketError);
            }

            // Ordenar todas las transacciones por fecha, más reciente primero
            transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return transactions;
        } catch (error) {
            console.error("Error gathering available transactions:", error);
            return [];
        }
    }

    // Obtener transacciones de mercado desde userPlayer y posiblemente otros registros
    async getMarketTransactions(leagueId) {
        try {
            // Como no tenemos un endpoint directo, podríamos intentar inferir
            // las transacciones de mercado a partir de los cambios en userPlayer
            // Esta es una simulación básica
            return [];
        } catch (error) {
            console.error("Error getting market transactions:", error);
            return [];
        }
    }

    // Método para registrar manualmente una transacción (para usar desde otros servicios)
    async registerTransaction(transactionData) {
        try {
            // Registrar una transacción nueva
            const response = await api.post('/api/transactions', transactionData);
            return response.data;
        } catch (error) {
            console.error("Error registering transaction:", error);
            // Almacenar localmente si hay error
            this.storeLocalTransaction(transactionData);
        }
    }

    // Almacenar transacción localmente si falla el registro en el servidor
    storeLocalTransaction(transactionData) {
        try {
            const localTransactions = localStorage.getItem('pendingTransactions');
            let transactions = localTransactions ? JSON.parse(localTransactions) : [];
            transactions.push({ ...transactionData, timestamp: new Date() });
            localStorage.setItem('pendingTransactions', JSON.stringify(transactions));
        } catch (e) {
            console.error("Error storing local transaction:", e);
        }
    }
}

export default new TransactionService();