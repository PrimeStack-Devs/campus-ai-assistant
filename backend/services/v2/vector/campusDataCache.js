export const campusData = {
  buildings: [],
  departments: [],
  faculty: [],
  facilities: [],
  services: [],
  paths: [],
  routeSummaries: [],
  schedules: { bus_routes: [], office_hours: [], academic_calendar: {} },
};

export function resetCampusData() {
  campusData.buildings = [];
  campusData.departments = [];
  campusData.faculty = [];
  campusData.facilities = [];
  campusData.services = [];
  campusData.paths = [];
  campusData.routeSummaries = [];
  campusData.schedules = { bus_routes: [], office_hours: [], academic_calendar: {} };
}

