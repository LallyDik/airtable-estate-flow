
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID'; // Replace with your actual Base ID
const AIRTABLE_API_KEY = 'YOUR_API_KEY'; // Replace with your actual API Key

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const headers = {
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

export class AirtableService {
  // Users API
  static async getUsers() {
    const response = await fetch(`${BASE_URL}/Users`, { headers });
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  // Properties API
  static async getProperties(brokerId: string) {
    const filterFormula = `{broker} = '${brokerId}'`;
    const response = await fetch(
      `${BASE_URL}/Properties?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  static async createProperty(property: Omit<Property, 'id'>) {
    const response = await fetch(`${BASE_URL}/Properties`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: property
      })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async updateProperty(id: string, fields: Partial<Property>) {
    const response = await fetch(`${BASE_URL}/Properties/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async deleteProperty(id: string) {
    await fetch(`${BASE_URL}/Properties/${id}`, {
      method: 'DELETE',
      headers
    });
  }

  // Posts API
  static async getPosts(brokerId: string) {
    const filterFormula = `{broker} = '${brokerId}'`;
    const response = await fetch(
      `${BASE_URL}/Posts?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  static async createPost(post: Omit<Post, 'id'>) {
    const response = await fetch(`${BASE_URL}/Posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: post
      })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async updatePost(id: string, fields: Partial<Post>) {
    const response = await fetch(`${BASE_URL}/Posts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async deletePost(id: string) {
    await fetch(`${BASE_URL}/Posts/${id}`, {
      method: 'DELETE',
      headers
    });
  }

  // Images API
  static async getImages(propertyId: string) {
    const filterFormula = `{property} = '${propertyId}'`;
    const response = await fetch(
      `${BASE_URL}/Images?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }
}
