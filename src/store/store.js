import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import loginReducer from "./slices/loginSlice";
import marketReducer from "./slices/marketSlice";
import mfDataReducer from './slices/mfDataSlice';
import PassReducer from './slices/passSlice';

// Redux Persist Config
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['login', 'marketWatch', 'mfData', 'hassPass'], 
};

// All slice reducers
const appReducer = combineReducers({
  login: loginReducer,
  marketWatch: marketReducer,
  mfData: mfDataReducer,
  hassPass: PassReducer
});

// Root reducer with RESET_APP handler
const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_APP') {
    // Clear Redux-Persist storage key manually
    AsyncStorage.removeItem('persist:root');

    // Reset redux state to initial values
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Persistor
export const persistor = persistStore(store);

// Typescript Support
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
