export interface AddressDTO {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coords: [number, number];
}

export class Address implements AddressDTO {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  coords: [number, number];

  constructor(address: AddressDTO) {
    this.street1 = address.street1;
    this.street2 = address.street2;
    this.city = address.city;
    this.state = address.state;
    this.zip = address.zip;
    this.country = address.country;
    this.coords = address.coords;
  }
}
