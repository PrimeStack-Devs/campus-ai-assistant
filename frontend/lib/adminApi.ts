import { events, facilities, clubs, contacts, locations, documents, analytics } from './mockData';

// Types
export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
}

export interface Facility {
  id: number;
  name: string;
  hours: string;
  location: string;
  amenities: string[];
}

export interface Club {
  id: number;
  name: string;
  members: number;
  meets: string;
  description: string;
}

export interface Contact {
  name: string;
  phone: string;
  email: string;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface Document {
  id: number;
  title: string;
  type: string;
  uploadedDate: string;
  size: string;
}

// In-memory storage for mock data
let mockEvents = [...events];
let mockFacilities = [...facilities];
let mockClubs = [...clubs];
let mockContacts = [...contacts];
let mockLocations = [...locations];
let mockDocuments = [...documents];

// Events CRUD
export const eventApi = {
  getAll: () => mockEvents,
  getById: (id: number) => mockEvents.find(e => e.id === id),
  create: (data: Omit<Event, 'id'>) => {
    const newEvent = { ...data, id: Math.max(...mockEvents.map(e => e.id), 0) + 1 };
    mockEvents.push(newEvent);
    return newEvent;
  },
  update: (id: number, data: Partial<Event>) => {
    const index = mockEvents.findIndex(e => e.id === id);
    if (index > -1) {
      mockEvents[index] = { ...mockEvents[index], ...data };
      return mockEvents[index];
    }
    return null;
  },
  delete: (id: number) => {
    mockEvents = mockEvents.filter(e => e.id !== id);
  },
};

// Facilities CRUD
export const facilityApi = {
  getAll: () => mockFacilities,
  getById: (id: number) => mockFacilities.find(f => f.id === id),
  create: (data: Omit<Facility, 'id'>) => {
    const newFacility = { ...data, id: Math.max(...mockFacilities.map(f => f.id), 0) + 1 };
    mockFacilities.push(newFacility);
    return newFacility;
  },
  update: (id: number, data: Partial<Facility>) => {
    const index = mockFacilities.findIndex(f => f.id === id);
    if (index > -1) {
      mockFacilities[index] = { ...mockFacilities[index], ...data };
      return mockFacilities[index];
    }
    return null;
  },
  delete: (id: number) => {
    mockFacilities = mockFacilities.filter(f => f.id !== id);
  },
};

// Clubs CRUD
export const clubApi = {
  getAll: () => mockClubs,
  getById: (id: number) => mockClubs.find(c => c.id === id),
  create: (data: Omit<Club, 'id'>) => {
    const newClub = { ...data, id: Math.max(...mockClubs.map(c => c.id), 0) + 1 };
    mockClubs.push(newClub);
    return newClub;
  },
  update: (id: number, data: Partial<Club>) => {
    const index = mockClubs.findIndex(c => c.id === id);
    if (index > -1) {
      mockClubs[index] = { ...mockClubs[index], ...data };
      return mockClubs[index];
    }
    return null;
  },
  delete: (id: number) => {
    mockClubs = mockClubs.filter(c => c.id !== id);
  },
};

// Contacts CRUD
export const contactApi = {
  getAll: () => mockContacts,
  create: (data: Contact) => {
    mockContacts.push(data);
    return data;
  },
  update: (name: string, data: Partial<Contact>) => {
    const index = mockContacts.findIndex(c => c.name === name);
    if (index > -1) {
      mockContacts[index] = { ...mockContacts[index], ...data };
      return mockContacts[index];
    }
    return null;
  },
  delete: (name: string) => {
    mockContacts = mockContacts.filter(c => c.name !== name);
  },
};

// Locations CRUD
export const locationApi = {
  getAll: () => mockLocations,
  getById: (id: number) => mockLocations.find(l => l.id === id),
  create: (data: Omit<Location, 'id'>) => {
    const newLocation = { ...data, id: Math.max(...mockLocations.map(l => l.id), 0) + 1 };
    mockLocations.push(newLocation);
    return newLocation;
  },
  update: (id: number, data: Partial<Location>) => {
    const index = mockLocations.findIndex(l => l.id === id);
    if (index > -1) {
      mockLocations[index] = { ...mockLocations[index], ...data };
      return mockLocations[index];
    }
    return null;
  },
  delete: (id: number) => {
    mockLocations = mockLocations.filter(l => l.id !== id);
  },
};

// Documents CRUD
export const documentApi = {
  getAll: () => mockDocuments,
  getById: (id: number) => mockDocuments.find(d => d.id === id),
  create: (data: Omit<Document, 'id'>) => {
    const newDoc = { ...data, id: Math.max(...mockDocuments.map(d => d.id), 0) + 1 };
    mockDocuments.push(newDoc);
    return newDoc;
  },
  delete: (id: number) => {
    mockDocuments = mockDocuments.filter(d => d.id !== id);
  },
};

// Analytics
export const analyticsApi = {
  getMetrics: () => analytics,
};
