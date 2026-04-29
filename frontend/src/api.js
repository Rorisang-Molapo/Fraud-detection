// API service for communicating with the backend
import axios from 'axios';

// Base URL for backend API
const API_BASE_URL = 'http://localhost:5000/api';


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});


class ApiService {
  // Get all customers with their risk scores
  static async getAllCustomers() {
    try {
      const response = await apiClient.get('/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Get customer by ID
  static async getCustomerById(id) {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  // Search customers by name, ID, or email
  static async searchCustomers(query) {
    try {
      const response = await apiClient.get(`/search/${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Get all fraud alerts
  static async getFraudAlerts() {
    try {
      const response = await apiClient.get('/fraud-alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      throw error;
    }
  }

  // Get transaction network for a specific account
  static async getTransactionNetwork(accountNumber) {
    try {
      const response = await apiClient.get(`/network/${accountNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching network:', error);
      throw error;
    }
  }

  
  static async getStatistics() {
    try {
      const response = await apiClient.get('/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }
}

export default ApiService;