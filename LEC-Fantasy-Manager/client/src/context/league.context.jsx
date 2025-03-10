import React, { useState, useEffect, createContext } from "react";

const LeagueContext = createContext();

function LeagueProviderWrapper(props) {
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [isLeagueLoading, setIsLeagueLoading] = useState(true);

    // When the component mounts, check if there's a selected league in localStorage
    useEffect(() => {
        const storedLeague = localStorage.getItem("selectedLeague");
        if (storedLeague) {
            try {
                const parsedLeague = JSON.parse(storedLeague);
                setSelectedLeague(parsedLeague);
            } catch (e) {
                // If there's an error parsing, clear the stored league
                localStorage.removeItem("selectedLeague");
                setSelectedLeague(null);
            }
        }
        setIsLeagueLoading(false);
    }, []);

    // Function to set the selected league
    const selectLeague = (league) => {
        setSelectedLeague(league);
        localStorage.setItem("selectedLeague", JSON.stringify(league));
    };

    // Function to clear the selected league
    const clearSelectedLeague = () => {
        setSelectedLeague(null);
        localStorage.removeItem("selectedLeague");
    };

    return (
        <LeagueContext.Provider
            value={{
                selectedLeague,
                isLeagueLoading,
                selectLeague,
                clearSelectedLeague
            }}
        >
            {props.children}
        </LeagueContext.Provider>
    );
}

export { LeagueContext, LeagueProviderWrapper };