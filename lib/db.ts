import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface Student {
  id: string;
  name: string;
  restaurant: string;
  deviceFingerprint: string;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number; // seconds
  examModel?: ExamModel;
  answers?: Record<string, number>;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  passed?: boolean;
  tabSwitches?: number;
  suspiciousEvents?: SuspiciousEvent[];
  certificateGenerated?: boolean;
  status: 'started' | 'completed' | 'timeout';
}

export interface ExamModel {
  questions: ExamQuestion[];
  generatedAt: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  unit: string;
  unitAr: string;
}

export interface SuspiciousEvent {
  type: 'tab_switch' | 'copy_attempt' | 'right_click' | 'focus_loss';
  timestamp: string;
}

export interface AdminSettings {
  username: string;
  passwordHash: string;
  passingPercentage: number;
  examDurationMinutes: number;
  logoUrl?: string;
  signatureUrl?: string;
  homepageBannerUrl?: string;
  dashboardHeaderUrl?: string;
  questionsCount: number;
}

export interface Database {
  students: Student[];
  settings: AdminSettings;
  blockedDevices: string[];
  blockedStudents: { name: string; restaurant: string }[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDB(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB: Database = {
      students: [],
      settings: {
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        passingPercentage: 80,
        examDurationMinutes: 60,
        questionsCount: 55,
      },
      blockedDevices: [],
      blockedStudents: [],
    };
    saveDB(defaultDB);
    return defaultDB;
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveDB(db: Database) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'mcdo_salt_2025').digest('hex');
}

export function getSettings(): AdminSettings {
  return loadDB().settings;
}

export function updateSettings(updates: Partial<AdminSettings>) {
  const db = loadDB();
  db.settings = { ...db.settings, ...updates };
  saveDB(db);
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const settings = getSettings();
  return settings.username === username && settings.passwordHash === hashPassword(password);
}

export function isDeviceBlocked(fingerprint: string): boolean {
  const db = loadDB();
  return db.blockedDevices.includes(fingerprint);
}

export function isStudentBlocked(name: string, restaurant: string): boolean {
  const db = loadDB();
  return db.blockedStudents.some(
    s => s.name.toLowerCase() === name.toLowerCase() && 
         s.restaurant.toLowerCase() === restaurant.toLowerCase()
  );
}

export function createStudent(data: Omit<Student, 'id'>): Student {
  const db = loadDB();
  const student: Student = { ...data, id: crypto.randomUUID() };
  db.students.push(student);
  db.blockedDevices.push(data.deviceFingerprint);
  db.blockedStudents.push({ name: data.name, restaurant: data.restaurant });
  saveDB(db);
  return student;
}

export function updateStudent(id: string, updates: Partial<Student>) {
  const db = loadDB();
  const idx = db.students.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.students[idx] = { ...db.students[idx], ...updates };
    saveDB(db);
    return db.students[idx];
  }
  return null;
}

export function getStudentById(id: string): Student | null {
  const db = loadDB();
  return db.students.find(s => s.id === id) || null;
}

export function getAllStudents(): Student[] {
  return loadDB().students;
}

export function deleteStudent(id: string) {
  const db = loadDB();
  const student = db.students.find(s => s.id === id);
  if (student) {
    db.students = db.students.filter(s => s.id !== id);
    db.blockedDevices = db.blockedDevices.filter(d => d !== student.deviceFingerprint);
    db.blockedStudents = db.blockedStudents.filter(
      s => !(s.name.toLowerCase() === student.name.toLowerCase() && 
             s.restaurant.toLowerCase() === student.restaurant.toLowerCase())
    );
    saveDB(db);
  }
}

export function deleteAllStudents() {
  const db = loadDB();
  db.students = [];
  db.blockedDevices = [];
  db.blockedStudents = [];
  saveDB(db);
}

export function getStats() {
  const students = getAllStudents().filter(s => s.status === 'completed');
  const passed = students.filter(s => s.passed);
  const failed = students.filter(s => !s.passed);
  const scores = students.map(s => s.percentage || 0);
  return {
    total: getAllStudents().length,
    completed: students.length,
    passed: passed.length,
    failed: failed.length,
    highest: scores.length ? Math.max(...scores) : 0,
    lowest: scores.length ? Math.min(...scores) : 0,
  };
}
