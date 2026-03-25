
export type AddressEntry = {
  id: string;
  title: string;
  name: string;
  phone: string;
  address: string;
};

export type AddressPair = {
    id: string;
    title: string;
    sender: Omit<AddressEntry, 'id' | 'title'>;
    receiver: Omit<AddressEntry, 'id' | 'title'>;
}
