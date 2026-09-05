import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Data Fetching ---
  const fetchTeachers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(data);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "feedbacks"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort feedbacks descending by timestamp if they have one
      data.sort((a, b) => b.timestamp - a.timestamp);
      setFeedbacks(data);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "logs"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }, []);

  // Internal log helper
  const addLog = async (message) => {
    try {
      const logEntry = { message, timestamp: Date.now() };
      const docRef = await addDoc(collection(db, "logs"), logEntry);
      setLogs(prev => [{ id: docRef.id, ...logEntry }, ...prev]);
    } catch (err) {
      console.error("Failed to add log:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTeachers(), fetchStudents(), fetchFeedbacks(), fetchLogs()])
      .finally(() => setLoading(false));
  }, [fetchTeachers, fetchStudents, fetchFeedbacks, fetchLogs]);

  // --- Teachers API ---
  const addTeacher = async (teacher) => {
    if (!teacher.email || !teacher.email.toLowerCase().endsWith('@gmail.com')) {
      return { success: false, error: 'Teacher email must be a valid @gmail.com address.' };
    }

    const emailExists = teacher.email && (students.some(s => s.email === teacher.email) || teachers.some(t => t.email === teacher.email));
    const passwordExists = teacher.password && (students.some(s => s.password === teacher.password) || teachers.some(t => t.password === teacher.password));
    
    if (emailExists || passwordExists) {
      return { success: false, error: 'A user with this email or password already exists in the application.' };
    }

    try {
      const docRef = await addDoc(collection(db, "teachers"), teacher);
      setTeachers([...teachers, { id: docRef.id, ...teacher }]);
      addLog(`Admin added a new teacher: ${teacher.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateTeacher = async (id, updatedTeacher) => {
    if (!updatedTeacher.email || !updatedTeacher.email.toLowerCase().endsWith('@gmail.com')) {
      return { success: false, error: 'Teacher email must be a valid @gmail.com address.' };
    }

    const emailExists = updatedTeacher.email && (students.some(s => s.email === updatedTeacher.email) || teachers.some(t => t.id !== id && t.email === updatedTeacher.email));
    const passwordExists = updatedTeacher.password && (students.some(s => s.password === updatedTeacher.password) || teachers.some(t => t.id !== id && t.password === updatedTeacher.password));
    
    if (emailExists || passwordExists) {
      return { success: false, error: 'A user with this email or password already exists in the application.' };
    }

    try {
      const docRef = doc(db, "teachers", id);
      await updateDoc(docRef, updatedTeacher);
      setTeachers(teachers.map(t => t.id === id ? { ...updatedTeacher, id } : t));
      addLog(`Admin updated teacher details for: ${updatedTeacher.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTeacher = async (id) => {
    const teacher = teachers.find(t => t.id === id);
    try {
      await deleteDoc(doc(db, "teachers", id));
      setTeachers(teachers.filter(t => t.id !== id));
      if (teacher) addLog(`Admin deleted teacher: ${teacher.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // --- Students API ---
  const addStudent = async (student) => {
    if (!student.email || !student.email.toLowerCase().endsWith('@gmail.com')) {
      return { success: false, error: 'Student email must be a valid @gmail.com address.' };
    }

    const emailExists = student.email && (students.some(s => s.email === student.email) || teachers.some(t => t.email === student.email));
    const passwordExists = student.password && (students.some(s => s.password === student.password) || teachers.some(t => t.password === student.password));
    const regNoExists = student.regNo && students.some(s => s.regNo === student.regNo);
    
    if (emailExists || passwordExists) {
      return { success: false, error: 'A user with this email or password already exists in the application.' };
    }
    
    if (regNoExists) {
      return { success: false, error: 'This PRN / Registration Number is already assigned to another student.' };
    }
    
    try {
      const docRef = await addDoc(collection(db, "students"), student);
      setStudents([...students, { id: docRef.id, ...student }]);
      addLog(`Admin registered a new student: ${student.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateStudent = async (id, updatedStudent) => {
    if (!updatedStudent.email || !updatedStudent.email.toLowerCase().endsWith('@gmail.com')) {
      return { success: false, error: 'Student email must be a valid @gmail.com address.' };
    }

    const emailExists = updatedStudent.email && (students.some(s => s.id !== id && s.email === updatedStudent.email) || teachers.some(t => t.email === updatedStudent.email));
    const passwordExists = updatedStudent.password && (students.some(s => s.id !== id && s.password === updatedStudent.password) || teachers.some(t => t.password === updatedStudent.password));
    const regNoExists = updatedStudent.regNo && students.some(s => s.id !== id && s.regNo === updatedStudent.regNo);
    
    if (emailExists || passwordExists) {
      return { success: false, error: 'A user with this email or password already exists in the application.' };
    }
    
    if (regNoExists) {
      return { success: false, error: 'This PRN / Registration Number is already assigned to another student.' };
    }

    try {
      const docRef = doc(db, "students", id);
      await updateDoc(docRef, updatedStudent);
      setStudents(students.map(s => s.id === id ? { ...updatedStudent, id } : s));
      addLog(`Admin updated student details for: ${updatedStudent.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteStudent = async (email) => {
    const student = students.find(s => s.email === email);
    if (!student) return { success: false, error: 'Student not found' };

    try {
      await deleteDoc(doc(db, "students", student.id));
      setStudents(students.filter(s => s.email !== email));
      addLog(`Admin deleted student record: ${student.name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // --- Feedbacks API ---
  const addFeedback = async (feedback) => {
    try {
      const docRef = await addDoc(collection(db, "feedbacks"), feedback);
      const newFeedback = { id: docRef.id, ...feedback };
      setFeedbacks([newFeedback, ...feedbacks]);
      addLog(`Student ${feedback.student_name} submitted evaluation for ${feedback.teacher_name}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <DataContext.Provider value={{
      loading,
      teachers, addTeacher, updateTeacher, deleteTeacher,
      students, addStudent, updateStudent, deleteStudent,
      feedbacks, addFeedback, fetchFeedbacks,
      logs, fetchLogs, addLog
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
