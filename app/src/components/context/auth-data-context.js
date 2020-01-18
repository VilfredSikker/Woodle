import { Auth } from "aws-amplify";
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const AuthDataProvider = props => {
  const [authData, setAuthData] = useState(() => {
    const defaultState = {
      isLoggedIn: false,
      username: ""
    };

    return defaultState;
  });

  const [update, setUpdate] = useState(false)

  /* The first time the component is rendered, it tries to
   * fetch the auth data from a source, like a cookie or
   * the localStorage.
   */
  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(user =>
        setAuthData({
          isLoggedIn: true,
          username: user.username
        })
      )
      .catch(err => setAuthData({ isLoggedIn: false }));
  }, [update]);

  const updateAuth = () => setUpdate(!update)

  const authDataValue = { isLoggedIn: authData.isLoggedIn, username: authData.username, updateAuth }

  return <AuthDataContext.Provider value={authDataValue} {...props} />;
};

export const AuthDataContext = createContext(AuthDataProvider);

export const useAuthDataContext = () => useContext(AuthDataContext);

export default AuthDataProvider;