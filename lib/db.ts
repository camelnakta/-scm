// ============================================================
//  공정 흐름 SCM — In-memory Database
// ============================================================
import bcrypt from 'bcryptjs';

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

// ─── Process (공정 정의) ──────────────────────────────────────
export interface ProcessStep {
  stepNo: number;          // 단계 번호
  name: string;            // 단계명
  description: string;     // 설명
  stdTime: number;         // 표준 소요 시간 (분)
  equipmentId: string;     // 사용 설비
  equipmentName: string;
}

export interface Process {
  id: string;
  processCode: string;     // 공정 코드 (e.g. PROC-001)
  name: string;            // 공정명
  category: string;        // 분류 (가공, 조립, 검사, 도장, 포장 …)
  description: string;
  steps: ProcessStep[];    // 공정 단계 목록
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

// ─── WorkOrder (작업 지시) ────────────────────────────────────
export interface StepProgress {
  stepNo: number;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'skipped';
  startedAt: string;
  completedAt: string;
  progressRate: number;    // 0 ~ 100
  workerName: string;
  note: string;
  defectCount: number;
}

export interface WorkOrder {
  id: string;
  workOrderNo: string;     // WO-2024-0001
  processId: string;
  processName: string;
  productName: string;     // 생산 제품명
  targetQty: number;       // 목표 수량
  completedQty: number;    // 완료 수량
  defectQty: number;       // 불량 수량
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progressRate: number;    // 전체 진행률 0~100
  currentStep: number;     // 현재 진행 중인 단계
  steps: StepProgress[];
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  assignedTo: string;      // 담당자
  createdBy: string;
  notes: string;
  createdAt: string;
}

// ─── Material (자재) ──────────────────────────────────────────
export interface Material {
  id: string;
  materialCode: string;    // MAT-001
  name: string;
  category: string;
  unit: string;            // kg, ea, m, l …
  stockQty: number;
  minQty: number;
  unitCost: number;
  supplierId: string;
  supplierName: string;
  location: string;
  status: 'normal' | 'low' | 'out';
  lastUpdated: string;
}

// ─── Equipment (설비) ─────────────────────────────────────────
export interface Equipment {
  id: string;
  equipmentCode: string;   // EQP-001
  name: string;
  category: string;        // CNC, 프레스, 용접기, 컨베이어 …
  location: string;
  status: 'running' | 'idle' | 'maintenance' | 'breakdown';
  utilizationRate: number; // 0~100 %
  lastMaintenance: string;
  nextMaintenance: string;
  assignedProcess: string;
}

// ─── Seed Data ───────────────────────────────────────────────
const initUsers = (): User[] => [
  {
    id: '1', username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    name: '시스템 관리자', email: 'admin@scm.com',
    role: 'admin', department: '생산관리팀',
    status: 'active', createdAt: '2024-01-01T00:00:00Z', createdBy: 'system',
  },
  {
    id: '2', username: 'user1',
    password: bcrypt.hashSync('user1234', 10),
    name: '김생산', email: 'user1@scm.com',
    role: 'user', department: '제조1팀',
    status: 'active', createdAt: '2024-01-10T00:00:00Z', createdBy: 'admin',
  },
  {
    id: '3', username: 'user2',
    password: bcrypt.hashSync('user1234', 10),
    name: '이공정', email: 'user2@scm.com',
    role: 'user', department: '제조2팀',
    status: 'active', createdAt: '2024-01-15T00:00:00Z', createdBy: 'admin',
  },
];

const initEquipment = (): Equipment[] => [
  { id: 'eqp1', equipmentCode: 'EQP-001', name: 'CNC 선반 #1', category: 'CNC', location: '1공장 A구역', status: 'running', utilizationRate: 82, lastMaintenance: '2024-03-01T00:00:00Z', nextMaintenance: '2024-04-01T00:00:00Z', assignedProcess: 'PROC-001' },
  { id: 'eqp2', equipmentCode: 'EQP-002', name: '유압 프레스 #1', category: '프레스', location: '1공장 B구역', status: 'running', utilizationRate: 67, lastMaintenance: '2024-02-15T00:00:00Z', nextMaintenance: '2024-03-15T00:00:00Z', assignedProcess: 'PROC-001' },
  { id: 'eqp3', equipmentCode: 'EQP-003', name: 'TIG 용접기 #2', category: '용접기', location: '2공장 A구역', status: 'maintenance', utilizationRate: 0, lastMaintenance: '2024-03-20T00:00:00Z', nextMaintenance: '2024-03-27T00:00:00Z', assignedProcess: 'PROC-002' },
  { id: 'eqp4', equipmentCode: 'EQP-004', name: '도장 부스 #1', category: '도장', location: '2공장 C구역', status: 'running', utilizationRate: 55, lastMaintenance: '2024-03-10T00:00:00Z', nextMaintenance: '2024-04-10T00:00:00Z', assignedProcess: 'PROC-002' },
  { id: 'eqp5', equipmentCode: 'EQP-005', name: '조립 라인 #3', category: '조립', location: '3공장 A구역', status: 'idle', utilizationRate: 0, lastMaintenance: '2024-03-05T00:00:00Z', nextMaintenance: '2024-04-05T00:00:00Z', assignedProcess: 'PROC-003' },
  { id: 'eqp6', equipmentCode: 'EQP-006', name: '3D 비전 검사기', category: '검사', location: '3공장 B구역', status: 'running', utilizationRate: 91, lastMaintenance: '2024-03-12T00:00:00Z', nextMaintenance: '2024-04-12T00:00:00Z', assignedProcess: 'PROC-003' },
];

const initProcesses = (): Process[] => [
  {
    id: 'proc1',
    processCode: 'PROC-001',
    name: '샤프트 가공 공정',
    category: '가공',
    description: '원자재 샤프트를 규격에 맞게 CNC 선반 및 프레스로 가공하는 공정',
    steps: [
      { stepNo: 1, name: '원자재 투입', description: '원자재 입고 확인 및 작업대 투입', stdTime: 15, equipmentId: '', equipmentName: '' },
      { stepNo: 2, name: 'CNC 선반 가공', description: '치수 공차 내 선반 가공', stdTime: 45, equipmentId: 'eqp1', equipmentName: 'CNC 선반 #1' },
      { stepNo: 3, name: '프레스 성형', description: '형상 성형 및 압착', stdTime: 30, equipmentId: 'eqp2', equipmentName: '유압 프레스 #1' },
      { stepNo: 4, name: '치수 검사', description: '1차 치수 검사 및 불량 선별', stdTime: 20, equipmentId: '', equipmentName: '' },
      { stepNo: 5, name: '세척 및 마감', description: '절삭유 세척 및 표면 마감', stdTime: 15, equipmentId: '', equipmentName: '' },
    ],
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'proc2',
    processCode: 'PROC-002',
    name: '차체 도장 공정',
    category: '도장',
    description: '용접 완성된 차체 패널에 방청 처리 및 도장 작업을 수행하는 공정',
    steps: [
      { stepNo: 1, name: '표면 전처리', description: '탈지 및 인산염 피막 처리', stdTime: 40, equipmentId: '', equipmentName: '' },
      { stepNo: 2, name: '전착 도장', description: '전기 전착 방식 하도 도장', stdTime: 60, equipmentId: '', equipmentName: '' },
      { stepNo: 3, name: '중도 도장', description: '중도 도장 및 건조', stdTime: 50, equipmentId: 'eqp4', equipmentName: '도장 부스 #1' },
      { stepNo: 4, name: '상도 도장', description: '색상 도장 및 클리어 코팅', stdTime: 50, equipmentId: 'eqp4', equipmentName: '도장 부스 #1' },
      { stepNo: 5, name: '도막 검사', description: '도막 두께 및 외관 검사', stdTime: 25, equipmentId: '', equipmentName: '' },
    ],
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'proc3',
    processCode: 'PROC-003',
    name: '완성품 조립 공정',
    category: '조립',
    description: '가공·도장 완료된 부품을 조립하고 최종 검사를 수행하는 공정',
    steps: [
      { stepNo: 1, name: '부품 준비', description: '소요 부품 BOM 대조 및 준비', stdTime: 20, equipmentId: '', equipmentName: '' },
      { stepNo: 2, name: '1차 조립', description: '주요 구조물 볼트 체결', stdTime: 60, equipmentId: 'eqp5', equipmentName: '조립 라인 #3' },
      { stepNo: 3, name: '전장 배선', description: '전기 배선 및 커넥터 체결', stdTime: 45, equipmentId: '', equipmentName: '' },
      { stepNo: 4, name: '2차 조립', description: '외장 패널 및 마감재 조립', stdTime: 40, equipmentId: 'eqp5', equipmentName: '조립 라인 #3' },
      { stepNo: 5, name: '최종 검사', description: '3D 비전 검사 및 기능 시험', stdTime: 30, equipmentId: 'eqp6', equipmentName: '3D 비전 검사기' },
      { stepNo: 6, name: '포장 출하', description: '포장 및 출하 라벨링', stdTime: 15, equipmentId: '', equipmentName: '' },
    ],
    status: 'active',
    createdAt: '2024-01-20T00:00:00Z',
    createdBy: 'admin',
  },
];

const initWorkOrders = (): WorkOrder[] => [
  {
    id: 'wo1',
    workOrderNo: 'WO-2024-0001',
    processId: 'proc1',
    processName: '샤프트 가공 공정',
    productName: '구동 샤프트 Φ40',
    targetQty: 500,
    completedQty: 500,
    defectQty: 8,
    priority: 'normal',
    status: 'completed',
    progressRate: 100,
    currentStep: 5,
    steps: [
      { stepNo: 1, stepName: '원자재 투입',  status: 'completed', startedAt: '2024-03-01T08:00:00Z', completedAt: '2024-03-01T08:15:00Z', progressRate: 100, workerName: '김생산', note: '', defectCount: 0 },
      { stepNo: 2, stepName: 'CNC 선반 가공', status: 'completed', startedAt: '2024-03-01T08:15:00Z', completedAt: '2024-03-01T09:00:00Z', progressRate: 100, workerName: '김생산', note: '치수 공차 정상', defectCount: 3 },
      { stepNo: 3, stepName: '프레스 성형',  status: 'completed', startedAt: '2024-03-01T09:00:00Z', completedAt: '2024-03-01T09:30:00Z', progressRate: 100, workerName: '이공정', note: '', defectCount: 2 },
      { stepNo: 4, stepName: '치수 검사',    status: 'completed', startedAt: '2024-03-01T09:30:00Z', completedAt: '2024-03-01T09:50:00Z', progressRate: 100, workerName: '이공정', note: '불량 3건 제거', defectCount: 3 },
      { stepNo: 5, stepName: '세척 및 마감', status: 'completed', startedAt: '2024-03-01T09:50:00Z', completedAt: '2024-03-01T10:05:00Z', progressRate: 100, workerName: '김생산', note: '', defectCount: 0 },
    ],
    plannedStart: '2024-03-01T08:00:00Z',
    plannedEnd: '2024-03-01T10:30:00Z',
    actualStart: '2024-03-01T08:00:00Z',
    actualEnd: '2024-03-01T10:05:00Z',
    assignedTo: '김생산',
    createdBy: 'admin',
    notes: '1분기 정기 생산',
    createdAt: '2024-02-28T00:00:00Z',
  },
  {
    id: 'wo2',
    workOrderNo: 'WO-2024-0002',
    processId: 'proc2',
    processName: '차체 도장 공정',
    productName: '차체 패널 - 화이트 펄',
    targetQty: 120,
    completedQty: 72,
    defectQty: 4,
    priority: 'high',
    status: 'in_progress',
    progressRate: 60,
    currentStep: 3,
    steps: [
      { stepNo: 1, stepName: '표면 전처리', status: 'completed', startedAt: '2024-03-20T08:00:00Z', completedAt: '2024-03-20T08:45:00Z', progressRate: 100, workerName: '이공정', note: '', defectCount: 0 },
      { stepNo: 2, stepName: '전착 도장',  status: 'completed', startedAt: '2024-03-20T08:45:00Z', completedAt: '2024-03-20T09:50:00Z', progressRate: 100, workerName: '이공정', note: '전착 두께 18μm', defectCount: 1 },
      { stepNo: 3, stepName: '중도 도장',  status: 'in_progress', startedAt: '2024-03-20T09:50:00Z', completedAt: '', progressRate: 65, workerName: '이공정', note: '진행 중', defectCount: 2 },
      { stepNo: 4, stepName: '상도 도장',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 5, stepName: '도막 검사',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
    ],
    plannedStart: '2024-03-20T08:00:00Z',
    plannedEnd: '2024-03-20T17:00:00Z',
    actualStart: '2024-03-20T08:00:00Z',
    actualEnd: '',
    assignedTo: '이공정',
    createdBy: 'admin',
    notes: '납기 우선 처리',
    createdAt: '2024-03-19T00:00:00Z',
  },
  {
    id: 'wo3',
    workOrderNo: 'WO-2024-0003',
    processId: 'proc3',
    processName: '완성품 조립 공정',
    productName: '전동 액추에이터 모델 A',
    targetQty: 80,
    completedQty: 0,
    defectQty: 0,
    priority: 'urgent',
    status: 'in_progress',
    progressRate: 28,
    currentStep: 2,
    steps: [
      { stepNo: 1, stepName: '부품 준비',  status: 'completed', startedAt: '2024-03-22T08:00:00Z', completedAt: '2024-03-22T08:22:00Z', progressRate: 100, workerName: '김생산', note: 'BOM 대조 완료', defectCount: 0 },
      { stepNo: 2, stepName: '1차 조립',   status: 'in_progress', startedAt: '2024-03-22T08:22:00Z', completedAt: '', progressRate: 40, workerName: '김생산', note: '볼트 체결 진행 중', defectCount: 0 },
      { stepNo: 3, stepName: '전장 배선',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 4, stepName: '2차 조립',   status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 5, stepName: '최종 검사',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 6, stepName: '포장 출하',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
    ],
    plannedStart: '2024-03-22T08:00:00Z',
    plannedEnd: '2024-03-22T18:00:00Z',
    actualStart: '2024-03-22T08:00:00Z',
    actualEnd: '',
    assignedTo: '김생산',
    createdBy: 'admin',
    notes: '긴급 납기 대응',
    createdAt: '2024-03-21T00:00:00Z',
  },
  {
    id: 'wo4',
    workOrderNo: 'WO-2024-0004',
    processId: 'proc1',
    processName: '샤프트 가공 공정',
    productName: '스티어링 샤프트 Φ28',
    targetQty: 200,
    completedQty: 0,
    defectQty: 0,
    priority: 'normal',
    status: 'pending',
    progressRate: 0,
    currentStep: 0,
    steps: [
      { stepNo: 1, stepName: '원자재 투입',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 2, stepName: 'CNC 선반 가공', status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 3, stepName: '프레스 성형',  status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 4, stepName: '치수 검사',    status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
      { stepNo: 5, stepName: '세척 및 마감', status: 'pending', startedAt: '', completedAt: '', progressRate: 0, workerName: '', note: '', defectCount: 0 },
    ],
    plannedStart: '2024-03-25T08:00:00Z',
    plannedEnd: '2024-03-25T15:00:00Z',
    actualStart: '',
    actualEnd: '',
    assignedTo: '이공정',
    createdBy: 'admin',
    notes: '',
    createdAt: '2024-03-23T00:00:00Z',
  },
];

const initMaterials = (): Material[] => [
  { id: 'mat1', materialCode: 'MAT-001', name: 'S45C 환봉 Φ50', category: '금속', unit: 'EA', stockQty: 320, minQty: 100, unitCost: 28000, supplierId: 's1', supplierName: '한국철강(주)', location: 'A-01', status: 'normal', lastUpdated: '2024-03-20T00:00:00Z' },
  { id: 'mat2', materialCode: 'MAT-002', name: 'SUS304 판재 2T', category: '금속', unit: 'kg', stockQty: 45, minQty: 200, unitCost: 5500, supplierId: 's1', supplierName: '한국철강(주)', location: 'A-02', status: 'low', lastUpdated: '2024-03-19T00:00:00Z' },
  { id: 'mat3', materialCode: 'MAT-003', name: '에폭시 프라이머', category: '도료', unit: 'L', stockQty: 0, minQty: 50, unitCost: 18000, supplierId: 's2', supplierName: '도료전문(주)', location: 'B-01', status: 'out', lastUpdated: '2024-03-18T00:00:00Z' },
  { id: 'mat4', materialCode: 'MAT-004', name: '볼트 M8×25', category: '체결류', unit: 'EA', stockQty: 12000, minQty: 2000, unitCost: 85, supplierId: 's3', supplierName: '볼트파스너(주)', location: 'C-03', status: 'normal', lastUpdated: '2024-03-21T00:00:00Z' },
  { id: 'mat5', materialCode: 'MAT-005', name: '절연 전선 AWG22', category: '전장', unit: 'm', stockQty: 800, minQty: 500, unitCost: 650, supplierId: 's4', supplierName: '전장부품(주)', location: 'D-02', status: 'normal', lastUpdated: '2024-03-17T00:00:00Z' },
];

// ─── Global Store ────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __db: {
    users: User[];
    processes: Process[];
    workOrders: WorkOrder[];
    materials: Material[];
    equipment: Equipment[];
  } | undefined;
}

if (!global.__db) {
  global.__db = {
    users: initUsers(),
    processes: initProcesses(),
    workOrders: initWorkOrders(),
    materials: initMaterials(),
    equipment: initEquipment(),
  };
}

export const db = global.__db;
