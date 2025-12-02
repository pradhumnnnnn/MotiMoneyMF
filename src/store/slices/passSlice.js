import { createSlice } from "@reduxjs/toolkit";

const PassSlice = createSlice({
    name: "hassPass",
    initialState: {
        hassPassWord: null,
    
    },
    reducers: {
        setPass: (state, action) => {
            state.hassPassWord = action.payload;
        },
       
    }
})
export const { setPass, } = PassSlice.actions;
export default PassSlice.reducer;