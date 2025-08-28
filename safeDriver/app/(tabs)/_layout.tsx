import FontAwesome from '@expo/vector-icons/FontAwesome';
import {Tabs} from 'expo-router';

export default function TabLayout()
{
    return(
        <Tabs screenOptions={{ tabBarActiveTintColor: '#1f7ce7cc',tabBarInactiveTintColor:'#0c0a0a44'}}>
        <Tabs.Screen 
          name="Home"
          options =
          {{
              title:'Home',
              tabBarIcon: ({color}) => <FontAwesome size={20} name="home" color={color}/>
              
           }}
          />
          <Tabs.Screen 
           name="cameraScreen"
           options =
           {{
              title:'Camera',
              tabBarIcon: ({color}) => <FontAwesome size={20} name="camera" color={color}/>
          }}
        />
          <Tabs.Screen 
           name="TrafficSign"
           options =
           {{
              title:'Sinalização Rodóviaria',
              tabBarIcon: ({color}) => <FontAwesome size={20} name="car" color={color}/>
          }}
        />
        </Tabs>
    );
}