import {Stack} from "expo-router";
import { Colors } from "react-native/Libraries/NewAppScreen";

export default function RootLayout(){
    return(
           <Stack screenOptions={{
                                  headerShown:false
                                  }} >
   
          <Stack.Screen name="(tabs)"  />

          <Stack.Screen name="Outros/sign" options={{headerTitle:'Detalhes', headerShown:true}}/>
    </Stack>
    )
}