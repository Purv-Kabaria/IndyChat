import './NewsPage.css';
import NewsCard from './NewsCard';

export default function NewsPage({news1,news2,news3,news4}){
    return (
        <>
        <table>
            <caption><h1>INDIANAPOLIS DAILY CHRONICLE</h1></caption>
            <tr>
                <td rowSpan={5} colSpan={2} id="topLeft"><NewsCard news={news1}/></td>
                <td rowSpan={4} colSpan={2} id="topRight"><NewsCard news={news2}/></td>
            </tr>
            <tr>
            </tr>
            <tr>
            </tr>
            <tr>
            </tr>
            <tr>
                <td colSpan={2} rowSpan={4} id="bottomRight"><NewsCard news={news3}/></td>
            </tr>
            <tr>
                <td rowSpan={3} colSpan={2} id="bottomLeft"><NewsCard news={news4}/></td>
            </tr>
        </table>
        </>
    );
}