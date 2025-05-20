import Card from './Card'

// The Body component receives an array of infoType and maps over it to render Card components.
export default function Body({infoType}){
    return(
        <>
        {
            infoType.map((object)=>{ // Ensure that object has the required properties before rendering
                return <Card object={object} />;
            })
        }
        </>
    );
}
