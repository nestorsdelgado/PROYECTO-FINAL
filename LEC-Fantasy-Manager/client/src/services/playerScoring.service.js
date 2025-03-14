import api from "./axios";

class playerScoringService {
    // Get player scores for a specific matchday
    async getPlayerScores(leagueId, matchday = 1) {
        try {
            const response = await api.get(`/api/scores/matchday/${matchday}/league/${leagueId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching player scores:", error);
            // For development/demo, return mock data if API fails
            return this.getMockPlayerScores(matchday);
        }
    }

    // Get league standings (user rankings based on points)
    async getLeagueStandings(leagueId, matchday = null) {
        try {
            const endpoint = matchday
                ? `/api/standings/league/${leagueId}/matchday/${matchday}`
                : `/api/standings/league/${leagueId}`;

            const response = await api.get(endpoint);
            return response.data;
        } catch (error) {
            console.error("Error fetching league standings:", error);
            // For development/demo, return mock data if API fails
            return this.getMockLeagueStandings(matchday);
        }
    }

    // Get upcoming matches for a specific matchday
    async getUpcomingMatches(matchday = 1) {
        try {
            const response = await api.get(`/api/matches/upcoming/matchday/${matchday}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching upcoming matches:", error);
            // For development/demo, return mock data if API fails
            return this.getMockUpcomingMatches(matchday);
        }
    }

    // Get current user's lineup with scores
    async getUserLineupWithScores(leagueId, matchday = 1) {
        try {
            const response = await api.get(`/api/lineup/scores/${leagueId}/matchday/${matchday}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user lineup with scores:", error);
            // For development/demo, return mock data if API fails
            return this.getMockUserLineupWithScores(matchday);
        }
    }

    // Helper to get a list of available matchdays
    async getAvailableMatchdays() {
        try {
            const response = await api.get('/api/matchdays');
            return response.data;
        } catch (error) {
            console.error("Error fetching available matchdays:", error);
            // For development/demo, return mock data
            return [1, 2, 3, 4, 5, 6, 7, 8, 9];
        }
    }

    // Mock data generators for development and demos
    getMockPlayerScores(matchday) {
        // Generate different mock scores based on the matchday
        const baseScores = {
            1: { kills: 2, deaths: 1, assists: 7, cs: 220, visionScore: 25 },
            2: { kills: 3, deaths: 2, assists: 5, cs: 210, visionScore: 22 },
            3: { kills: 1, deaths: 0, assists: 9, cs: 230, visionScore: 28 },
        };

        // Use matchday 1 data as fallback
        const scoreBase = baseScores[matchday] || baseScores[1];

        // Add some randomness to the scores
        const randomize = (base, variation = 0.3) => {
            const factor = 1 + (Math.random() * variation * 2 - variation);
            return Math.round(base * factor);
        };

        return [
            {
                playerId: 'player1',
                playerName: 'Caps',
                team: 'G2',
                position: 'mid',
                matchday,
                stats: {
                    kills: randomize(scoreBase.kills, 0.5),
                    deaths: randomize(scoreBase.deaths, 0.5),
                    assists: randomize(scoreBase.assists, 0.4),
                    cs: randomize(scoreBase.cs, 0.2),
                    visionScore: randomize(scoreBase.visionScore, 0.3),
                    teamWin: Math.random() > 0.4
                },
                points: randomize(25, 0.3)
            },
            {
                playerId: 'player2',
                playerName: 'Jankos',
                team: 'G2',
                position: 'jungle',
                matchday,
                stats: {
                    kills: randomize(scoreBase.kills, 0.5),
                    deaths: randomize(scoreBase.deaths, 0.5),
                    assists: randomize(scoreBase.assists, 0.4),
                    cs: randomize(scoreBase.cs * 0.7, 0.2), // Junglers have less CS
                    visionScore: randomize(scoreBase.visionScore, 0.3),
                    teamWin: Math.random() > 0.4
                },
                points: randomize(21, 0.3)
            },
            // Add more players as needed
        ];
    }

    getMockLeagueStandings(matchday = null) {
        // Generate different standings based on whether we're looking at a specific matchday or the whole season
        const isMatchdayView = matchday !== null;

        // Base data structure
        const standings = [
            {
                userId: 'user1',
                username: 'FantasyKing',
                position: 1,
                weekPoints: 102,
                totalPoints: 571,
                winStreak: 3
            },
            {
                userId: 'user2',
                username: 'G2Fan4Life',
                position: 2,
                weekPoints: 89,
                totalPoints: 542,
                winStreak: 0
            },
            {
                userId: 'user3',
                username: 'RekklesRules',
                position: 3,
                weekPoints: 76,
                totalPoints: 523,
                winStreak: 1
            },
            {
                userId: 'user4',
                username: 'LecLegend',
                position: 4,
                weekPoints: 81,
                totalPoints: 507,
                winStreak: 0
            },
            {
                userId: 'user5',
                username: 'MidOrFeed',
                position: 5,
                weekPoints: 65,
                totalPoints: 488,
                winStreak: 0
            }
        ];

        // Different order if we're looking at a specific matchday
        if (isMatchdayView && matchday > 1) {
            // Shuffle the standings a bit for different matchdays
            const temp = standings[0];
            standings[0] = standings[1];
            standings[1] = temp;

            // Adjust the weekly points
            standings.forEach(user => {
                user.weekPoints = Math.floor(70 + Math.random() * 40);
            });
        }

        // Mark the current user (for highlighting in UI)
        const currentUserIndex = Math.floor(Math.random() * standings.length);
        standings[currentUserIndex].isCurrentUser = true;

        return standings;
    }

    getMockUpcomingMatches(matchday) {
        const baseMatches = [
            {
                id: 'm1',
                team1: { code: 'G2', name: 'G2 Esports', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2FG2-FullonDark.png' },
                team2: { code: 'FNC', name: 'Fnatic', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1631819669150_fnc-2021-worlds.png' },
                date: '2025-03-15T16:00:00Z',
                matchNumber: 1,
                state: 'unstarted'
            },
            {
                id: 'm2',
                team1: { code: 'MAD', name: 'MAD Lions', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2FMad-Lion-Logo-RGB_On-Dark-Background.png' },
                team2: { code: 'KC', name: 'Karmine Corp', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1673266878684_KC_2023_Square-darkbg.png' },
                date: '2025-03-15T17:00:00Z',
                matchNumber: 2,
                state: 'unstarted'
            },
            {
                id: 'm3',
                team1: { code: 'RGE', name: 'Rogue', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2FKOIEsportsLogo.png' },
                team2: { code: 'AST', name: 'Astralis', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2FAST-FullColor-2021.png' },
                date: '2025-03-15T18:00:00Z',
                matchNumber: 3,
                state: 'unstarted'
            },
            {
                id: 'm4',
                team1: { code: 'XL', name: 'Excel', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1592591623128_ExcelEsportsXL2.png' },
                team2: { code: 'SK', name: 'SK Gaming', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1631819660270_skp-2021-worlds.png' },
                date: '2025-03-15T19:00:00Z',
                matchNumber: 4,
                state: 'unstarted'
            },
            {
                id: 'm5',
                team1: { code: 'TH', name: 'Team Heretics', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2F1671466895881_heretics-logo.png' },
                team2: { code: 'VIT', name: 'Team Vitality', logo: 'https://am-a.akamaihd.net/image?resize=70:&f=http%3A%2F%2Fstatic.lolesports.com%2Fteams%2FVitality-logo-color-outline.png' },
                date: '2025-03-15T20:00:00Z',
                matchNumber: 5,
                state: 'unstarted'
            }
        ];

        // For matchday 2 and beyond, change the states of some matches
        if (matchday > 1) {
            // Make some matches already played
            for (let i = 0; i < matchday - 1; i++) {
                if (baseMatches[i]) {
                    baseMatches[i].state = 'completed';
                    // Add scores
                    baseMatches[i].team1Score = Math.floor(Math.random() * 2);
                    baseMatches[i].team2Score = baseMatches[i].team1Score === 0 ? 1 : 0;
                }
            }
        }

        return baseMatches;
    }

    getMockUserLineupWithScores(matchday) {
        const baseLineup = [
            {
                id: 'player1',
                summonerName: 'Caps',
                team: 'G2',
                position: 'mid',
                imageUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/6/69/G2_Caps_2022_Split_1.png',
                weekPoints: 27,
                totalPoints: 142,
                matchStats: {
                    kills: 3,
                    deaths: 1,
                    assists: 6,
                    cs: 243,
                    visionScore: 21,
                    teamWin: true
                }
            },
            {
                id: 'player2',
                summonerName: 'Jankos',
                team: 'G2',
                position: 'jungle',
                imageUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/9/97/G2_Jankos_2022_Split_1.png',
                weekPoints: 18,
                totalPoints: 115,
                matchStats: {
                    kills: 1,
                    deaths: 2,
                    assists: 9,
                    cs: 186,
                    visionScore: 28,
                    teamWin: true
                }
            },
            {
                id: 'player3',
                summonerName: 'Rekkles',
                team: 'KC',
                position: 'adc',
                imageUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/d/d7/KC_Rekkles_2023_Split_1.png',
                weekPoints: 23,
                totalPoints: 128,
                matchStats: {
                    kills: 4,
                    deaths: 2,
                    assists: 5,
                    cs: 256,
                    visionScore: 18,
                    teamWin: false
                }
            },
            {
                id: 'player4',
                summonerName: 'Odoamne',
                team: 'FNC',
                position: 'top',
                imageUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/7d/FNC_Odoamne_2023_Split_1.png',
                weekPoints: 19,
                totalPoints: 97,
                matchStats: {
                    kills: 2,
                    deaths: 3,
                    assists: 5,
                    cs: 224,
                    visionScore: 16,
                    teamWin: false
                }
            },
            {
                id: 'player5',
                summonerName: 'Kaiser',
                team: 'KOI',
                position: 'support',
                imageUrl: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/0/03/KOI_Kaiser_2023_Split_1.png',
                weekPoints: 15,
                totalPoints: 89,
                matchStats: {
                    kills: 0,
                    deaths: 1,
                    assists: 12,
                    cs: 38,
                    visionScore: 42,
                    teamWin: true
                }
            }
        ];

        // Adjust scores based on matchday to show some progression
        if (matchday > 1) {
            baseLineup.forEach(player => {
                const weekBonus = (matchday - 1) * 5;
                player.weekPoints = Math.floor(player.weekPoints * (0.8 + Math.random() * 0.4));
                player.totalPoints += weekBonus;

                // Randomize match stats
                player.matchStats.kills = Math.floor(player.matchStats.kills * (0.7 + Math.random() * 0.6));
                player.matchStats.deaths = Math.floor(player.matchStats.deaths * (0.7 + Math.random() * 0.6));
                player.matchStats.assists = Math.floor(player.matchStats.assists * (0.7 + Math.random() * 0.6));
                player.matchStats.cs = Math.floor(player.matchStats.cs * (0.9 + Math.random() * 0.2));
                player.matchStats.visionScore = Math.floor(player.matchStats.visionScore * (0.9 + Math.random() * 0.2));
                player.matchStats.teamWin = Math.random() > 0.4;
            });
        }

        return baseLineup;
    }
}

export default new playerScoringService();