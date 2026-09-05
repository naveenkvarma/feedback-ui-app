import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Navbar from '../components/Navbar';
import { BookOpen, ArrowRight } from 'lucide-react';

const getTeacherSubjects = (teacher) => {
  if (!teacher || !teacher.subject) return [];
  if (Array.isArray(teacher.subject)) return teacher.subject;
  return teacher.subject.split(',').map(s => s.trim()).filter(Boolean);
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teachers, feedbacks } = useData();

  const handleSelectTeacherSubject = (teacher, subject) => {
    navigate(`/feedback/${teacher.id}`, { state: { teacher, subject } });
  };

  return (
    <>
      <Navbar />
      <div className="container page-wrapper">
        <div style={{ marginBottom: '2rem' }} className="animate-fade-in">
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {user.name}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Select a teacher below to provide your valuable feedback.</p>
        </div>

        {teachers.length === 0 ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>No teachers are currently available for evaluation.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {teachers.map((teacher, index) => {
              const teacherSubjects = getTeacherSubjects(teacher);
              return (
                <div 
                  key={teacher.id} 
                  className="glass-card animate-fade-in" 
                  style={{ animationDelay: `${index * 0.1}s`, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{teacher.name}</h3>
                      <span className="badge badge-primary" style={{ marginTop: '0.25rem' }}>{teacher.department}</span>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                      <BookOpen size={16} />
                      <span>Subjects Taught:</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {teacherSubjects.map(subject => {
                        const hasSubmittedSubject = feedbacks.some(f => 
                          f.student_email === user.email && 
                          f.teacher_id === teacher.id && 
                          f.subject === subject
                        );
                        return (
                          <div 
                            key={subject} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.5rem 0.75rem', 
                              backgroundColor: 'rgba(255, 255, 255, 0.4)', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)' 
                            }}
                          >
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{subject}</span>
                            {hasSubmittedSubject ? (
                              <span 
                                style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '0.25rem 0.5rem', 
                                  backgroundColor: '#d1fae5', 
                                  color: '#065f46', 
                                  borderRadius: 'var(--radius-full)',
                                  fontWeight: 600
                                }}
                              >
                                Submitted ✅
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleSelectTeacherSubject(teacher, subject)}
                                className="btn btn-primary" 
                                style={{ 
                                  padding: '0.25rem 0.75rem', 
                                  fontSize: '0.75rem', 
                                  borderRadius: 'var(--radius-full)',
                                  minHeight: 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                Evaluate <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {teacherSubjects.length === 0 && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No subjects assigned.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
