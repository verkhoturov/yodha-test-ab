
import {  FunnelDataResponse } from "../model";

export const getABTestRouting = async () => {

    if (!process.env.CRM_TOKEN || !process.env.CRM_WEB_SETTINGS_URL) {
        throw new Error(`Error: env are lost!`);
      }

    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRM_TOKEN}`
      }
    };

    const URL = process.env.CRM_WEB_SETTINGS_URL;
  
    try {
      const response = await fetch(URL, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FunnelDataResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      throw error;
    }
  }