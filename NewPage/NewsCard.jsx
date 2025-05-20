import './NewsCard.css'

export default function NewsCard({news}){
    return(
        <div className='newscard'>
            <h3>{news.title}</h3>
            <div className='mid'>
                <img src={news.image}></img>
                <div>
                    <p>{news.date}</p>
                    <p>{news.time}</p>
                    <p>{news.place}</p>
                </div>
            </div>
            <p>{news.fullDesc}</p>
        </div>
    )
}