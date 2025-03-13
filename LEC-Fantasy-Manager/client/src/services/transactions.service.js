import api from "./axios";
import playerService from "./players.service";

class TransactionService {
    // Get transaction history for a league
    async getTransactionHistory(leagueId) {
        try {
            console.log("Fetching transaction history for league:", leagueId);

            // Intentar obtener datos del endpoint de transacciones
            const response = await api.get(`/api/transactions/${leagueId}`);

            if (Array.isArray(response.data)) {
                // Eliminar duplicados basándose en un identificador único
                const transactionsMap = new Map();

                response.data.forEach(transaction => {
                    // Crear un ID compuesto para identificar la transacción
                    const uniqueId = transaction.offerId
                        ? `trade-${transaction.offerId}`
                        : `${transaction.type}-${transaction.playerId}-${transaction.timestamp || transaction.createdAt}`;

                    // Solo mantener la primera ocurrencia de cada transacción única
                    if (!transactionsMap.has(uniqueId)) {
                        transactionsMap.set(uniqueId, transaction);
                    }
                });

                // Convertir el mapa de vuelta a un array
                const uniqueTransactions = Array.from(transactionsMap.values());

                console.log(`Filtered ${response.data.length} transactions to ${uniqueTransactions.length} unique transactions`);
                return uniqueTransactions;
            } else {
                console.warn("Unexpected response format:", response.data);
                return [];
            }
        } catch (error) {
            console.error("Error fetching transaction history:", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            return this.gatherAvailableTransactions(leagueId);
        }
    }

    // Recopilar transacciones desde distintas fuentes disponibles
    async gatherAvailableTransactions(leagueId) {
        try {
            console.log("Attempting to gather transactions from all available sources for league:", leagueId);
            let transactions = [];

            // 1. Intentar obtener ofertas completadas/aceptadas (intercambios entre usuarios)
            try {
                console.log("Fetching completed offers...");
                const offers = await playerService.getPendingOffers(leagueId);

                // Ver qué estructura tenemos
                console.log("Offers structure:",
                    typeof offers,
                    offers ? (Array.isArray(offers) ? "is array" : "is object") : "is null/undefined");

                if (offers) {
                    // Función auxiliar para extraer ofertas completadas
                    const extractCompletedOffers = (offersList) => {
                        if (!Array.isArray(offersList)) return [];

                        return offersList.filter(offer =>
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
                        const completedOffers = extractCompletedOffers(offers);
                        console.log(`Found ${completedOffers.length} completed offers in array`);
                        transactions = [...transactions, ...completedOffers];
                    } else if (offers.incoming || offers.outgoing) {
                        // Si es un objeto con incoming y outgoing, procesar ambos
                        const incomingCompleted = extractCompletedOffers(offers.incoming || []);
                        const outgoingCompleted = extractCompletedOffers(offers.outgoing || []);
                        console.log(`Found ${incomingCompleted.length} incoming and ${outgoingCompleted.length} outgoing completed offers`);
                        transactions = [...transactions, ...incomingCompleted, ...outgoingCompleted];
                    }
                }
            } catch (offerError) {
                console.error("Error getting offer transactions:", offerError);
            }

            // 2. Intentar obtener datos de compras/ventas al mercado (esto requeriría implementación en el backend)
            try {
                console.log("Fetching market transactions...");
                const marketTransactions = await this.getMarketTransactions(leagueId);
                console.log(`Found ${marketTransactions.length} market transactions`);
                transactions = [...transactions, ...marketTransactions];
            } catch (marketError) {
                console.error("Error getting market transactions:", marketError);
            }

            // Ordenar todas las transacciones por fecha, más reciente primero
            transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            console.log(`Total transactions gathered: ${transactions.length}`);

            // Contar transacciones por tipo para depuración
            const typeCount = {
                purchase: 0,
                sale: 0,
                trade: 0,
                unknown: 0
            };

            transactions.forEach(transaction => {
                if (transaction.type in typeCount) {
                    typeCount[transaction.type]++;
                } else {
                    typeCount.unknown++;
                }
            });

            console.log("Gathered transactions by type:", typeCount);

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
            console.log("Registering transaction:", {
                type: transactionData.type,
                playerId: transactionData.playerId,
                playerName: transactionData.playerName,
                price: transactionData.price,
                userId: transactionData.userId,
                sellerUserId: transactionData.sellerUserId,
                buyerUserId: transactionData.buyerUserId,
            });

            // Verificar que tenemos los datos necesarios según el tipo
            if (!transactionData.type || !transactionData.leagueId || !transactionData.playerId) {
                console.error("Missing required transaction data:", transactionData);
                throw new Error("Missing required transaction data");
            }

            if (!['purchase', 'sale', 'trade'].includes(transactionData.type)) {
                console.error("Invalid transaction type:", transactionData.type);
                throw new Error(`Invalid transaction type: ${transactionData.type}`);
            }

            if (transactionData.type === 'trade' && (!transactionData.sellerUserId || !transactionData.buyerUserId)) {
                console.error("Trade transactions require seller and buyer IDs:", transactionData);
                throw new Error("Trade transactions require seller and buyer IDs");
            }

            if ((transactionData.type === 'purchase' || transactionData.type === 'sale') && !transactionData.userId) {
                console.error("Purchase/sale transactions require userId:", transactionData);
                throw new Error("Purchase/sale transactions require userId");
            }

            // Registrar la transacción
            const response = await api.post('/api/transactions', transactionData);
            console.log("Transaction registered successfully:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error registering transaction:", error);

            // Almacenar localmente si hay error para intentar enviar más tarde
            this.storeLocalTransaction(transactionData);

            // Reenviar el error para que el llamante sepa que algo falló
            throw error;
        }
    }

    // Almacenar transacción localmente si falla el registro en el servidor
    storeLocalTransaction(transactionData) {
        try {
            const localTransactions = localStorage.getItem('pendingTransactions');
            let transactions = localTransactions ? JSON.parse(localTransactions) : [];
            transactions.push({ ...transactionData, timestamp: new Date() });
            localStorage.setItem('pendingTransactions', JSON.stringify(transactions));
            console.log("Transaction stored locally for later retry");
        } catch (e) {
            console.error("Error storing local transaction:", e);
        }
    }

    // Método para intentar enviar transacciones almacenadas localmente
    async syncLocalTransactions() {
        try {
            const localTransactions = localStorage.getItem('pendingTransactions');
            if (!localTransactions) return;

            const transactions = JSON.parse(localTransactions);
            if (!transactions.length) return;

            console.log(`Attempting to sync ${transactions.length} local transactions`);

            const successful = [];

            for (const transaction of transactions) {
                try {
                    await api.post('/api/transactions', transaction);
                    successful.push(transaction);
                } catch (error) {
                    console.error("Failed to sync transaction:", error);
                }
            }

            // Eliminar transacciones enviadas correctamente
            if (successful.length) {
                const remaining = transactions.filter(t =>
                    !successful.some(s => s.playerId === t.playerId && s.timestamp === t.timestamp)
                );
                localStorage.setItem('pendingTransactions', JSON.stringify(remaining));
                console.log(`Synced ${successful.length} transactions, ${remaining.length} remaining`);
            }
        } catch (error) {
            console.error("Error syncing local transactions:", error);
        }
    }
}

export default new TransactionService();