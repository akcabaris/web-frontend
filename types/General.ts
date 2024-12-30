type Ticket = {
  price: number;
  seatNumbers: number[];
  Passengers: Passenger[];
}

type Passenger = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  gender: string;
  birthDate: Date;
};

type User = {
  id: number;
  name: string;
}
/*
type User = {
    id: number;
    name : string;
    username : string;
    email : string;
    address : AddressType;
    phone : string;
    website : string;
    company : CompanyType;
    
}

type AddressType = {
    street : string;
    suite : string;
    city : string;
    zipcode: string;
    geo : GeoType;
}

type GeoType = {
    lat : number;
    lng : number;
}

type CompanyType = {
    name : string;
    catchPhrase : string;
    bs : string;
}

*/