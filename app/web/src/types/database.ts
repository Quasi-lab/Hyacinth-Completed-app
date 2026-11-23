export interface PatientRecord {
  recordID: number;
  addmission: string;
  patientID: number;
  roomID: number;
  doctorID: number;
  nurseID: number;
  billID: number;
}

export interface BillDim {
  billID: number;
  purchasedAt: string;
  productName: string;
  financialCost: string;
  details: string;
}

export interface PatientDim {
  patientID: number;
  firstName: string;
  lastName: string;
  patientBdate: string;
}

export interface DoctorDim {
  doctorID: number;
  registrationDate: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  medicalSpecialization: string;
  scheduleHead?: string;
  experienceYears: number;
}

export interface NurseDim {
  nurseID: number;
  registrationDate: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  areaAssignment: string;
  experienceYears: number;
}

export interface RoomDim {
  roomId: number;
  serviceStart?: string;
  servicableBeds: number;
  currentAvailability: boolean;
  roomClass: string;
}

export interface JoinedPatientRecord {
  recordID: number;
  admission: string;
  patient: {
    patientID: number;
    fullName: string;
    birthDate: string;
  } | null;
  doctor: {
    doctorID: number;
    fullName: string;
    specialization: string;
  } | null;
  nurse: {
    nurseID: number;
    fullName: string;
    areaAssignment: string;
  } | null;
  room: {
    roomId: number;
    roomClass: string;
    currentAvailability: boolean;
    servicableBeds: number;
  } | null;
  bill: {
    billID: number;
    productName: string;
    financialCost: number;
    details: string;
    purchasedAt: string;
    affliction: string;
  } | null;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalRecords: number;
  averageBill: number;
  totalPatients: number;
  totalDoctors: number;
  totalNurses: number;
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
}

export interface TimelinePoint {
  date: string;
  cost: number;
  admissions: number;
}

export interface DoctorWorkloadItem {
  doctorID: number;
  fullName: string;
  specialization: string;
  experienceYears: number;
  patientCount: number;
  totalRevenue: number;
}

export interface DiseaseDistributionItem {
  name: string;
  count: number;
  totalCost: number;
  avgCost: number;
}

export interface AnalyticsPayload {
  timestamp: string | null;
  source: 'live' | 'demo';
  summary: AnalyticsSummary;
  charts: {
    timeline: TimelinePoint[];
    doctorWorkload: DoctorWorkloadItem[];
    diseaseDistribution: DiseaseDistributionItem[];
  };
  joinedRecords: JoinedPatientRecord[];
  dimensions: {
    doctors: DoctorDim[];
    nurses: NurseDim[];
    rooms: RoomDim[];
    totalBills: number;
  };
}
