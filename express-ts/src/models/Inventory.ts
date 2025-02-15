interface InventoryItem {
  productId: string;
  name: string;
  stock: number;
  location: string;
}

const inventoryDB: InventoryItem[] = [
  {
    productId: 'GROQ-001',
    name: 'Groq Pro Headphones',
    stock: 25,
    location: 'Warehouse A',
  },
  {
    productId: 'GROQ-002',
    name: 'Groq Dev Kit',
    stock: 10,
    location: 'Warehouse B',
  },
];
export class Inventroy {
  static async getInventoryStatus(productId: string): Promise<InventoryItem> {
    const item = inventoryDB.find(i => i.productId === productId);
    if (!item) throw new Error('item not found');
    return item;
  }
}
