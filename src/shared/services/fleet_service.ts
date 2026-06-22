import { Vehicle } from '../types/database.types';

export const FleetService = {
    getVehicles: async (): Promise<Vehicle[]> => {
        // Module not yet provisioned.
        // Returning empty array to indicate "No Data Available Yet".
        return [];
    },
    getFuelLogs: async (): Promise<any[]> => {
        return [];
    }
};
