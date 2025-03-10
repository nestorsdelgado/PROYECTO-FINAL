import { useContext } from 'react';
import { LeagueContext } from '../context/league.context';

/**
 * Custom hook to access the currently selected league
 * Usage: 
 * const { selectedLeague, selectLeague, clearSelectedLeague } = useSelectedLeague();
 * 
 * @returns {Object} Object containing the selected league and functions to manage it
 */

function useSelectedLeague() {
    const context = useContext(LeagueContext);

    if (context === undefined) {
        throw new Error('useSelectedLeague must be used within a LeagueProvider');
    }

    return context;
}

export default useSelectedLeague;