import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useData } from './DataContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addLog } = useData();

  useEffect(() => {
    const storedUser = localStorage.getItem('feedback_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      if (email === 'admin@system.com' && password === 'admin') {
        const adminUser = { role: 'admin', name: 'System Admin', email };
        setUser(adminUser);
        localStorage.setItem('feedback_user', JSON.stringify(adminUser));
        if (addLog) addLog('System Admin successfully logged in');
        return { success: true, role: 'admin' };
      } 
      
      // Check students collection
      const qStudent = query(collection(db, "students"), where("email", "==", email), where("password", "==", password));
      const studentSnapshot = await getDocs(qStudent);
      
      if (!studentSnapshot.empty) {
        const studentDoc = studentSnapshot.docs[0];
        const student = studentDoc.data();
        const studentUser = { role: 'student', name: student.name, email: student.email, id: studentDoc.id };
        setUser(studentUser);
        localStorage.setItem('feedback_user', JSON.stringify(studentUser));
        if (addLog) addLog(`Student ${student.name} logged in`);
        return { success: true, role: 'student' };
      }

      // Check teachers collection
      const qTeacher = query(collection(db, "teachers"), where("email", "==", email), where("password", "==", password));
      const teacherSnapshot = await getDocs(qTeacher);
      
      if (!teacherSnapshot.empty) {
        const teacherDoc = teacherSnapshot.docs[0];
        const teacher = teacherDoc.data();
        const teacherUser = { role: 'teacher', name: teacher.name, email: teacher.email, id: teacherDoc.id };
        setUser(teacherUser);
        localStorage.setItem('feedback_user', JSON.stringify(teacherUser));
        if (addLog) addLog(`Teacher ${teacher.name} logged in`);
        return { success: true, role: 'teacher' };
      }
      
      // Handle legacy fallback for demo teachers (if any were manually inserted into FB without password)
      const qLegacyTeacher = query(collection(db, "teachers"), where("email", "==", email));
      const legacyTeacherSnapshot = await getDocs(qLegacyTeacher);
      
      if (!legacyTeacherSnapshot.empty) {
        const teacherDoc = legacyTeacherSnapshot.docs[0];
        const teacher = teacherDoc.data();
        // If they used 'teacher' as a fallback password for an account that doesn't have a password
        if ((!teacher.password || teacher.password === '') && password === 'teacher') {
          const teacherUser = { role: 'teacher', name: teacher.name, email: teacher.email, id: teacherDoc.id };
          setUser(teacherUser);
          localStorage.setItem('feedback_user', JSON.stringify(teacherUser));
          if (addLog) addLog(`Teacher ${teacher.name} logged in (legacy fallback)`);
          return { success: true, role: 'teacher' };
        }
      }

      if (addLog) addLog(`Failed login attempt for email: ${email}`);
      return { success: false, error: 'Invalid email or password' };
      
    } catch (error) {
      console.error("Login Error:", error);
      if (addLog) addLog(`Network error during login attempt for: ${email}`);
      return { success: false, error: 'Network error. Could not connect to authentication server.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('feedback_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
