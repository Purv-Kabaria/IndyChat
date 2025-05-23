import './Card.css';

// The Card component displays an image, heading, and description based on the object passed to it.
export default function Card({object}){
    return (
        <div className='card'>
            <img src={object.image} alt="image" />
            <h3>{object.heading}</h3>
            <p>{object.description}</p>
        </div>
    );
}
