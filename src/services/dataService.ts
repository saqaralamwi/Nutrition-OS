const DB_NOT_READY = 'قاعدة البيانات قيد إعادة البناء (Phase 2). الرجاء المحاولة لاحقاً.';

class DataService {
  async createItem(_table: string, _data: Record<string, any>): Promise<Record<string, any>> {
    throw new Error(DB_NOT_READY);
  }

  async getItems(_table: string, _query?: any): Promise<Record<string, any>[]> {
    throw new Error(DB_NOT_READY);
  }

  async getItemById(_table: string, _id: string): Promise<Record<string, any> | null> {
    throw new Error(DB_NOT_READY);
  }

  async updateItem(_table: string, _id: string, _data: Record<string, any>): Promise<void> {
    throw new Error(DB_NOT_READY);
  }

  async deleteItem(_table: string, _id: string): Promise<void> {
    throw new Error(DB_NOT_READY);
  }

  async syncNow(): Promise<void> {
    throw new Error(DB_NOT_READY);
  }
}

export const dataService = new DataService();
