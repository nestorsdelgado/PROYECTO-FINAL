import React, { useState, useEffect, useContext } from 'react';
import './MainContent.css';
import Leagues from '../Leagues/Leagues';
import Button from '@mui/material/Button';
import AddLeague from '../AddLeague/AddLeague';
import JoinLeague from '../JoinLeague/JoinLeague';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { Box, Typography, ThemeProvider, createTheme } from '@mui/material';
import { Add, GroupAdd } from '@mui/icons-material';
import { AuthContext } from '../../context/auth.context';
import leagueService from '../../services/leagues.service';

// Custom theme for the pagination (white numbers)
const paginationTheme = createTheme({
  components: {
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: 'white',
          '&.Mui-selected': {
            backgroundColor: '#1976d2',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
        icon: {
          color: 'white',
        },
      },
    },
  },
});

const MainContent = ({ isSidebarOpen, openAuthModal }) => {
  const { isLoggedIn, isLoading } = useContext(AuthContext);
  const [allLeagues, setAllLeagues] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [leaguesPerPage] = useState(2);

  // This useEffect will run when the component mounts, authentication changes, or refreshKey changes
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      console.log("Fetching leagues with refreshKey:", refreshKey);
      fetchLeagues();
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [refreshKey, isLoggedIn, isLoading]);

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      console.log("Making API request to fetch leagues");
      const data = await leagueService.getAllLeagues();

      // Handle different response structures
      let leaguesData = [];

      if (Array.isArray(data)) {
        leaguesData = data;
      } else if (data && Array.isArray(data.Ligas)) {
        leaguesData = data.Ligas;
      } else if (data && typeof data === 'object') {
        // If data is an object, try to find an array property
        for (const key in data) {
          if (Array.isArray(data[key])) {
            leaguesData = data[key];
            break;
          }
        }
      }

      console.log("Processed leagues data:", leaguesData);
      setAllLeagues(leaguesData);
    } catch (error) {
      console.error("Error fetching leagues:", error);
      console.error("Error response:", error.response?.data);
      setAllLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueCreated = () => {
    console.log("League created, refreshing leagues list");
    setIsCreateModalOpen(false);
    // Increment refreshKey to trigger the useEffect and fetch leagues again
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleLeagueJoined = () => {
    console.log("League joined, refreshing leagues list");
    setIsJoinModalOpen(false);
    // Increment refreshKey to trigger the useEffect and fetch leagues again
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Calculate pagination
  const indexOfLastLeague = currentPage * leaguesPerPage;
  const indexOfFirstLeague = indexOfLastLeague - leaguesPerPage;

  // Make sure allLeagues is an array before slicing
  const safeAllLeagues = Array.isArray(allLeagues) ? allLeagues : [];

  // Get current leagues for current page
  const currentLeagues = safeAllLeagues.slice(indexOfFirstLeague, indexOfLastLeague);

  // Calculate total number of pages
  const pageCount = Math.max(1, Math.ceil(safeAllLeagues.length / leaguesPerPage));

  // Change page
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle opening login modal
  const handleOpenLogin = () => {
    if (openAuthModal) {
      openAuthModal();
    }
  };

  return (
    <div style={{ height: '96vh' }} className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="league-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<GroupAdd />}
            onClick={() => isLoggedIn ? setIsJoinModalOpen(true) : handleOpenLogin()}
          >
            Join League
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => isLoggedIn ? setIsCreateModalOpen(true) : handleOpenLogin()}
          >
            Create League
          </Button>
        </Box>
      </div>

      <AddLeague
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeagueAdded={handleLeagueCreated}
      />

      <JoinLeague
        open={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onLeagueJoined={handleLeagueJoined}
      />

      {!isLoggedIn ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 8,
            gap: 2
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Please log in to view your leagues
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenLogin}
          >
            Log In
          </Button>
        </Box>
      ) : isLoading || loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="body1" sx={{ color: 'white' }}>Loading leagues...</Typography>
        </Box>
      ) : (
        <>
          {safeAllLeagues.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 8,
                gap: 2
              }}
            >
              <Typography variant="h6" sx={{ color: 'white' }}>
                You're not a member of any leagues yet.
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                Create a new league or join an existing one.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsJoinModalOpen(true)}
                >
                  Join a League
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create a League
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Leagues
                leagues={currentLeagues}
                onLeagueChange={() => setRefreshKey(prevKey => prevKey + 1)}
              />

              {/* Only show pagination if we have leagues */}
              {safeAllLeagues.length > leaguesPerPage && (
                <Stack spacing={2} alignItems="center" sx={{ mt: 3, mb: 3 }}>
                  <ThemeProvider theme={paginationTheme}>
                    <Pagination
                      count={pageCount}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                      size="large"
                    />
                  </ThemeProvider>
                </Stack>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MainContent;