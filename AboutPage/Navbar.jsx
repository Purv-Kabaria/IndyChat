import { useState } from "react";
import Body from './Body';
import {Introduction,History,DemoGraphics,Government,Economy,CultureFestival} from './data';

// The Navbar component manages the state of the selected tab and renders the corresponding content.
export default function Navbar(){
    let contents=["Introduction","History","DemoGraphics","Government","Economy","Culture & Festival"];
    let [Tab,setTab]=useState("Introduction");
    
    function HandleTab(event){
        setTab(event.target.innerText); // Consider using a more robust method to set the tab
    }
    
    let infoType=Introduction;
    if(Tab=="Introduction") infoType=Introduction;
    else if(Tab=="History") infoType=History;
    else if(Tab=="DemoGraphics") infoType=DemoGraphics;
    else if(Tab=="Government") infoType=Government;
    else if(Tab=="Economy") infoType=Economy;
    else if(Tab=="Culture & Festival") infoType=CultureFestival;
    
    return(
        <>
        <div className="navbar" style={{width:"100vw"}}>
            {contents.map((content)=>{ // Consider adding a key prop for each button
                return <button onClick={HandleTab}>{content}</button>
            })}
        </div>
        <div style={{width:"100vw", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))"}}>
            <Body infoType={infoType}/>
        </div>
        </>
    );
}
