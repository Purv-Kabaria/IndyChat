import './App.css';
import { useEffect, useState } from 'react';
import About from './About';

function App() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [fontSize, setFontSize] = useState(1);
    const styles={height:"50px",width:"50px",borderRadius:"50%",textAlign:"center"};
    let size=['small','medium','large'];

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const changeFontSize = () => {
        let i=(fontSize+1)%3;
        setFontSize(i);
    };

    return (
        <div className={isDarkMode ? 'dark-mode' : 'light-mode'} style={{ fontSize: `var(--font-size-${size[fontSize]})` }}>
            <div className="navbar"> 
                <button onClick={toggleDarkMode} style={styles}>
                    {isDarkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
                </button>
                <div>
                    <button onClick={() => changeFontSize()} style={styles}>&#8597;A</button>
                </div>
                <About />
            </div>
        </div>
    );
}

export default App;
