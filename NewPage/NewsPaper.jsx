import NewsPage from "./NewsPage"
import './NewsPaper.css'
import {news} from './news.js';

export default function NewsPaper(){
    return (
        <>
        <div id="newspaper">
            <NewsPage news1={news[0]} news2={news[1]} news3={news[2]} news4={news[3]}/>
            <div id="vertical-line"></div>
            <NewsPage news1={news[4]} news2={news[5]} news3={news[6]} news4={news[7]}/>
        </div>
        </>
    )
}