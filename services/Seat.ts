export const bookedSeats = async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    if(!response.ok){
        throw new Error('Error occured: ');
    }
    const data = await response.json();

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
    }));
}

export default bookedSeats;