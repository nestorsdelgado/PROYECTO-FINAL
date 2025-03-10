import React, { useState, useEffect, createContext } from "react";
import axios from "axios";

const AuthContext = createContext();

// Create a Provider component
function AuthProviderWrapper(props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const storeToken = (token) => {
    localStorage.setItem("token", token);
  };

  const storeUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const authenticateUser = () => {
    // Get the stored token from the localStorage
    const storedToken = localStorage.getItem("token");

    // If the token exists in the localStorage
    if (storedToken) {
      try {
        // Get the user data from localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));

        // Update state variables
        setIsLoggedIn(true);
        setIsLoading(false);
        setUser(storedUser);
      } catch (error) {
        // If error, reset token and state variables
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setIsLoading(false);
        setUser(null);
      }
    } else {
      // If the token doesn't exist, set state variables
      setIsLoggedIn(false);
      setIsLoading(false);
      setUser(null);
    }
  };

  const removeToken = () => {
    // Upon logout, remove the token from the localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const logOutUser = () => {
    // Upon logout, remove the token and update state variables
    removeToken();
    authenticateUser();
  };

  useEffect(() => {
    authenticateUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        storeToken,
        storeUser,
        authenticateUser,
        logOutUser,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProviderWrapper };