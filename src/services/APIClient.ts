export interface APIClient {
  post(url: string, data?: any): Promise<any>;
  get?(url: string, params?: any): Promise<any>;
  put?(url: string, data?: any): Promise<any>;
  delete?(url: string): Promise<any>;
}

export class DefaultAPIClient implements APIClient {
  async post(url: string, data?: any): Promise<any> {
    // Implementation would go here
    throw new Error('APIClient post method not implemented');
  }

  async get(url: string, params?: any): Promise<any> {
    // Implementation would go here
    throw new Error('APIClient get method not implemented');
  }

  async put(url: string, data?: any): Promise<any> {
    // Implementation would go here
    throw new Error('APIClient put method not implemented');
  }

  async delete(url: string): Promise<any> {
    // Implementation would go here
    throw new Error('APIClient delete method not implemented');
  }
}